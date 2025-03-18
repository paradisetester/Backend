const express = require('express');
const mongoose = require('mongoose');
const FriendRequest = require('../models/FriendRequests'); // Adjust path as needed
const authenticate = require('../middleware/authenticate');
const router = express.Router();

// Send a Friend Request
router.post('/send', async (req, res) => {
    try {
        const { to, from } = req.body;

        if (!to || !from) {
            return res.status(400).json({ message: 'Both "to" and "from" are required' });
        }

        // Check if a request already exists
        const existingRequest = await FriendRequest.findOne({
            to,
            from,
            status: { $in: ['Pending', 'Accepted'] }
        });
        if (existingRequest) {
            return res.status(400).json({ message: 'Friend request already sent' });
        }

        const friendRequest = new FriendRequest({ to, from, status: 'Pending' });
        await friendRequest.save();

        res.status(201).json({ message: 'Friend request sent', friendRequest });
    } catch (error) {
        res.status(500).json({ message: 'Error sending friend request', error: error.message });
    }
});

// Accept a Friend Request
router.put('/accept/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const request = await FriendRequest.findById(id);
        if (!request) {
            return res.status(404).json({ message: 'Friend request not found' });
        }

        request.status = 'Accepted';
        request.updatedAt = Date.now();
        await request.save();

        res.json({ message: 'Friend request accepted', request });
    } catch (error) {
        res.status(500).json({ message: 'Error accepting friend request', error: error.message });
    }
});

// Reject a Friend Request
router.put('/reject/:id', authenticate, async (req, res) => {
    try {
        const { id } = req.params;

        const request = await FriendRequest.findById(id);
        if (!request) {
            return res.status(404).json({ message: 'Friend request not found' });
        }

        request.status = 'Rejected';
        request.updatedAt = Date.now();
        await request.save();

        res.json({ message: 'Friend request rejected', request });
    } catch (error) {
        res.status(500).json({ message: 'Error rejecting friend request', error: error.message });
    }
});

// Get Friend Requests by User ID (only Pending requests)
router.get('/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const requests = await FriendRequest.find({
            to: userId,
            status: { $nin: ['Pending'] } // Exclude accepted and rejected requests
        }).populate('from', 'name email'); // Populate sender details

        res.json({ message: 'Friend requests retrieved', requests });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching friend requests', error: error.message });
    }
});
// Get Friend Requests Sent by the User (only Pending requests)
router.get('/sent/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const requests = await FriendRequest.find({
            from: userId,  // Change filter to "from" instead of "to"
            status: { $nin: ['Accepted', 'Rejected'] }
        });
        res.json({ message: 'Sent friend requests retrieved', requests });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching sent friend requests', error: error.message });
    }
});
// Get ALL Friend Requests Sent by the User (including Pending, Accepted, and Rejected)
router.get('/sent/all/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const requests = await FriendRequest.find({ from: userId });
        res.json({ message: 'Sent friend requests retrieved', requests });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching sent friend requests', error: error.message });
    }
});

// Delete a Friend Request
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const request = await FriendRequest.findByIdAndDelete(id);
        if (!request) {
            return res.status(404).json({ message: 'Friend request not found' });
        }

        res.json({ message: 'Friend request deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting friend request', error: error.message });
    }
});

module.exports = router;
