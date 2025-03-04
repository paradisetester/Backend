const mongoose = require('mongoose');

const ChatroomSchema = new mongoose.Schema({
  name: { type: String, required: true }, // Chatroom name
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true }, // Creator of the chatroom
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Employee' }], // Employees in the chatroom
  type: { 
    type: String, 
    enum: ['private', 'project', 'chatroom'], 
    required: true 
  }, // Type of room
  isPrivate: { type: Boolean, default: false }, // For backward compatibility
  createdAt: { type: Date, default: Date.now },
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', default: null }, // For project rooms
});

const Chatroom = mongoose.model('Chatroom', ChatroomSchema);

module.exports = Chatroom;
