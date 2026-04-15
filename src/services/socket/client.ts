import { io, Socket } from "socket.io-client";
import { storage } from "@/lib/storage";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";

// Create singleton socket instance
const socket: Socket = io(SOCKET_URL, {
  autoConnect: false,
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
});

export { socket };

export const connectSocket = () => {
  const token = storage.getToken();
  socket.auth = token ? { token } : {};
  if (!socket.connected) {
    socket.connect();
  }
  return socket;
};

export const disconnectSocket = () => socket.disconnect();
