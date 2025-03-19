const express = require('express');
const multer = require('multer');
const path = require('path');
const Blog = require('../models/Blog');
const authenticate = require('../middleware/authenticate');
const { uploadToCloudinary } = require('../utils/cloudinaryUpload');

const router = express.Router();

// Use memory storage so files are held in a buffer
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('Only images (jpeg, jpg, png, gif) are allowed.'));
    }
  },
});

/* ------------------------------------------------------------------
 ✅ Route: Add a New Blog (with Cloudinary Image Upload)
------------------------------------------------------------------ */
router.post('/add-blog', authenticate, upload.single('featuredImage'), async (req, res) => {
  const { title, content, limit } = req.body;
  if (!title || !content) {
    return res.status(400).json({ error: 'Title and content are required.' });
  }
  try {
    let featuredImage = null;
    if (req.file) {
      // Upload to "Employee Dashboard/Blog" folder.
      featuredImage = await uploadToCloudinary(req.file.buffer, "Employee Dashboard/Blog");
    }

    const newBlog = new Blog({
      title,
      content,
      uploadedBy: req.employeeId,
      uploadedOn: new Date(),
      featuredImage,
      limit: limit ? new Date(limit) : null,
    });

    await newBlog.save();
    res.status(201).json({ message: 'Blog added successfully!', blog: newBlog });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to add blog.' });
  }
});

/* ------------------------------------------------------------------
 ✅ Route: Fetch All Blogs (with Pagination & Sorting)
------------------------------------------------------------------ */
router.get('/get-blogs', async (req, res) => {
  const { page = 1, limit = 10, sortBy = 'uploadedOn' } = req.query;
  try {
    const blogs = await Blog.find()
      .populate('uploadedBy', 'name position')
      .sort({ [sortBy]: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));
    const totalBlogs = await Blog.countDocuments();
    res.status(200).json({
      totalBlogs,
      totalPages: Math.ceil(totalBlogs / limit),
      currentPage: Number(page),
      blogs,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch blogs.' });
  }
});

/* ------------------------------------------------------------------
 ✅ Route: Get Single Blog by ID
------------------------------------------------------------------ */
router.get('/get-blog/:id', async (req, res) => {
  const { id } = req.params;
  if (!id.match(/^[0-9a-fA-F]{24}$/)) {
    return res.status(400).json({ error: 'Invalid blog ID format.' });
  }
  try {
    const blog = await Blog.findById(id).populate('uploadedBy', 'name position');
    if (!blog) {
      return res.status(404).json({ error: 'Blog not found.' });
    }
    res.status(200).json(blog);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch the blog.' });
  }
});

/* ------------------------------------------------------------------
 ✅ Route: Update Blog (with Cloudinary Image Upload)
------------------------------------------------------------------ */
router.put('/update-blog/:id', authenticate, upload.single('featuredImage'), async (req, res) => {
  const { title, content, limit } = req.body;
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) {
      return res.status(404).json({ error: 'Blog not found.' });
    }
    // Authorization: allow only the author or an admin
    if (blog.uploadedBy.toString() !== req.employeeId && req.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to update this blog.' });
    }
    blog.title = title || blog.title;
    blog.content = content || blog.content;
    blog.limit = limit ? new Date(limit) : blog.limit;
    if (req.file) {
      const secureUrl = await uploadToCloudinary(req.file.buffer, "Employee Dashboard/Blog");
      blog.featuredImage = secureUrl;
    }
    await blog.save();
    res.status(200).json({ message: 'Blog updated successfully!', blog });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update blog.' });
  }
});

/* ------------------------------------------------------------------
 ✅ Route: Delete Blog (Optionally, Delete Image from Cloudinary)
------------------------------------------------------------------ */
router.delete('/delete-blog/:id', authenticate, async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) {
      return res.status(404).json({ error: 'Blog not found.' });
    }
    if (blog.uploadedBy.toString() !== req.employeeId && req.role !== 'admin' && req.role !== 'hr') {
      return res.status(403).json({ error: 'Not authorized to delete this blog.' });
    }
    // Optionally: Remove Cloudinary asset here if you stored blog.public_id.
    await blog.deleteOne();
    res.status(200).json({ message: 'Blog deleted successfully!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete blog.' });
  }
});

module.exports = router;
