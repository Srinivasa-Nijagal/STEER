import './config.js';
import express from "express";
import http from "http";
import { Server } from "socket.io";
import jwt from "jsonwebtoken";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const userIdSocketMap = new Map();
const toSendMap = new Map();

io.use((socket, next) => {
  const authHeader = socket.handshake.headers.authorization;
  if (!authHeader) {
    return next(new Error("No token provided"));
  }

  try {
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    userIdSocketMap.set(decoded.id, socket.id);
    socket.userId = decoded.id;

    next();
  } catch (err) {
    console.error("JWT verification failed:", err.message);
    next(new Error("Invalid token"));
  }
});

io.on("connection", (socket) => {
  console.log("User connected:", socket.userId, socket.id);

  const pending = toSendMap.get(socket.userId);
  if (pending) {
    socket.emit("message", pending);
    toSendMap.delete(socket.userId);
  }

  socket.on("message", (data) => {
    const parsed = typeof data === "string" ? JSON.parse(data) : data;
    const toUserId = parsed.to;

    const toSocketId = userIdSocketMap.get(toUserId);

    if (!toSocketId) {
      toSendMap.set(toUserId, parsed);
      console.log(`User ${toUserId} offline. Message stored.`);
      return;
    }

    io.to(toSocketId).emit("message", parsed);
    console.log(`Sent message from ${socket.userId} to ${toUserId}`);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.userId, socket.id);
    userIdSocketMap.delete(socket.userId);
  });
});

app.get("/", (req, res) => {
  res.send("Socket.IO server is running");
});

const PORT = process.env.PORT || 5001;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
