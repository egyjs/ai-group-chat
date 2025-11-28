import { useEffect, useMemo, useState } from 'react';
import { Link, useOutlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { createRoom, subscribeToRooms, subscribeToUserRoomData } from '../services/firestore';
import { createAvatarUrl } from '../utils/avatar';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Avatar from '../components/ui/Avatar';
import Card from '../components/ui/Card';

const formatLastActive = (timestamp) => {
    if (!timestamp?.seconds) return 'Just now';
    const date = new Date(timestamp.seconds * 1000);
    const diff = Date.now() - date.getTime();

    if (diff < 1000 * 60) return 'Just now';
    if (diff < 1000 * 60 * 60) return `${Math.floor(diff / (1000 * 60))}m ago`;
    if (diff < 1000 * 60 * 60 * 24) return `${Math.floor(diff / (1000 * 60 * 60))}h ago`;
    return date.toLocaleDateString();
};

export default function Home() {
    const { currentUser, logout } = useAuth();
    const [rooms, setRooms] = useState([]);
    const [userRoomData, setUserRoomData] = useState({});
    const [searchTerm, setSearchTerm] = useState('');
    const [isCreating, setIsCreating] = useState(false);
    const [newRoomName, setNewRoomName] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const outlet = useOutlet();

    useEffect(() => {
        if (!currentUser) return;

        const unsubscribeRooms = subscribeToRooms(currentUser.uid, (roomsData) => {
            const sorted = [...roomsData].sort((a, b) => {
                const timeA = (a.lastMessageAt?.seconds ?? Math.floor((a.lastMessageAtClient || 0) / 1000));
                const timeB = (b.lastMessageAt?.seconds ?? Math.floor((b.lastMessageAtClient || 0) / 1000));
                if (timeA !== timeB) return timeB - timeA;

                const cA = (a.createdAt?.seconds ?? Math.floor((a.createdAtClient || 0) / 1000));
                const cB = (b.createdAt?.seconds ?? Math.floor((b.createdAtClient || 0) / 1000));
                if (cA !== cB) return cB - cA;

                const nA = (a.name || '').toLowerCase();
                const nB = (b.name || '').toLowerCase();
                if (nA !== nB) return nA < nB ? -1 : 1;

                return (a.id || '').localeCompare(b.id || '');
            });
            setRooms(sorted);
        });

        const unsubscribeUserData = subscribeToUserRoomData(currentUser.uid, (data) => {
            setUserRoomData(data);
        });

        return () => {
            unsubscribeRooms();
            unsubscribeUserData();
        };
    }, [currentUser]);

    const hasUnread = (room) => {
        if (!room.lastMessageAt) return false;
        const lastRead = userRoomData[room.id]?.lastReadAt;
        if (!lastRead?.seconds) return true;
        return room.lastMessageAt.seconds > lastRead.seconds;
    };

    const filteredRooms = useMemo(() => {
        return rooms.filter((room) => room.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [rooms, searchTerm]);

    const handleCreateRoom = async (event) => {
        event.preventDefault();
        if (!newRoomName.trim() || !currentUser) return;

        setIsSubmitting(true);
        try {
            await createRoom(newRoomName.trim(), currentUser);
            setNewRoomName('');
            setIsCreating(false);
        } catch (error) {
            console.error('Failed to create room', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="relative flex h-screen min-h-screen w-full flex-col overflow-hidden bg-background-light dark:bg-background-dark text-text-primary-light dark:text-text-primary-dark font-sans">
            <div className="flex h-full w-full">
                {/* Sidebar */}
                <aside className="flex h-full w-full max-w-sm flex-shrink-0 flex-col border-r border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark">
                    <div className="flex h-full flex-col">
                        {/* Search Header */}
                        <div className="sticky top-0 z-10 p-4 bg-surface-light dark:bg-surface-dark/95 backdrop-blur-sm">
                            <Input
                                icon="search"
                                placeholder="Search for people or rooms"
                                value={searchTerm}
                                onChange={(event) => setSearchTerm(event.target.value)}
                                containerClassName="shadow-sm"
                            />
                        </div>

                        {/* Room List */}
                        <div className="flex-1 overflow-y-auto px-3 pb-4 space-y-1">
                            {filteredRooms.length === 0 ? (
                                <div className="mt-10 flex flex-col items-center justify-center p-6 text-center text-text-muted-light dark:text-text-muted-dark opacity-60">
                                    <span className="material-symbols-outlined text-4xl mb-2">forum</span>
                                    <p className="text-sm font-medium">{rooms.length === 0 ? 'Create a space to start chatting.' : 'No conversations found.'}</p>
                                </div>
                            ) : (
                                filteredRooms.map((room) => {
                                    const unread = hasUnread(room);
                                    return (
                                        <Link
                                            key={room.id}
                                            to={`/room/${room.id}`}
                                            className={`
                                                group flex cursor-pointer items-center gap-3 rounded-xl p-3 transition-all duration-200
                                                hover:bg-surface-hover dark:hover:bg-surface-hover-dark
                                                ${unread ? 'bg-primary/5 dark:bg-primary/10' : ''}
                                            `}
                                        >
                                            <div className="relative shrink-0">
                                                <Avatar
                                                    src={createAvatarUrl(room.name)}
                                                    alt={room.name}
                                                    size="lg"
                                                    className="ring-2 ring-transparent group-hover:ring-border-light dark:group-hover:ring-border-dark transition-all"
                                                />
                                                {unread && (
                                                    <span className="absolute -right-0.5 -top-0.5 flex size-3.5">
                                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                                                        <span className="relative inline-flex rounded-full size-3.5 bg-primary border-2 border-surface-light dark:border-surface-dark"></span>
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex flex-1 flex-col overflow-hidden">
                                                <div className="flex items-baseline justify-between gap-2">
                                                    <p className={`truncate text-sm font-semibold ${unread ? 'text-text-primary-light dark:text-text-primary-dark' : 'text-text-primary-light/90 dark:text-text-primary-dark/90'}`}>
                                                        {room.name}
                                                    </p>
                                                    <p className="text-xs text-text-muted-light dark:text-text-muted-dark font-medium">
                                                        {formatLastActive(room.lastMessageAt)}
                                                    </p>
                                                </div>
                                                <p className={`truncate text-sm ${unread ? 'text-text-secondary-light dark:text-text-secondary-dark font-medium' : 'text-text-muted-light dark:text-text-muted-dark'}`}>
                                                    {room.lastMessage || 'No messages yet'}
                                                </p>
                                            </div>
                                        </Link>
                                    );
                                })
                            )}
                        </div>
                    </div>

                    {/* User Footer */}
                    <div className="sticky bottom-0 z-10 border-t border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark p-4">
                        <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                                <Avatar
                                    src={createAvatarUrl(currentUser?.displayName || 'User')}
                                    alt={currentUser?.displayName}
                                    size="md"
                                />
                                <div className="overflow-hidden">
                                    <p className="truncate text-sm font-semibold text-text-primary-light dark:text-text-primary-dark">
                                        {currentUser?.displayName || 'Anonymous'}
                                    </p>
                                    {currentUser?.email && (
                                        <p className="truncate text-xs text-text-muted-light dark:text-text-muted-dark">
                                            {currentUser.email}
                                        </p>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="primary"
                                    size="icon"
                                    onClick={() => setIsCreating((prev) => !prev)}
                                    className="rounded-full shadow-lg shadow-primary/20"
                                >
                                    <span className="material-symbols-outlined text-xl">{isCreating ? 'close' : 'add'}</span>
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={logout}
                                    className="text-text-muted-light hover:text-danger dark:text-text-muted-dark dark:hover:text-danger"
                                    title="Logout"
                                >
                                    <span className="material-symbols-outlined text-xl">logout</span>
                                </Button>
                            </div>
                        </div>

                        {/* Create Room Form */}
                        {isCreating && (
                            <div className="mt-4 animate-slide-up">
                                <Card className="p-4 bg-surface-hover/50 dark:bg-surface-hover-dark/50 backdrop-blur-sm border-primary/20">
                                    <form onSubmit={handleCreateRoom} className="space-y-3">
                                        <Input
                                            label="Room Name"
                                            placeholder="Ex: Design Team"
                                            value={newRoomName}
                                            onChange={(event) => setNewRoomName(event.target.value)}
                                            autoFocus
                                            className="bg-surface-light dark:bg-surface-dark"
                                        />
                                        <Button
                                            type="submit"
                                            variant="primary"
                                            className="w-full"
                                            isLoading={isSubmitting}
                                            disabled={!newRoomName.trim()}
                                        >
                                            Create Room
                                        </Button>
                                    </form>
                                </Card>
                            </div>
                        )}
                    </div>
                </aside>

                {/* Main Content Area */}
                <main className="flex flex-1 overflow-hidden bg-background-light dark:bg-background-dark relative">
                    {/* Background Pattern */}
                    <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none"
                        style={{
                            backgroundImage: 'radial-gradient(#64748b 1px, transparent 1px)',
                            backgroundSize: '24px 24px'
                        }}
                    />

                    {outlet || (
                        <div className="m-auto w-full max-w-md p-8 text-center animate-fade-in">
                            <div className="mx-auto mb-6 flex size-24 items-center justify-center rounded-3xl bg-primary/10 text-primary dark:bg-primary/20">
                                <span className="material-symbols-outlined text-5xl">chat_bubble_outline</span>
                            </div>
                            <h2 className="text-2xl font-bold text-text-primary-light dark:text-text-primary-dark mb-2">
                                Welcome to Chat
                            </h2>
                            <p className="text-text-secondary-light dark:text-text-secondary-dark mb-8">
                                Select a conversation from the sidebar or create a new room to start messaging.
                            </p>
                            <Button
                                variant="secondary"
                                onClick={() => setIsCreating(true)}
                                className="hidden md:inline-flex"
                            >
                                Create a New Room
                            </Button>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}
