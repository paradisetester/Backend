const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  content: { type: String, required: true },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  reciever: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee'},
  room: { type: mongoose.Schema.Types.ObjectId, ref: 'Chatroom'},
  timestamp: { type: Date, default: Date.now },
  readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Employee', default: null }], // Tracks who has read the message
});

module.exports = mongoose.model('Message', messageSchema);
