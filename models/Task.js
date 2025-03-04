const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema({
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true }, // Reference to Project
  type: { type: String, required: true },
  required_department: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true }, // Task assignee
  status: { type: String, enum: ['Pending', 'In Progress', 'Completed'], default: 'Pending' },
  dueDate: { type: Date, default:null },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' }, // Task creator (admin/manager)
  createdAt: { type: Date, default: Date.now },
});

const Task = mongoose.model('Task', TaskSchema);

module.exports = Task;
