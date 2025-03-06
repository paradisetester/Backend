const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Message = require('../models/Message');

// Helper function to validate ObjectIds
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

// Send a new message (group or direct)
router.post('/send', async (req, res) => {
  try {
    const { content, sender, room, reciever } = req.body;

    // Require content, sender and either a room (for chatroom messages) or a reciever (for direct messages)
    if (!content || !sender || (!room && !reciever)) {
      return res.status(400).json({ error: 'Missing required fields: must include content, sender and either room or reciever' });
    }

    // Validate ObjectIds (if provided)
    if (!isValidObjectId(sender) ||
       (room && !isValidObjectId(room)) ||
       (reciever && !isValidObjectId(reciever))) {
      return res.status(400).json({ error: 'Invalid sender, room, or reciever ID' });
    }

    const newMessageData = { content, sender, timestamp: Date.now() };
    if (room) newMessageData.room = room;
    if (reciever) newMessageData.reciever = reciever;

    const newMessage = new Message(newMessageData);
    await newMessage.save();
    res.status(201).json(newMessage);
  } catch (err) {
    console.error('Error sending message:', err);
    res.status(500).json({ error: err.message || 'Internal Server Error' });
  }
});

// Fetch messages for a specific chatroom
router.get('/:roomId', async (req, res) => {
  try {
    const { roomId } = req.params;
    if (!isValidObjectId(roomId)) {
      return res.status(400).json({ error: 'Invalid room ID' });
    }

    const messages = await Message.find({ room: roomId })
      .populate('sender', 'name email')
      .populate('reciever', 'name email')
      .sort({ timestamp: 1 });

    res.json(messages);
  } catch (err) {
    console.error('Error fetching messages:', err);
    res.status(500).json({ error: err.message || 'Internal Server Error' });
  }
});

// Fetch direct messages between two employees
router.get('/direct', async (req, res) => {
  try {
    const { user1, user2 } = req.query;
    if (!user1 || !user2) {
      return res.status(400).json({ error: 'Missing required query parameters user1 and user2' });
    }
    if (!isValidObjectId(user1) || !isValidObjectId(user2)) {
      return res.status(400).json({ error: 'Invalid user IDs' });
    }

    // Find messages where one is the sender and the other is the reciever, in either direction
    const messages = await Message.find({
      $or: [
        { sender: user1, reciever: user2 },
        { sender: user2, reciever: user1 }
      ]
    })
      .populate('sender', 'name email')
      .populate('reciever', 'name email')
      .sort({ timestamp: 1 });

    res.json(messages);
  } catch (err) {
    console.error('Error fetching direct messages:', err);
    res.status(500).json({ error: err.message || 'Internal Server Error' });
  }
});

// Mark a message as read
router.put('/mark-read/:messageId', async (req, res) => {
  try {
    const { messageId } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    if (!isValidObjectId(messageId) || !isValidObjectId(userId)) {
      return res.status(400).json({ error: 'Invalid message or user ID' });
    }

    const message = await Message.findByIdAndUpdate(
      messageId,
      { $addToSet: { readBy: userId } },
      { new: true }
    );

    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    res.json(message);
  } catch (err) {
    console.error('Error marking message as read:', err);
    res.status(500).json({ error: err.message || 'Internal Server Error' });
  }
});

module.exports = router;
