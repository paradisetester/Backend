const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Message = require('../models/Message');

// Helper function to validate ObjectIds
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

// Send a new message
router.post('/send', async (req, res) => {
  try {
    const { content, sender, room } = req.body;

    if (!content || !sender || !room) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (!isValidObjectId(sender) || !isValidObjectId(room)) {
      return res.status(400).json({ error: 'Invalid sender or room ID' });
    }

    const newMessage = new Message({ content, sender, room });

    await newMessage.save();
    res.status(201).json(newMessage);
  } catch (err) {
    console.error('Error sending message:', err);
    res.status(500).json({ error: err.message || 'Internal Server Error' });
  }
});

// Fetch messages for a specific room
router.get('/:roomId', async (req, res) => {
  try {
    const { roomId } = req.params;

    if (!isValidObjectId(roomId)) {
      return res.status(400).json({ error: 'Invalid room ID' });
    }

    const messages = await Message.find({ room: roomId })
      .populate('sender', 'name email')
      .sort({ createdAt: 1 }); // Ensure timestamps exist in schema

    res.json(messages);
  } catch (err) {
    console.error('Error fetching messages:', err);
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
      { $addToSet: { readBy: userId } }, // Ensure readBy is an array in schema
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
