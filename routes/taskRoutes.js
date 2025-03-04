const express = require('express');
const { body, validationResult } = require('express-validator');
const Task = require('../models/Task');
const authenticate = require('../middleware/authenticate');
const router = express.Router();

/** 
 * 📝 Get all tasks 
 */
router.get('/', authenticate, async (req, res) => {
  try {
    const tasks = await Task.find().populate('project').populate('assignedTo', 'name email');
    res.status(200).json(tasks);
  } catch (err) {
    console.error('Fetch Tasks Error:', err.message);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

/** 
 * 📝 Get a task by ID
 */
router.get('/:id', authenticate, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id).populate('project').populate('assignedTo', 'name email');
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    res.status(200).json(task);
  } catch (err) {
    console.error('Fetch Task Error:', err.message);
    res.status(500).json({ error: 'Failed to fetch task' });
  }
});
/** 
 * 📝 Get a task by project id
 */
router.get('/:id', authenticate, async (req, res) => {
  try {
    const task = await Task.findById(req.params.project).populate('project').populate('assignedTo', 'name email');
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    res.status(200).json(task);
  } catch (err) {
    console.error('Fetch Task Error:', err.message);
    res.status(500).json({ error: 'Failed to fetch task' });
  }
});

/** 
 * 📝 Create a new task
 */
router.post('/', authenticate, [
  body('project').notEmpty().withMessage('Project is required'),
  body('type').notEmpty().withMessage('Task type is required'),
  body('required_department').notEmpty().withMessage('Required department is required'),
  body('title').notEmpty().withMessage('Task title is required'),
  body('assignedTo').notEmpty().withMessage('Assigned employee is required'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { project, type, required_department, title, description, assignedTo, status, dueDate, createdBy } = req.body;

  try {
    const task = new Task({ project, type, required_department, title, description, assignedTo, status, dueDate, createdBy });
    await task.save();
    res.status(201).json({ message: 'Task created successfully', task });
  } catch (err) {
    console.error('Task Creation Error:', err.message);
    res.status(500).json({ error: 'Failed to create task' });
  }
});

/** 
 * 📝 Update a task by ID
 */
router.put('/:id', authenticate, [
  body('project').optional().notEmpty().withMessage('Project is required'),
  body('type').optional().notEmpty().withMessage('Task type is required'),
  body('required_department').optional().notEmpty().withMessage('Required department is required'),
  body('title').optional().notEmpty().withMessage('Task title is required'),
  body('assignedTo').optional().notEmpty().withMessage('Assigned employee is required'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const task = await Task.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    res.status(200).json({ message: 'Task updated successfully', task });
  } catch (err) {
    console.error('Update Task Error:', err.message);
    res.status(500).json({ error: 'Failed to update task' });
  }
});

/** 
 * 📝 Delete a task by ID
 */
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    res.status(200).json({ message: 'Task deleted successfully' });
  } catch (err) {
    console.error('Delete Task Error:', err.message);
    res.status(500).json({ error: 'Failed to delete task' });
  }
});
/**
 * 📝 Get tasks by employee ID (assignedTo)
 */
router.get('/employee/:id', authenticate, async (req, res) => {
  try {
    const employeeId = req.params.id;
    const tasks = await Task.find({ assignedTo: employeeId })
      .populate('project')
      .populate('assignedTo', 'name email');

    // If no tasks are found, return an empty array with a 200 status code
    if (!tasks || tasks.length === 0) {
      return res.status(200).json([]);
    }

    res.status(200).json(tasks);
  } catch (err) {
    console.error('Fetch Tasks by Employee ID Error:', err.message);
    res.status(500).json({ error: 'Failed to fetch tasks for the employee' });
  }
});

module.exports = router;
