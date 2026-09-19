// node --loader ts-node/esm server.ts  --> Use this to run the serverfile locally
import "dotenv/config";
import { createServer } from "http";
import { Server } from "socket.io";

type UserSocketMap = Record<string, string>;

const port = Number(process.env.PORT) || 3001;
const userSocketMap: UserSocketMap = {};

const httpServer = createServer((req, res) => {
  if (req.url === "/ping" || req.url === "/health" || req.url === "/") {
    res.writeHead(200, {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    });
    res.end(JSON.stringify({ status: "ok", message: "CodingCorner Server Awake", timestamp: Date.now() }));
    return;
  }
  res.writeHead(404);
  res.end();
});

const io = new Server(httpServer, {
  cors: {
    origin: (origin, callback) => {
      // Allow all origins including Vercel preview/prod domains and localhost
      callback(null, true);
    },
    methods: ["GET", "POST"],
    credentials: true,
  },
  path: "/socket.io",
});

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

  socket.on("cursorMove", ({ id, cursor }) => {
    socket.to(id).emit("cursorMove", {
      ...cursor,
      socketId: socket.id,
    });
  });
});

httpServer.listen(port, () => {
  console.log(`Socket.IO server running at http://localhost:${port}`);
});
