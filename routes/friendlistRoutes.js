const express = require('express');
const FriendList = require('../models/FriendList'); // Adjust path as needed
const authenticate = require('../middleware/authenticate');

const router = express.Router();

// Add a friend to a user's friend list
router.post('/add',authenticate, async (req, res) => {
    try {
        const { userId, friendId } = req.body;
        if (!userId || !friendId) {
            return res.status(400).json({ message: 'Both "userId" and "friendId" are required' });
        }

        // Find the friend list for the user; if not found, create one
        let friendList = await FriendList.findOne({ user: userId });
        if (!friendList) {
            friendList = new FriendList({ user: userId, friends: [] });
        }

        // Check if the friend already exists in the list
        if (friendList.friends.includes(friendId)) {
            return res.status(400).json({ message: 'Friend already added' });
        }

        friendList.friends.push(friendId);
        await friendList.save();
        res.status(201).json({ message: 'Friend added successfully', friendList });
    } catch (error) {
        res.status(500).json({ message: 'Error adding friend', error: error.message });
    }
});

// Remove a friend from a user's friend list
router.delete('/remove', async (req, res) => {
    try {
        const { userId, friendId } = req.body;
        if (!userId || !friendId) {
            return res.status(400).json({ message: 'Both "userId" and "friendId" are required' });
        }

        const friendList = await FriendList.findOne({ user: userId });
        if (!friendList) {
            return res.status(404).json({ message: 'Friend list not found for user' });
        }

        // Check if the friend exists in the list
        const friendIndex = friendList.friends.indexOf(friendId);
        if (friendIndex === -1) {
            return res.status(404).json({ message: 'Friend not found in friend list' });
        }

        friendList.friends.splice(friendIndex, 1);
        await friendList.save();

        res.json({ message: 'Friend removed successfully', friendList });
    } catch (error) {
        res.status(500).json({ message: 'Error removing friend', error: error.message });
    }
});

// Get a user's friend list
router.get('/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const friendList = await FriendList.findOne({ user: userId })
            .populate('friends', 'name email profilepicture position socialProfiles'); // Populate friend details (adjust fields as needed)

        if (!friendList) {
            return res.status(404).json({ message: 'Friend list not found for user' });
        }

        res.json({ message: 'Friend list retrieved successfully', friendList });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching friend list', error: error.message });
    }
});

module.exports = router;
