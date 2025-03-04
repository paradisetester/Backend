const mongoose = require('mongoose');

const ProjectSchema = new mongoose.Schema({
  project: { type: String, required: true },
  name: { type: String, required: true },
  category: { type: String, required: true },
  description: { type: String, required: true },
  email: { type: String, required: true },
  manager: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true }, // Reference to Employee
  assignedto: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Employee' }], // Array for multiple assignees
  tasks: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Task' }], // Array of Task references
  status: { type: String, enum: ['Planned', 'Active', 'On Hold', 'Completed'], default: 'Planned' },
  startDate: { type: Date },
  createdAt: { type: Date, default: Date.now },
});

const Project = mongoose.model('Project', ProjectSchema);

module.exports = Project;
