// ProtectedRoutes.js
const express = require('express');
const authenticate = require('./middleware/authenticate');

const protectedRoutes = express.Router();

// Apply the authentication middleware to all routes in this router
protectedRoutes.use(authenticate);

// Protected dashboard routes
protectedRoutes.use('/api/leaves', require('./routes/leaveRoutes'));
protectedRoutes.use('/api/project', require('./routes/projectRoutes'));
protectedRoutes.use('/api/task', require('./routes/taskRoutes'));
protectedRoutes.use('/api/chat', require('./routes/chatRoutes'));
protectedRoutes.use('/api/messages', require('./routes/messageRoutes'));
protectedRoutes.use('/api/friendrequests', require('./routes/friendrequestRoutes'));

// If you have additional protected routes, include them here.
module.exports = protectedRoutes;
