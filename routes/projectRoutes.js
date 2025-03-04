const express = require('express');
const { body, validationResult } = require('express-validator');
const Project = require('../models/Project');
const Task = require('../models/Task');
const authenticate = require('../middleware/authenticate');
const router = express.Router();

/** 
 * 📝 Get all projects
 */
router.get('/', authenticate, async (req, res) => {
  try {
    const projects = await Project.find().populate('tasks').populate('manager', 'name email').populate('assignedto', 'name email');
    res.status(200).json(projects);
  } catch (err) {
    console.error('Fetch Projects Error:', err.message);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

/** 
 * 📝 Get a project by ID
 */
router.get('/:id', authenticate, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id).populate('tasks').populate('manager', 'name email').populate('assignedto', 'name email');
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    res.status(200).json(project);
  } catch (err) {
    console.error('Fetch Project Error:', err.message);
    res.status(500).json({ error: 'Failed to fetch project' });
  }
});

/** 
 * 📝 Create a new project
 */
router.post('/', authenticate, [
  body('project').notEmpty().withMessage('Project name is required'),
  body('name').notEmpty().withMessage('Project name is required'),
  body('category').notEmpty().withMessage('Project category is required'),
  body('description').notEmpty().withMessage('Project description is required'),
  body('email').isEmail().withMessage('Invalid email address'),
  body('manager').notEmpty().withMessage('Project manager is required'),
  body('assignedto').notEmpty().withMessage('Assigned employee is required'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { project, name, category, description, email, manager, assignedto } = req.body;

  try {
    const newProject = new Project({ project, name, category, description, email, manager, assignedto });
    await newProject.save();
    res.status(201).json({ message: 'Project created successfully', project: newProject });
  } catch (err) {
    console.error('Project Creation Error:', err.message);
    res.status(500).json({ error: 'Failed to create project' });
  }
});

/** 
 * 📝 Update a project by ID
 */
router.put('/:id', authenticate, [
  body('project').optional().notEmpty().withMessage('Project name is required'),
  body('name').optional().notEmpty().withMessage('Project name is required'),
  body('category').optional().notEmpty().withMessage('Project category is required'),
  body('description').optional().notEmpty().withMessage('Project description is required'),
  body('email').optional().isEmail().withMessage('Invalid email address'),
  body('manager').optional().notEmpty().withMessage('Project manager is required'),
  body('assignedto').optional().notEmpty().withMessage('Assigned employee is required'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const updatedProject = await Project.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updatedProject) {
      return res.status(404).json({ error: 'Project not found' });
    }
    res.status(200).json({ message: 'Project updated successfully', project: updatedProject });
  } catch (err) {
    console.error('Update Project Error:', err.message);
    res.status(500).json({ error: 'Failed to update project' });
  }
});

/** 
 * 📝 Delete a project by ID
 */
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const project = await Project.findByIdAndDelete(req.params.id);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Optionally delete associated tasks
    await Task.deleteMany({ project: project._id });

    res.status(200).json({ message: 'Project and associated tasks deleted successfully' });
  } catch (err) {
    console.error('Delete Project Error:', err.message);
    res.status(500).json({ error: 'Failed to delete project' });
  }
});

module.exports = router;
