import { io } from 'socket.io-client';
import { API_URL } from '../api';

// Initialize a single Socket.io client instance for the entire frontend.
// Using the same instance across the app prevents multiple connections.
// The server URL is the same as the API base URL.
export const socket = io(API_URL, {
  transports: ['websocket'],
  reconnection: true,
});
