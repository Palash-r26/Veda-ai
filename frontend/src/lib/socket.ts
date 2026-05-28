import { io, Socket } from 'socket.io-client';
import { API_URL } from './api';

// Initialize a singleton Socket.io client instance
export const socket: Socket = io(API_URL, {
  transports: ['websocket'],
  // You can configure additional options here if needed
});
