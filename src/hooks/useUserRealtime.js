import { useEffect } from 'react';
import { io } from 'socket.io-client';
import { useDispatch } from 'react-redux';
import { applyChargerStatus, applySessionUpdate } from '../features/user/userSlice';

export default function useUserRealtime() {
  const dispatch = useDispatch();

  useEffect(() => {
    const socket = io('/', { transports: ['websocket'], withCredentials: true });

    socket.on('session:update', (session) => dispatch(applySessionUpdate(session)));
    socket.on('session:ended', (session) => dispatch(applySessionUpdate(session)));
    socket.on('charger:status', (payload) => dispatch(applyChargerStatus(payload)));

    socket.on('connect', () => {
      socket.emit('session:watch', {}, (response) => {
        if (response?.session) dispatch(applySessionUpdate(response.session));
      });
    });

    return () => socket.close();
  }, [dispatch]);
}
