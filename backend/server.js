import './config.js'; // Import and run the config file first to load env vars
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import { createServer } from 'http'; // Import HTTP module for Socket.io
import { Server } from 'socket.io'; // Import Socket.io
import Message from './models/Message.js'; // Import Message model
import Notification from './models/Notification.js'; // Import Notification model
import Ride from './models/Ride.js'; // Import Ride model

import authRoutes from './routes/authRoutes.js';
import rideRoutes from './routes/rideRoutes.js';
import proxyRoutes from './routes/proxyRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import userRoutes from './routes/userRoutes.js';

const app = express();

// Allowed origins for CORS
const allowedOrigins = [
  "http://localhost:3000", 
  "http://localhost:3001",
  "http://localhost:5173"
];

// Middleware
app.use(cors({
  origin: true, // Allows all origins for easier development/mobile usage
  credentials: true
}));
app.use(express.json());

// Create HTTP server (needed for Socket.io to work with Express)
const httpServer = createServer(app);

// Initialize Socket.io
const io = new Server(httpServer, {
  cors: {
    origin: "*", // Allow connections from anywhere (crucial for mobile apps)
    methods: ["GET", "POST"]
  }
});

// --- SOCKET.IO LOGIC ---
io.on("connection", (socket) => {
  console.log(`User Connected: ${socket.id}`);

  // User joins a specific ride room
  socket.on("join_ride", async (rideId) => {
    socket.join(rideId);
    // Fetch previous messages for this ride from MongoDB
    try {
      const messages = await Message.find({ rideId }).sort({ createdAt: 1 });
      socket.emit("load_messages", messages);
    } catch (err) {
      console.error("Error loading messages:", err);
    }
  });

  // User sends a message
  socket.on("send_message", async (data) => {
    const { rideId, sender, senderName, content } = data;
    
    try {
      // 1. Save Message to Database
      const newMessage = new Message({ rideId, sender, senderName, content });
      await newMessage.save();
      
      // 2. Broadcast the saved message to everyone in the room (including sender)
      io.to(rideId).emit("receive_message", newMessage);

      // 3. Generate Notifications for other participants
      const ride = await Ride.findById(rideId);
      if (ride) {
        // Determine recipients: The driver + all riders, excluding the sender
        const allParticipants = [ride.driver, ...ride.riders];
        const recipients = allParticipants.filter(
            userId => userId.toString() !== sender
        );

        // Create a notification object for each recipient
        const notifications = recipients.map(userId => ({
            user: userId,
            message: `New message from ${senderName} in ride to ${ride.destination.address.split(',')[0]}`,
            rideId: rideId,
            isRead: false
        }));

        if (notifications.length > 0) {
            await Notification.insertMany(notifications);
        }
      }

    } catch (err) {
      console.error("Error handling message:", err);
    }
  });

  socket.on("disconnect", () => {
    console.log("User Disconnected", socket.id);
  });
});

// --- DATABASE CONNECTION ---
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected successfully.');
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    process.exit(1);
  }
};
connectDB();

// --- API ROUTES ---
app.use('/api/auth', authRoutes);
app.use('/api/rides', rideRoutes);
app.use('/api/proxy', proxyRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/users', userRoutes);

const PORT = process.env.PORT || 5000;

// IMPORTANT: Listen on httpServer, NOT app, to allow Socket.io to work
httpServer.listen(PORT, () => console.log(`Server running on port ${PORT}`));