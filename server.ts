import { createServer } from "http";
import next from "next";
import { Server } from "socket.io";

type UserSocketMap = Record<string, string>;

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const app = next({ dev, hostname, port });
const handler = app.getRequestHandler();

const userSocketMap: UserSocketMap = {};

app.prepare().then(() => {
  const httpServer = createServer(handler);
  const io = new Server(httpServer);

  function getAllClients(id: string) {
    return Array.from(io.sockets.adapter.rooms.get(id) || []).map((socketId) => ({
      socketId,
      username: userSocketMap[socketId],
    }));
  }

  io.on("connection", (socket) => {
    console.log("New client connected");

    socket.on("join", ({ id, user }) => {
      userSocketMap[socket.id] = user.username;
      socket.join(id);
      const clients = getAllClients(id);
      clients.forEach(({ socketId }) => {
        io.to(socketId).emit("joined", {
          clients,
          username: user.username,
          socketId: socket.id,
        });
      });
    });

    socket.on("disconnecting", () => {
      const rooms = [...socket.rooms];
      rooms.forEach((roomId) => {
        socket.in(roomId).emit("disconnected", {
          socketId: socket.id,
          username: userSocketMap[socket.id],
        });
        socket.leave(roomId);
      });
      delete userSocketMap[socket.id];
    });

    socket.on("codeChange", ({ id, code }) => {
      socket.to(id).emit("codeChange", code);
    });

    socket.on("syncCode", ({ socketId, code }) => {
      io.to(socketId).emit("codeChange", code);
    });

    socket.on("changeLanguage", ({ id, language }) => {
      socket.to(id).emit("changeLanguage", language);
    });
  });

  httpServer.listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
  });
});
