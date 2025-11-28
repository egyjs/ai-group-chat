import { db } from "./firebase";
import { collection, addDoc, serverTimestamp, query, where, getDocs, onSnapshot, doc, getDoc, updateDoc, arrayUnion, setDoc, deleteDoc, orderBy } from "firebase/firestore";

export const createRoom = async (roomName, user) => {
    try {
        const docRef = await addDoc(collection(db, "rooms"), {
            name: roomName,
            createdAt: serverTimestamp(),
            createdAtClient: Date.now(),
            createdBy: {
                uid: user.uid,
                displayName: user.displayName,
                photoURL: user.photoURL
            },
            members: [user.uid], // Creator is automatically a member
            lastMessage: "Room created",
            lastMessageAt: serverTimestamp(),
            lastMessageAtClient: Date.now()
        });
        return docRef.id;
    } catch (e) {
        console.error("Error adding document: ", e);
        throw e;
    }
};

export const getRooms = async (userId) => {
    const base = query(
        collection(db, "rooms"),
        where("members", "array-contains", userId)
    );
    try {
        const ordered = query(base, orderBy("lastMessageAt", "desc"));
        const querySnapshot = await getDocs(ordered);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (e) {
        if (e?.code === 'failed-precondition') {
            const fallbackSnapshot = await getDocs(base);
            return fallbackSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        }
        throw e;
    }
};

export const subscribeToRooms = (userId, callback) => {
    const base = query(
        collection(db, "rooms"),
        where("members", "array-contains", userId)
    );
    const ordered = query(base, orderBy("lastMessageAt", "desc"));

    let unsub = onSnapshot(ordered, (snapshot) => {
        const rooms = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        callback(rooms);
    }, (error) => {
        if (error?.code === 'failed-precondition') {
            // Missing index: fallback to unordered feed; client will sort.
            if (typeof unsub === 'function') {
                try { unsub(); } catch { /* noop */ }
            }
            unsub = onSnapshot(base, (snapshot) => {
                const rooms = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                callback(rooms);
            }, (err) => {
                console.error('subscribeToRooms fallback error', err);
            });
        } else {
            console.error('subscribeToRooms error', error);
        }
    });

    return () => {
        if (typeof unsub === 'function') unsub();
    };
};

export const getRoom = async (roomId) => {
    const docRef = doc(db, "rooms", roomId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() };
    } else {
        return null;
    }
};

export const subscribeToRoom = (roomId, callback) => {
    const docRef = doc(db, "rooms", roomId);
    return onSnapshot(docRef, (doc) => {
        if (doc.exists()) {
            callback({ id: doc.id, ...doc.data() });
        } else {
            callback(null);
        }
    });
};

export const joinRoom = async (roomId, user) => {
    const roomRef = doc(db, "rooms", roomId);
    await updateDoc(roomRef, {
        members: arrayUnion(user.uid),
        [`memberProfiles.${user.uid}`]: {
            displayName: user.displayName,
            photoURL: user.photoURL
        }
    });
};

export const sendMessage = async (roomId, user, text, attachments = [], replyTo = null) => {
    try {
        const messageData = {
            roomId,
            text,
            senderId: user.uid,
            senderName: user.displayName,
            senderPhoto: user.photoURL,
            createdAt: serverTimestamp(),
            createdAtClient: Date.now(),
            attachments,
            replyTo
        };

        await addDoc(collection(db, "messages"), messageData);

        // Update room with last message info
        const roomRef = doc(db, "rooms", roomId);
        await updateDoc(roomRef, {
            lastMessage: text || (attachments.length ? "Sent an attachment" : "Message"),
            lastMessageAt: serverTimestamp(),
            lastMessageAtClient: Date.now()
        });
    } catch (e) {
        console.error("Error sending message: ", e);
    }
};

export const updateMessage = async (messageId, newText) => {
    const messageRef = doc(db, "messages", messageId);
    await updateDoc(messageRef, {
        text: newText,
        isEdited: true
    });
};

export const deleteMessage = async (messageId) => {
    const messageRef = doc(db, "messages", messageId);
    await deleteDoc(messageRef);
};

export const markRoomAsRead = async (roomId, userId) => {
    try {
        const userRoomRef = doc(db, "users", userId, "roomData", roomId);
        await setDoc(userRoomRef, {
            lastReadAt: serverTimestamp()
        }, { merge: true });
    } catch (e) {
        console.error("Error marking room as read: ", e);
    }
};

export const subscribeToUserRoomData = (userId, callback) => {
    const q = collection(db, "users", userId, "roomData");
    return onSnapshot(q, (snapshot) => {
        const data = {};
        snapshot.docs.forEach(doc => {
            data[doc.id] = doc.data();
        });
        callback(data);
    });
};

export const subscribeToMessages = (roomId, callback) => {
    const q = query(
        collection(db, "messages"),
        where("roomId", "==", roomId)
    );

    return onSnapshot(q, (snapshot) => {
        const messages = snapshot.docs
            .map((docSnapshot) => ({ id: docSnapshot.id, ...docSnapshot.data() }))
            .sort((a, b) => {
                const timeA = (a.createdAt?.seconds ?? Math.floor((a.createdAtClient || 0) / 1000));
                const timeB = (b.createdAt?.seconds ?? Math.floor((b.createdAtClient || 0) / 1000));
                if (timeA !== timeB) return timeA - timeB; // ascending
                // stable tiebreaker
                return (a.id || '').localeCompare(b.id || '');
            });
        callback(messages);
    });
};

export const subscribeToRoomMockMessages = (roomId, currentUser) => {
    const now = Date.now();
    const mockThreads = {
        designer: {
            id: `${roomId}-mock-1`,
            createdAt: { seconds: Math.floor((now - 5 * 60 * 1000) / 1000) },
            text: "Morning team! Just wanted to share the latest mockups. Let me know what you think.",
            senderId: "liam",
            senderName: "Liam Carter",
            senderPhoto: "https://lh3.googleusercontent.com/aida-public/AB6AXuAepb5Yss2wmiGNUzqdg0oElxV4KvU5zYvfyH779J0L2xmR63hDlQ2-4FHw98EvB6s_hxULqG8UDsBHy9MlQdMKhu5XKjpYRNo612Hd8LY_mabGb9dnqkU5QxP5qUFn5ihxDUIjgRjcPgIw3VoY99GRU8Ged6iPrfLKMsogf5h4Q8rz9I9BSKdGyY97y1DJ0xyiyC4PKaPzaZ37wMzZJ-H0hINhSmuq69i6e5gKNxTgOCfXPkiICx-YL45MRd5IMgXpL_xBGa64jnw",
        },
        teammate: {
            id: `${roomId}-mock-2`,
            createdAt: { seconds: Math.floor((now - 4 * 60 * 1000) / 1000) },
            text: "Looks great @Liam! I’ll review them and leave comments on Figma later today.",
            senderId: currentUser?.uid || "dev-user",
            senderName: currentUser?.displayName || "You",
            senderPhoto: currentUser?.photoURL,
        },
        moderator: {
            id: `${roomId}-mock-3`,
            createdAt: { seconds: Math.floor((now - 3 * 60 * 1000) / 1000) },
            text: "Agreed, these are fantastic!",
            senderId: "ava",
            senderName: "Ava Rodriguez",
            senderPhoto: "https://lh3.googleusercontent.com/aida-public/AB6AXuAkiB4JoOakhL51or1EP17XRlm8_whCZUTbs0nXWUxAiF5OL8aH0zlqMfcBIJnhbwr7RE-fFv2HnkKrjKHniS7rpKvxLdGZwZzXBP0tUZZSkx51q2kG6Eb-SWdO3EwZc5q5PFz164wBpIdVxj3AMJ7knhkl64wYnS11ld-Tr3t0EiPawIyS5tjqYcDvZj9r9xnXjH2K3oIeNyQBpXA5Kg1DsFt_LCMeB36BAn6e0mAySOWY9A5HRB7AtQdGDqxzrXVD72iNFb0mAdI",
        }
    };

    return Object.values(mockThreads);
};
