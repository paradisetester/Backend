const express = require('express');
const Chatroom = require('../models/ChatRoom');
const router = express.Router();
const authenticate = require('../middleware/authenticate');
const mongoose = require('mongoose');

// Create a new chatroom
router.post('/create', authenticate, async (req, res) => {
  const { name, type, members, project } = req.body;

  // Input validation
  if (!name || !type || !Array.isArray(members) || members.length === 0) {
    return res.status(400).json({ error: 'Name, type, and members are required.' });
  }

  try {
    // Validate project if type is 'project'
    if (type === 'project' && !mongoose.Types.ObjectId.isValid(project)) {
      return res.status(400).json({ error: 'Invalid project ID.' });
    }

    const userId = req.employeeId; // Ensure employee ID from middleware

    // Create a new chatroom
    const newChatroom = new Chatroom({
      name,
      type,
      members,
      createdBy: userId, // Logged-in user as creator
      project: type === 'project' ? project : null,
    });

    // Save the chatroom to the database
    const savedChatroom = await newChatroom.save();
    res.status(201).json({ message: 'Chatroom created successfully.', chatroom: savedChatroom });
  } catch (error) {
    console.error('Error creating chatroom:', error);
    res.status(500).json({ error: 'Failed to create chatroom', details: error.message });
  }
});

// Get all chatrooms for a user
router.get('/user/:userId', authenticate, async (req, res) => {
  const userId = req.params.userId;

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({ error: 'Invalid user ID.' });
  }

  try {
    const chatrooms = await Chatroom.find({ members: userId })
      .populate('members', 'name email') // Populate member details
      .select('-__v'); // Exclude internal fields like `__v`

    if (!chatrooms.length) {
      return res.status(404).json({ message: 'No chatrooms found for the user.' });
    }

    res.json(chatrooms);
  } catch (error) {
    console.error('Error fetching chatrooms:', error);
    res.status(500).json({ error: 'Failed to fetch chatrooms', details: error.message });
  }
});

module.exports = router;
