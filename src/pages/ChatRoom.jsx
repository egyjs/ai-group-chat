import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { deleteMessage, markRoomAsRead, sendMessage, subscribeToMessages, subscribeToRoom, subscribeToRoomMockMessages, updateMessage } from '../services/firestore';
import { uploadFile } from '../services/storage';
import { createAvatarUrl } from '../utils/avatar';
import Button from '../components/ui/Button';
import Avatar from '../components/ui/Avatar';
import Card from '../components/ui/Card';

const formatMessageTime = (timestamp) => {
    if (!timestamp?.seconds) return 'Just now';
    return new Date(timestamp.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

export default function ChatRoom() {
    const { roomId } = useParams();
    const { currentUser } = useAuth();
    const bypassAuth = typeof import.meta !== 'undefined' && import.meta.env?.VITE_BYPASS_AUTH === 'true';
    const [room, setRoom] = useState(null);
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [replyTo, setReplyTo] = useState(null);
    const [editingMessage, setEditingMessage] = useState(null);
    const [newMessage, setNewMessage] = useState('');
    const fileInputRef = useRef(null);
    const messagesEndRef = useRef(null);
    const textareaRef = useRef(null);

    useEffect(() => {
        let unsubscribeMessages = () => { };
        let unsubscribeRoom = () => { };

        const unsubscribeRoomSnapshot = subscribeToRoom(roomId, (roomData) => {
            setRoom(roomData);
            setLoading(false);
        });
        unsubscribeRoom = unsubscribeRoomSnapshot;

        const unsubscribeSnapshots = subscribeToMessages(roomId, (incoming) => {
            const list = incoming.length === 0 && bypassAuth
                ? subscribeToRoomMockMessages(roomId, currentUser)
                : incoming;
            setMessages(list);
            if (list.length > 0 && currentUser) {
                markRoomAsRead(roomId, currentUser.uid);
            }
        });

        unsubscribeMessages = unsubscribeSnapshots;

        return () => {
            unsubscribeMessages();
            unsubscribeRoom();
        };
    }, [roomId, currentUser, bypassAuth]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Auto-resize textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
        }
    }, [newMessage]);

    const { senderNameById, messagesById } = useMemo(() => {
        const nameMap = {};
        const idMap = {};
        messages.forEach((message) => {
            if (message.id) {
                idMap[message.id] = message;
            }
            if (message.senderId && message.senderName && !nameMap[message.senderId]) {
                nameMap[message.senderId] = message.senderName;
            }
        });
        return { senderNameById: nameMap, messagesById: idMap };
    }, [messages]);

    const getReplyPreview = (originalMessage) => {
        if (!originalMessage) return 'message';
        const text = originalMessage.text?.trim();
        if (text) {
            return text.length > 80 ? `${text.slice(0, 77)}...` : text;
        }
        if (originalMessage.attachments?.length) {
            return originalMessage.attachments[0].name || 'attachment';
        }
        return 'message';
    };

    const participants = useMemo(() => {
        if (!room || !room.members) return [];
        return room.members.map((memberId) => {
            const fallbackLabel = `Member ${memberId.slice(0, 6)}`;
            let displayName = fallbackLabel;

            if (memberId === currentUser?.uid) {
                displayName = currentUser?.displayName || 'You';
            } else if (room?.createdBy?.uid === memberId && room?.createdBy?.displayName) {
                displayName = room.createdBy.displayName;
            } else if (room?.memberProfiles?.[memberId]?.displayName) {
                displayName = room.memberProfiles[memberId].displayName;
            } else if (senderNameById[memberId]) {
                displayName = senderNameById[memberId];
            }

            const avatarUrl = createAvatarUrl(displayName);
            const role = memberId === room?.createdBy?.uid ? 'Admin' : 'Member';
            return { id: memberId, name: displayName, avatarUrl, role };
        });
    }, [room, currentUser, senderNameById]);

    const handleSend = async () => {
        if (!newMessage.trim() || !currentUser) return;

        if (editingMessage) {
            await updateMessage(editingMessage.id, newMessage);
            setEditingMessage(null);
        } else {
            await sendMessage(roomId, currentUser, newMessage, [], replyTo ? replyTo.id : null);
            setReplyTo(null);
        }
        setNewMessage('');
        if (textareaRef.current) textareaRef.current.style.height = 'auto';
    };

    const handleFileUpload = async (event) => {
        const file = event.target.files?.[0];
        if (!file || !currentUser) return;

        try {
            const uploadedFile = await uploadFile(file, `rooms/${roomId}`);
            await sendMessage(roomId, currentUser, '', [uploadedFile]);
        } catch (error) {
            console.error('File upload failed', error);
            alert('Failed to upload file');
        }
    };

    const handleDelete = async (messageId) => {
        if (window.confirm('Delete this message?')) {
            await deleteMessage(messageId);
        }
    };

    const handleInvite = async () => {
        const url = `${window.location.origin}/join/${roomId}`;
        try {
            await navigator.clipboard.writeText(url);
            alert('Invite link copied!');
        } catch (error) {
            console.error('Invite link copy failed', error);
            alert('Unable to copy invite link');
        }
    };

    const clearComposerState = () => {
        if (replyTo) setReplyTo(null);
        if (editingMessage) {
            setEditingMessage(null);
            setNewMessage('');
        }
    };

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-background-light text-text-primary-light dark:bg-background-dark dark:text-text-primary-dark">
                <span className="material-symbols-outlined animate-spin text-4xl text-primary">progress_activity</span>
            </div>
        );
    }

    if (!room) {
        return (
            <div className="flex h-screen items-center justify-center bg-background-light text-text-primary-light dark:bg-background-dark dark:text-text-primary-dark">
                <div className="text-center">
                    <span className="material-symbols-outlined text-6xl text-text-muted-light dark:text-text-muted-dark">error_outline</span>
                    <h2 className="mt-4 text-xl font-bold">Room not found</h2>
                    <Link to="/" className="mt-4 inline-block text-primary hover:underline">Return Home</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="relative flex h-full w-full overflow-hidden bg-background-light font-sans text-text-primary-light dark:bg-background-dark dark:text-text-primary-dark">
            <div className="pointer-events-none absolute inset-0 bg-dot-grid-light opacity-[0.03] dark:bg-dot-grid-dark dark:opacity-[0.06]" aria-hidden />
            <main className="flex h-full flex-1 flex-col relative">
                {/* Header */}
                <header className="flex items-center justify-between border-b border-border-light bg-surface-light/95 px-6 py-3 backdrop-blur-sm dark:border-border-dark dark:bg-surface-dark/95 z-10">
                    <div className="flex items-center gap-3">
                        <Link to="/" className="lg:hidden -ml-2 rounded-full p-2 text-text-secondary-light hover:bg-surface-hover dark:text-text-secondary-dark dark:hover:bg-surface-hover-dark transition-colors">
                            <span className="material-symbols-outlined">arrow_back</span>
                        </Link>
                        <div className="flex items-center gap-3">
                            <Avatar src={createAvatarUrl(room.name)} alt={room.name} size="md" />
                            <div>
                                <h2 className="text-lg font-bold leading-tight text-text-primary-light dark:text-text-primary-dark">{room.name}</h2>
                                <p className="text-xs font-medium text-text-secondary-light dark:text-text-secondary-dark">
                                    {participants.length} members
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="hidden items-center -space-x-2 lg:flex">
                            {participants.slice(0, 3).map((participant) => (
                                <Avatar
                                    key={participant.id}
                                    src={participant.avatarUrl}
                                    alt={participant.name}
                                    size="sm"
                                    className="ring-2 ring-surface-light dark:ring-surface-dark"
                                />
                            ))}
                            {participants.length > 3 && (
                                <div className="flex size-8 items-center justify-center rounded-full border-2 border-surface-light bg-surface-hover text-xs font-bold text-text-secondary-light dark:border-surface-dark dark:bg-surface-hover-dark dark:text-text-secondary-dark">
                                    +{participants.length - 3}
                                </div>
                            )}
                        </div>
                        <Button
                            variant="primary"
                            size="sm"
                            onClick={handleInvite}
                            icon="person_add"
                            className="hidden sm:inline-flex"
                        >
                            Invite
                        </Button>
                    </div>
                </header>

                {/* Messages Area */}
                <section className="relative flex-1 space-y-6 overflow-y-auto px-4 py-6 scroll-smooth">
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-surface-light/30 to-transparent dark:via-surface-dark/30" aria-hidden />
                    <div className="relative mx-auto max-w-5xl space-y-6">
                    {messages.map((message, index) => {
                        const isMe = message.senderId === currentUser?.uid;
                        const repliedMessage = message.replyTo ? messagesById[message.replyTo] : null;
                        const replyPreview = repliedMessage ? getReplyPreview(repliedMessage) : null;

                        // Check if previous message was from same sender to group them visually
                        const isSequence = index > 0 && messages[index - 1].senderId === message.senderId;

                        return (
                            <div key={message.id} className={`flex gap-3 ${isMe ? 'justify-end' : ''} group animate-fade-in`}>
                                {!isMe && (
                                    <div className="w-10 flex-shrink-0">
                                        {!isSequence && (
                                            <Avatar
                                                src={createAvatarUrl(message.senderName || 'Member')}
                                                alt={message.senderName}
                                                size="md"
                                            />
                                        )}
                                    </div>
                                )}

                                <div className={`flex max-w-[85%] md:max-w-[70%] flex-col gap-1 ${isMe ? 'items-end' : 'items-start'}`}>
                                    {!isSequence && (
                                        <div className={`flex items-center gap-2 text-xs text-text-muted-light dark:text-text-muted-dark px-1 ${isMe ? 'flex-row-reverse' : ''}`}>
                                            <span className="font-semibold text-text-primary-light dark:text-text-primary-dark">
                                                {isMe ? 'You' : message.senderName}
                                            </span>
                                            <span>{formatMessageTime(message.createdAt)}</span>
                                        </div>
                                    )}

                                    <div
                                        className={`
                                            relative px-4 py-2.5 shadow-sm text-sm leading-relaxed break-words
                                            ${isMe
                                                ? 'bg-primary text-white rounded-2xl rounded-tr-sm'
                                                : 'bg-surface-light dark:bg-surface-dark text-text-primary-light dark:text-text-primary-dark rounded-2xl rounded-tl-sm border border-border-light dark:border-border-dark'
                                            }
                                        `}
                                    >
                                        {message.replyTo && (
                                            <div className={`mb-2 rounded-lg border px-3 py-2 text-xs ${isMe ? 'border-white/20 bg-white/10 text-white/90' : 'border-border-light bg-surface-hover/50 text-text-secondary-light dark:border-border-dark dark:bg-surface-hover-dark/50 dark:text-text-secondary-dark'}`}>
                                                <div className="flex items-center gap-1 mb-0.5 opacity-75">
                                                    <span className="material-symbols-outlined text-[10px]">reply</span>
                                                    <span className="font-bold">{repliedMessage?.senderName || 'Unknown'}</span>
                                                </div>
                                                <p className="line-clamp-1 italic">{replyPreview || 'Message deleted'}</p>
                                            </div>
                                        )}

                                        <p className="whitespace-pre-wrap">{message.text}</p>

                                        {message.isEdited && (
                                            <span className={`text-[10px] ml-1 opacity-70 ${isMe ? 'text-white' : 'text-text-muted-light dark:text-text-muted-dark'}`}>
                                                (edited)
                                            </span>
                                        )}

                                        {message.attachments?.map((attachment, index) => (
                                            <div key={`${attachment.url}-${index}`} className="mt-3">
                                                {attachment.type?.startsWith('image/') ? (
                                                    <img src={attachment.url} alt={attachment.name} className="max-h-64 rounded-lg object-cover bg-black/5 dark:bg-white/5" />
                                                ) : (
                                                    <a href={attachment.url} target="_blank" rel="noreferrer" className="flex items-center gap-2 rounded-lg bg-black/5 p-2 text-xs font-medium hover:bg-black/10 dark:bg-white/10 dark:hover:bg-white/20 transition-colors">
                                                        <span className="material-symbols-outlined text-lg">description</span>
                                                        <span className="underline decoration-dotted">{attachment.name || 'Attachment'}</span>
                                                    </a>
                                                )}
                                            </div>
                                        ))}
                                    </div>

                                    {/* Message Actions */}
                                    <div className={`flex items-center gap-1 opacity-0 transition-opacity duration-200 group-hover:opacity-100 ${isMe ? 'flex-row-reverse' : ''}`}>
                                        <Button variant="ghost" size="icon" className="h-6 w-6 p-0 text-text-muted-light hover:text-primary dark:text-text-muted-dark" onClick={() => setReplyTo(message)} title="Reply">
                                            <span className="material-symbols-outlined text-base">reply</span>
                                        </Button>
                                        {isMe && (
                                            <>
                                                <Button variant="ghost" size="icon" className="h-6 w-6 p-0 text-text-muted-light hover:text-primary dark:text-text-muted-dark" onClick={() => { setEditingMessage(message); setNewMessage(message.text); }} title="Edit">
                                                    <span className="material-symbols-outlined text-base">edit</span>
                                                </Button>
                                                <Button variant="ghost" size="icon" className="h-6 w-6 p-0 text-text-muted-light hover:text-danger dark:text-text-muted-dark" onClick={() => handleDelete(message.id)} title="Delete">
                                                    <span className="material-symbols-outlined text-base">delete</span>
                                                </Button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                    <div ref={messagesEndRef} />
                    </div>
                </section>

                {/* Composer */}
                <footer className="border-t border-border-light bg-surface-light px-4 py-4 dark:border-border-dark dark:bg-surface-dark">
                    <div className="mx-auto max-w-4xl">
                        {(replyTo || editingMessage) && (
                            <div className="mb-2 flex items-center justify-between rounded-lg bg-surface-hover px-3 py-2 text-sm dark:bg-surface-hover-dark animate-slide-up">
                                <div className="flex items-center gap-2 text-text-secondary-light dark:text-text-secondary-dark">
                                    <span className="material-symbols-outlined text-lg text-primary">
                                        {editingMessage ? 'edit' : 'reply'}
                                    </span>
                                    <span>
                                        {editingMessage ? 'Editing message' : `Replying to ${replyTo.senderName}`}
                                    </span>
                                </div>
                                <button onClick={clearComposerState} className="text-xs font-bold uppercase tracking-wide text-text-muted-light hover:text-danger dark:text-text-muted-dark">
                                    Cancel
                                </button>
                            </div>
                        )}

                        <div className="flex items-end gap-2 rounded-2xl border border-border-light bg-background-light p-2 shadow-sm focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/20 dark:border-border-dark dark:bg-background-dark transition-all">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => fileInputRef.current?.click()}
                                className="text-text-secondary-light hover:bg-surface-hover dark:text-text-secondary-dark dark:hover:bg-surface-hover-dark rounded-xl"
                                title="Attach file"
                            >
                                <span className="material-symbols-outlined text-2xl">add_circle</span>
                            </Button>
                            <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileUpload} />

                            <textarea
                                ref={textareaRef}
                                className="max-h-32 min-h-[44px] flex-1 resize-none bg-transparent py-2.5 text-base text-text-primary-light placeholder:text-text-muted-light focus:outline-none dark:text-text-primary-dark dark:placeholder:text-text-muted-dark"
                                placeholder={`Message ${room.name}`}
                                rows={1}
                                value={newMessage}
                                onChange={(event) => setNewMessage(event.target.value)}
                                aria-label={`Message ${room.name}`}
                                onKeyDown={(event) => {
                                    if (event.key === 'Enter' && !event.shiftKey) {
                                        event.preventDefault();
                                        handleSend();
                                    }
                                }}
                            />

                            <Button
                                onClick={handleSend}
                                disabled={!newMessage.trim()}
                                variant="primary"
                                size="icon"
                                className="rounded-xl h-10 w-10 shrink-0 mb-0.5"
                            >
                                <span className="material-symbols-outlined text-xl">send</span>
                            </Button>
                        </div>
                    </div>
                </footer>
            </main>

            {/* Right Sidebar (Participants) */}
            <aside className="hidden h-full w-72 flex-shrink-0 flex-col border-l border-border-light bg-surface-light dark:border-border-dark dark:bg-surface-dark xl:flex">
                <div className="border-b border-border-light px-6 py-5 dark:border-border-dark">
                    <h3 className="text-lg font-bold text-text-primary-light dark:text-text-primary-dark">Participants</h3>
                    <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">{participants.length} members in room</p>
                </div>
                <div className="flex-1 overflow-y-auto px-2 py-2">
                    {participants.length === 0 ? (
                        <p className="p-4 text-center text-sm text-text-muted-light dark:text-text-muted-dark">No participants listed.</p>
                    ) : (
                        participants.map((participant) => (
                            <div key={participant.id} className="group flex items-center justify-between rounded-lg p-2 hover:bg-surface-hover dark:hover:bg-surface-hover-dark transition-colors cursor-default">
                                <div className="flex items-center gap-3">
                                    <Avatar src={participant.avatarUrl} alt={participant.name} size="md" />
                                    <div>
                                        <p className="text-sm font-semibold text-text-primary-light dark:text-text-primary-dark">{participant.name}</p>
                                        <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark">{participant.role}</p>
                                    </div>
                                </div>
                                <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 h-8 w-8">
                                    <span className="material-symbols-outlined text-lg">more_vert</span>
                                </Button>
                            </div>
                        ))
                    )}
                </div>
            </aside>
        </div>
    );
}
