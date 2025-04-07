const mongoose = require('mongoose');

const GoalSchema = new mongoose.Schema({
  name: { type: String, required: true }, 
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true }, // Creator of the goal
  type: { 
    type: String, 
    enum: ['Short Term', 'Long Term', 'Immediate'], 
  }, // Type of room
  createdAt: { type: Date, default: Date.now },
  description: { type: String, required: true }, // Description of the goal
  targetDate: { type: Date, required: true }, // Target date for the goal
  status: { 
    type: String, 
    enum: ['Pending', 'In Progress', 'Completed'], 
    default: 'Pending' 
  }, 
});
const Goals = mongoose.model('Goals', GoalSchema);

module.exports = Chatroom;
