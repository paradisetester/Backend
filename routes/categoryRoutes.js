// routes/categoryRoutes.js
const express = require('express');
const mongoose = require('mongoose');
const Category = require('../models/Category');
const Blog = require('../models/Blog');
const authenticate = require('../middleware/authenticate');

const router = express.Router();

/* ------------------------------------------
 ✅ Route: Fetch All Categories
------------------------------------------ */
router.get('/get-categories', async (req, res) => {
  try {
    // Retrieve all categories
    const categories = await Category.find();
    res.status(200).json(categories);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch categories.' });
  }
});

/* ------------------------------------------
 ✅ Route: Get Blogs for a Specific Category
------------------------------------------ */
router.get('/get-category/:id/blogs', async (req, res) => {
  const { id } = req.params;
  const { page = 1, limit = 10, sortBy = 'uploadedOn' } = req.query;

  // Validate category ID format (MongoDB ObjectId)
  if (!id.match(/^[0-9a-fA-F]{24}$/)) {
    return res.status(400).json({ error: 'Invalid category ID format.' });
  }

  try {
    // Find the category by ID
    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({ error: 'Category not found.' });
    }

    // Get the blog IDs associated with this category
    const blogIds = category.blogs;

    // Query the blogs collection using the IDs from the category
    const blogs = await Blog.find({ _id: { $in: blogIds } })
      .populate('uploadedBy', 'name position') // populate fields as needed
      .sort({ [sortBy]: -1 })
      .skip((page - 1) * Number(limit))
      .limit(Number(limit));

    const totalBlogs = await Blog.countDocuments({ _id: { $in: blogIds } });

    res.status(200).json({
      totalBlogs,
      currentPage: Number(page),
      totalPages: Math.ceil(totalBlogs / Number(limit)),
      blogs,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch blogs for the category.' });
  }
});

/* ------------------------------------------
 ✅ Route: Add a New Category
------------------------------------------ */
router.post('/add-category', authenticate, async (req, res) => {
  const { name, description, blogs } = req.body;

  if (!name || !description) {
    return res.status(400).json({ error: 'Name and description are required.' });
  }

  try {
    // Create a new category. Optionally, blogs can be passed as an array of blog IDs.
    const newCategory = new Category({
      name,
      description,
      blogs: blogs || [],
    });

    await newCategory.save();
    res.status(201).json({ message: 'Category added successfully!', category: newCategory });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to add category.' });
  }
});

/* ------------------------------------------
 ✅ Route: Update Category
------------------------------------------ */
router.put('/update-category/:id', authenticate, async (req, res) => {
  const { name, description, blogs } = req.body;

  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ error: 'Category not found.' });
    }

    // Update only provided fields
    category.name = name || category.name;
    category.description = description || category.description;
    if (blogs) {
      category.blogs = blogs; // expecting an array of blog IDs
    }

    await category.save();
    res.status(200).json({ message: 'Category updated successfully!', category });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update category.' });
  }
});

/* ------------------------------------------
 ✅ Route: Delete Category
------------------------------------------ */
router.delete('/delete-category/:id', authenticate, async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ error: 'Category not found.' });
    }

    await category.deleteOne();
    res.status(200).json({ message: 'Category deleted successfully!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete category.' });
  }
});

module.exports = router;
