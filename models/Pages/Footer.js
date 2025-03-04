const mongoose = require('mongoose');

const FooterSchema = new mongoose.Schema({
  mainImage: { type: String, required: true },
  text: { type: String, required: true },
  quickLinks: [
    {
      label: { type: String, required: true },
      url: { type: String, required: true }
    }
  ],
  services: [
    {
      label: { type: String, required: true },
      url: { type: String, required: true }
    }
  ],
  contactUs: {
    address: { type: String, required: true },
    phone: { type: String, required: true },
    emails: [{ type: String, required: true }]
  },
  updatedAt: { type: Date, default: Date.now }
});

// Automatically update timestamp before saving
FooterSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Footer', FooterSchema);
