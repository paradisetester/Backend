const express = require('express');
const Projects = require('../../models/Portfolio/Projects');
// const authenticate = require('../middleware/authenticate'); // uncomment if you have auth

const router = express.Router();

/**
 * @route   POST /api/projects
 * @desc    Create a new project
 * @access  Protected (uncomment authenticate if needed)
 */
router.post(
  '/',
  // authenticate,
  async (req, res) => {
    try {
      const {
        title,
        description,
        technologies,
        githubLink,
        liveDemoLink,
        image
      } = req.body;

      // Basic validation
      if (!title || !description || !technologies) {
        return res.status(400).json({
          error: 'Title, description and technologies are required.'
        });
      }

      const project = new Projects({
        title,
        description,
        technologies,
        githubLink,
        liveDemoLink,
        image
      });

      await project.save();
      res.status(201).json({ message: 'Project created', project });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Server error – could not create project.' });
    }
  }
);

/**
 * @route   GET /api/projects
 * @desc    Fetch all projects
 * @access  Public
 */
router.get('/', async (req, res) => {
  try {
    const projects = await Projects.find().sort({ createdAt: -1 });
    res.json(projects);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error – could not fetch projects.' });
  }
});

/**
 * @route   GET /api/projects/:id
 * @desc    Fetch a single project by ID
 * @access  Public
 */
router.get('/:id', async (req, res) => {
  const { id } = req.params;

  // Validate ObjectId format
  if (!id.match(/^[0-9a-fA-F]{24}$/)) {
    return res.status(400).json({ error: 'Invalid project ID.' });
  }

  try {
    const project = await Projects.findById(id);
    if (!project) {
      return res.status(404).json({ error: 'Project not found.' });
    }
    res.json(project);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error – could not fetch project.' });
  }
});

/**
 * @route   PUT /api/projects/:id
 * @desc    Update a project by ID
 * @access  Protected (uncomment authenticate if needed)
 */
router.put(
  '/:id',
  // authenticate,
  async (req, res) => {
    const { id } = req.params;
    const updates = req.body;

    // Validate ObjectId format
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ error: 'Invalid project ID.' });
    }

    try {
      const project = await Projects.findById(id);
      if (!project) {
        return res.status(404).json({ error: 'Project not found.' });
      }

      // Apply updates
      Object.keys(updates).forEach((key) => {
        project[key] = updates[key];
      });
      project.updatedAt = Date.now();

      await project.save();
      res.json({ message: 'Project updated', project });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Server error – could not update project.' });
    }
  }
);

/**
 * @route   DELETE /api/projects/:id
 * @desc    Delete a project by ID
 * @access  Protected (uncomment authenticate if needed)
 */
router.delete(
  '/:id',
  // authenticate,
  async (req, res) => {
    const { id } = req.params;

    // Validate ObjectId format
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ error: 'Invalid project ID.' });
    }

    try {
      const project = await Projects.findById(id);
      if (!project) {
        return res.status(404).json({ error: 'Project not found.' });
      }

      await project.deleteOne();
      res.json({ message: 'Project deleted' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Server error – could not delete project.' });
    }
  }
);

module.exports = router;
