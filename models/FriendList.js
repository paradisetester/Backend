const mongoose = require('mongoose');

const friendListSchema = new mongoose.Schema(
  {
    // Each user has a unique friend list
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true, unique: true },
    // Array of friend IDs referencing the Employee model
    friends: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Employee' }]
  },
  { timestamps: true } // Automatically adds createdAt and updatedAt fields
);

module.exports = mongoose.model('FriendList', friendListSchema);
