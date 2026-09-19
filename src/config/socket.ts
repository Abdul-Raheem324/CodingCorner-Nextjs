import { io, Socket } from "socket.io-client";

let socket: Socket;

export const getSocket = (): Socket => {
  if (socket) {
    return socket;
  }
  const url = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
  socket = io(url, {
    autoConnect: false,
    transports: ["websocket", "polling"],
  });
  return socket;
};