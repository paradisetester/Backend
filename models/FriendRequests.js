// To, From, status, CreatedAt, UpdatedAt
const mongoose = require('mongoose');

const friendrequestSchema = new mongoose.Schema({
  to: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  from: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  status: { type: String, enum: ['Accepted', 'Rejected', 'Pending'], default: 'Pending' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  });

module.exports = mongoose.model('FriendRequest', friendrequestSchema);
