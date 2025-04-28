// server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');
const Message = require('./models/Message');

require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const blogRoutes = require('./routes/blogRoutes');
const leaveRoutes = require('./routes/leaveRoutes');
const taskRoutes = require('./routes/taskRoutes');
const projectRoutes = require('./routes/projectRoutes');
const commentRoutes = require('./routes/commentRoutes');
const chatRoutes = require('./routes/chatRoutes');
const messageRoutes = require('./routes/messageRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const testRoutes = require('./routes/testRoutes');
const friendrequestRoutes = require('./routes/friendrequestRoutes');
const aboutuseRoutes = require('./routes/PageRoutes/aboutusRoutes');
const homeRoutes = require('./routes/PageRoutes/homeRoutes');
const footerRoutes = require('./routes/PageRoutes/footerRoutes');
const frientlistRoutes = require('./routes/friendlistRoutes');
const contactformRoutes = require('./routes/PageRoutes/contactformRoutes');
const aboutmeRoutes = require('./routes/PortfolioRoutes/aboutMeRoutes');
const projectsRoutes = require('./routes/PortfolioRoutes/projectsRoutes');
const skillsRoutes = require('./routes/PortfolioRoutes/skillsRoutes');
const app = express();
const server = http.createServer(app);

// Allow both production and local development origins
const allowedOrigins = [
  'https://dashboard-gamma-orpin.vercel.app',
  'http://localhost:3000'
];

app.use(cors({
  origin: allowedOrigins,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  },
});

// Middleware for JSON Parsing
app.use(express.json());

// Serve the uploads folder as static
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/blogs', blogRoutes);
app.use('/api/leaves', leaveRoutes);
app.use('/api/project', projectRoutes);
app.use('/api/task', taskRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/test', testRoutes);
app.use('/api/friendrequests', friendrequestRoutes);
app.use('/api/friendlist', frientlistRoutes);
app.use('/api/aboutus', aboutuseRoutes);
app.use('/api/home', homeRoutes);
app.use('/api/footer', footerRoutes);
app.use('/api/contactform', contactformRoutes);
app.use('/api/portfolio/aboutme', aboutmeRoutes);
app.use('/api/portfolio/projects', projectsRoutes);
app.use('/api/portfolio/skills', skillsRoutes);

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/employee_dashboard')
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// Socket.IO Setup
io.on('connection', (socket) => {
  console.log('🔌 New client connected:', socket.id);

  // Allow users to join their personal room for direct messages.
  socket.on('joinUserRoom', (userId) => {
    if (userId) {
      socket.join(userId);
    }
  });

  // Allow joining a chatroom for group messages.
  socket.on('joinRoom', (roomId) => {
    socket.join(roomId);
  });

  // Handle sending messages.
  socket.on('sendMessage', async (data) => {
    try {
      if (!data.content || !data.sender) {
        return socket.emit('errorMessage', 'Invalid message data: content and sender are required');
      }

      let messageData = {
        content: data.content,
        sender: data.sender.id || data.sender,
        timestamp: data.timestamp || Date.now(),
      };

      // Determine message type:
      // If 'room' exists, treat as group chat; if 'reciever' exists, treat as direct message.
      if (data.room) {
        messageData.room = data.room;
      } else if (data.reciever) {
        messageData.reciever = data.reciever;
      } else {
        return socket.emit('errorMessage', 'Either room or reciever must be provided');
      }

      const message = await Message.create(messageData);
      const populatedMessage = await Message.findById(message._id)
        .populate('sender', 'name id')
        .populate('reciever', 'name id');

      // Emit message based on type.
      if (data.room) {
        io.to(data.room).emit('newMessage', populatedMessage);
      } else if (data.reciever) {
        // For direct messages, send to reciever’s personal room and back to the sender.
        io.to(data.reciever).emit('newMessage', populatedMessage);
        socket.emit('newMessage', populatedMessage);
      }
    } catch (error) {
      console.error('Error saving message:', error);
      socket.emit('errorMessage', 'Could not send message');
    }
  });

  socket.on('disconnect', () => {
    console.log('🔌 Client disconnected:', socket.id);
  });
});

// Error Handling Middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Start the Server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🌟 Server running on http://localhost:${PORT}`);
});
