
import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export const useSocket = () => {
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    const newSocket = io(SOCKET_URL);
    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  return socket;
};

export const useRetroSocket = (retroId: string | undefined, handlers: {
  onCardAdded: (card: any) => void;
  onVoteChanged: (data: any) => void;
  onCommentAdded: (data: any) => void;
  onActionAdded: (action: any) => void;
  onActionUpdated: (action: any) => void;
  onActionDeleted: (action: any) => void;
}) => {
  const socket = useSocket();

  useEffect(() => {
    if (!socket || !retroId) return;

    socket.emit('join_retro', retroId);

    socket.on('card_added', handlers.onCardAdded);
    socket.on('vote_changed', handlers.onVoteChanged);
    socket.on('comment_added', handlers.onCommentAdded);
    socket.on('action_added', handlers.onActionAdded);
    socket.on('action_updated', handlers.onActionUpdated);
    socket.on('action_deleted', handlers.onActionDeleted);

    return () => {
      socket.off('card_added', handlers.onCardAdded);
      socket.off('vote_changed', handlers.onVoteChanged);
      socket.off('comment_added', handlers.onCommentAdded);
      socket.off('action_added', handlers.onActionAdded);
      socket.off('action_updated', handlers.onActionUpdated);
      socket.off('action_deleted', handlers.onActionDeleted);
    };
  }, [socket, retroId, handlers]);

  return socket;
};
