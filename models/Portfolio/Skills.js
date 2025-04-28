// models/Pages/Skill.js
const mongoose = require('mongoose');

const SkillSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  image: {
    type: String
  },
  description: {
    type: String,
    required: true
  },
  level: {
    type: Number,
    required: true,
    min: 1,
    max: 10
  }
}, {
  timestamps: true   // adds createdAt & updatedAt fields
});

module.exports = mongoose.model('Skill', SkillSchema);
