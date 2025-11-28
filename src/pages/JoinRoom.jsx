import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { joinRoom, getRoom } from '../services/firestore';

export default function JoinRoom() {
    const { roomId } = useParams();
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const [status, setStatus] = useState('Joining...');

    useEffect(() => {
        const handleJoin = async () => {
            if (!currentUser) return; // Should be handled by PrivateRoute but safe to check

            try {
                const room = await getRoom(roomId);
                if (!room) {
                    setStatus('Room not found');
                    return;
                }

                // Check if already a member
                if (room.members.includes(currentUser.uid)) {
                    navigate(`/room/${roomId}`);
                    return;
                }

                // Join the room
                await joinRoom(roomId, currentUser);
                navigate(`/room/${roomId}`);
            } catch (error) {
                console.error("Error joining room:", error);
                setStatus('Failed to join room');
            }
        };

        handleJoin();
    }, [roomId, currentUser, navigate]);

    return (
        <div className="flex h-screen w-full items-center justify-center bg-background-light dark:bg-background-dark font-sans">
            <div className="flex flex-col items-center gap-4 text-center">
                <span className="material-symbols-outlined animate-spin text-4xl text-primary">progress_activity</span>
                <p className="text-lg font-medium text-text-primary-light dark:text-text-primary-dark">{status}</p>
            </div>
        </div>
    );
}
