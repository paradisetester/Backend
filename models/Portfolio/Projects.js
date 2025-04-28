const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true,
    },
    description: {
        type: String,
        required: true,
    },
    technologies: {
        type: [String],
        required: true,
    },
    githubLink: {
        type: String,
        required: false,
    },
    liveDemoLink: {
        type: String,
        required: false,
    },
    image: {
        type: String,
        required: false,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

const Projects = mongoose.model('PortfolioProjects', projectSchema);

module.exports = Projects;