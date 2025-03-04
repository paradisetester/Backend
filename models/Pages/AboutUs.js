const mongoose = require('mongoose');

// Testimonial sub-schema
const TestimonialSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  image: { type: String },
  testimonial: { type: String, required: true },
  review: { type: Number, required: true, min: 1, max: 10 }
});

// Experience sub-schema
const ExperienceSchema = new mongoose.Schema({
  projectName: { type: String, required: true, trim: true },
  workExperience: { type: String, required: true },
  image: { type: String }
});

// Team Member sub-schema
const TeamMemberSchema = new mongoose.Schema({
  name: { type: String, required: true },
  role: { type: String, required: true },
  bio: { type: String },
  image: { type: String },
  contact: { type: String }
});

// Milestone sub-schema for timeline events
const MilestoneSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  date: { type: Date },
  image: { type: String }
});

// Social Media Links sub-schema
const SocialMediaSchema = new mongoose.Schema({
  platform: { type: String, required: true },
  url: { type: String, required: true }
});

// Main About schema with mainImage added
const AboutSchema = new mongoose.Schema({
  companyName: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  mission: { type: String },
  vision: { type: String },
  coreValues: [{ type: String }],
  testimonials: [TestimonialSchema],
  experiences: [ExperienceSchema],
  team: [TeamMemberSchema],
  milestones: [MilestoneSchema],
  socialMedia: [SocialMediaSchema],
  mainImage: { type: String },  // <-- New field for the main image
  updatedAt: { type: Date, default: Date.now }
});

// Automatically update the timestamp on save
AboutSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('AboutUs', AboutSchema);
