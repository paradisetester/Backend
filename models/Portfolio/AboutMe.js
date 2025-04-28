// models/Pages/AboutMe.js
const mongoose = require('mongoose');

// Testimonial sub-schema
const TestimonialSchema = new mongoose.Schema({
  name:    { type: String, required: true, trim: true },
  image:   { type: String },
  testimonial: { type: String, required: true },
  review:  { type: Number, required: true, min: 1, max: 10 }
});

// Social Media Links sub-schema
const SocialMediaSchema = new mongoose.Schema({
  platform: { type: String, required: true },
  url:      { type: String, required: true }
});

// Experience sub-schema
const ExperienceSchema = new mongoose.Schema({
  projectName:    { type: String, required: true, trim: true },
  workExperience: { type: String, required: true },
  image:          { type: String }
});

// Main AboutMe schema
const AboutMeSchema = new mongoose.Schema({
  name:         { type: String, required: true, trim: true },
  description:  { type: String, required: true },
  coreValues:   [{ type: String }],
  testimonials: [TestimonialSchema],
  experiences:  [ExperienceSchema],
  socialMedia:  [SocialMediaSchema],
  mainImage:    { type: String }
}, {
  timestamps: true   // <-- adds createdAt & updatedAt automatically
});

module.exports = mongoose.model('AboutMe', AboutMeSchema);
