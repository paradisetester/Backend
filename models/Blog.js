const mongoose = require('mongoose');

const blogSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  uploadedOn: { type: Date, default: Date.now },
  featuredImage: { type: String }, // URL or file path
  limit: { type: Date, default: null }, // Null implies infinite
});

module.exports = mongoose.model('Blog', blogSchema);
