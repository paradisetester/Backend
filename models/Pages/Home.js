const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Hero Section Schema
const HeroSchema = new Schema({
  backgroundImage: { type: String, required: true },
  heading: { type: String, required: true },
  tagline: { type: String, required: true },
  buttonText: { type: String },
  buttonLink: { type: String }
});

// About Section Schema for Home Page
const HomeAboutSchema = new Schema({
  image: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  readMoreLink: { type: String }
});

// Service sub-schema for Home Page services
const ServiceSchema = new Schema({
  icon: { type: String, required: true }, // e.g., FontAwesome class
  title: { type: String, required: true },
  description: { type: String, required: true }
});

// Portfolio Item sub-schema for Home Page portfolio section
const PortfolioItemSchema = new Schema({
  image: { type: String, required: true },
  title: { type: String, required: true },
  alt: { type: String }
});

// Contact CTA sub-schema
const CTASchema = new Schema({
  heading: { type: String, required: true },
  subText: { type: String, required: true },
  buttonText: { type: String, required: true },
  buttonLink: { type: String, required: true }
});

// Main HomePage schema (without footer)
const HomePageSchema = new Schema({
  hero: { type: HeroSchema, required: true },
  about: { type: HomeAboutSchema, required: true },
  services: [ServiceSchema],
  portfolio: [PortfolioItemSchema],
  contactCTA: { type: CTASchema, required: true },
  updatedAt: { type: Date, default: Date.now }
});

// Automatically update the timestamp on save
HomePageSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('HomePage', HomePageSchema);
