const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors'); // Import CORS middleware
const path = require('path'); // For serving static files
const http = require('http'); // For setting up Socket.IO
const { Server } = require('socket.io'); // Import Socket.IO
const Message = require('./models/Message'); // Adjust the path to your model

require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const blogRoutes = require('./routes/blogRoutes');
const leaveRoutes = require('./routes/leaveRoutes');
const taskRoutes = require('./routes/taskRoutes');
const projectRoutes = require('./routes/projectRoutes');
const commentRoutes = require('./routes/commentRoutes');
const chatRoutes = require('./routes/chatRoutes'); // Chat routes
const messageRoutes = require('./routes/messageRoutes'); // Message routes
const categoryRoutes = require('./routes/categoryRoutes'); // Include category routes
const testRoutes = require('./routes/testRoutes'); // Include upload routes
const friendrequestRoutes = require('./routes/friendrequestRoutes'); // Include friend request routes
const aboutuseRoutes=require('./routes/PageRoutes/aboutusRoutes'); // Include about us routes
const homeRoutes = require('./routes/PageRoutes/homeRoutes'); // Include home page routes
const footerRoutes = require('./routes/PageRoutes/footerRoutes'); // Include footer routes
const frientlistRoutes = require('./routes/friendlistRoutes'); // Include friend list routes

const app = express();
const server = http.createServer(app); // Use HTTP server to integrate with Socket.IO
const allowedOrigin = 'https://dashboard-gamma-orpin.vercel.app';
app.use(cors({
  origin: allowedOrigin,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

const io = new Server(server, {
  cors: {
    origin: allowedOrigin,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  },
});


// 📦 Middleware for JSON Parsing
app.use(express.json());

// 📂 Serve the uploads folder as static (directly from the project root)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 🛠️ Routes
app.use('/api/auth', authRoutes);
app.use('/api/blogs', blogRoutes);
app.use('/api/leaves', leaveRoutes);
app.use('/api/project', projectRoutes);
app.use('/api/task', taskRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/chat', chatRoutes); // Chat routes
app.use('/api/messages', messageRoutes); // Message routes
app.use('/api/categories', categoryRoutes); // Include category routes
// app.use('/api/uploads', uploadRoutes); // Add upload routes
app.use('/api/test', testRoutes); // Add test routes
app.use('/api/friendrequests', friendrequestRoutes); // Include friend request routes
app.use('/api/friendlist', frientlistRoutes); // Include friend request routes
app.use('/api/aboutus', aboutuseRoutes); // Include about us routes
app.use('/api/home', homeRoutes); // Include home page routes
app.use('/api/footer', footerRoutes); // Include footer routes

// 🗄️ MongoDB Connection
mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/employee_dashboard')
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// ⚡ Socket.IO Setup
io.on('connection', (socket) => {
  console.log('🔌 New client connected:', socket.id);

  socket.on('joinRoom', (roomId) => {
    socket.join(roomId);
  });

  socket.on('sendMessage', async (data) => {
    try {
      if (!data.content || !data.sender || !data.room) {
        return socket.emit('errorMessage', 'Invalid message data');
      }
      const message = await Message.create({
        content: data.content,
        sender: data.sender.id, // Save only the sender ID
        room: data.room,
        timestamp: data.timestamp || Date.now(),
      });
      
      // Fetch sender details
      const populatedMessage = await Message.findById(message._id).populate('sender', 'name id');
      
      io.to(data.room).emit('newMessage', populatedMessage);
    } catch (error) {
      console.error('Error saving message:', error);
      socket.emit('errorMessage', 'Could not send message');
    }
  });

  socket.on('disconnect', () => {
    console.log('🔌 Client disconnected:', socket.id);
  });
});


// ⚠️ Error Handling Middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// 🚀 Start the Server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🌟 Server running on http://localhost:${PORT}`);
});
