// models/Category.js
const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  // Allow multiple blog references
  blogs: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Blog' }],
});

module.exports = mongoose.model('Category', categorySchema);
