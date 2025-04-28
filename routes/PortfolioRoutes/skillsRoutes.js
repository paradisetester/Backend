const express = require('express');
const Skill   = require('../models/Pages/Skill');
const authenticate = require('../middleware/authenticate'); // if you have auth

const router = express.Router();

/**
 * @route   POST /api/skills
 * @desc    Create a new skill
 * @access  Protected (add authenticate if needed)
 */
router.post(
  '/',
  // authenticate,
  async (req, res) => {
    try {
      const { name, image, description, level } = req.body;

      // Basic validation
      if (!name || !description || level == null) {
        return res.status(400).json({
          error: 'name, description and level are required.'
        });
      }

      const skill = new Skill({ name, image, description, level });
      await skill.save();
      res.status(201).json({ message: 'Skill created.', skill });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Server error – could not create skill.' });
    }
  }
);

/**
 * @route   GET /api/skills
 * @desc    Fetch all skills
 * @access  Public
 */
router.get('/', async (req, res) => {
  try {
    const skills = await Skill.find().sort({ createdAt: -1 });
    res.json(skills);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error – could not fetch skills.' });
  }
});

/**
 * @route   GET /api/skills/:id
 * @desc    Fetch a single skill by ID
 * @access  Public
 */
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  if (!id.match(/^[0-9a-fA-F]{24}$/)) {
    return res.status(400).json({ error: 'Invalid skill ID.' });
  }

  try {
    const skill = await Skill.findById(id);
    if (!skill) {
      return res.status(404).json({ error: 'Skill not found.' });
    }
    res.json(skill);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error – could not fetch skill.' });
  }
});

/**
 * @route   PUT /api/skills/:id
 * @desc    Update a skill by ID
 * @access  Protected (add authenticate if needed)
 */
router.put(
  '/:id',
  // authenticate,
  async (req, res) => {
    const { id } = req.params;
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ error: 'Invalid skill ID.' });
    }

    try {
      const updates = req.body;
      const skill = await Skill.findByIdAndUpdate(id, updates, {
        new: true,
        runValidators: true
      });

      if (!skill) {
        return res.status(404).json({ error: 'Skill not found.' });
      }

      res.json({ message: 'Skill updated.', skill });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Server error – could not update skill.' });
    }
  }
);

/**
 * @route   DELETE /api/skills/:id
 * @desc    Delete a single skill by ID
 * @access  Protected (add authenticate if needed)
 */
router.delete(
  '/:id',
  // authenticate,
  async (req, res) => {
    const { id } = req.params;
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ error: 'Invalid skill ID.' });
    }

    try {
      const skill = await Skill.findByIdAndDelete(id);
      if (!skill) {
        return res.status(404).json({ error: 'Skill not found.' });
      }
      res.json({ message: 'Skill deleted.' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Server error – could not delete skill.' });
    }
  }
);

module.exports = router;
