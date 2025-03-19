const express = require('express');
const multer = require('multer'); // Middleware for file uploads
const path = require('path');
const Blog = require('../models/Blog');
const authenticate = require('../middleware/authenticate');
const cloudinary = require('cloudinary').v2; // Cloudinary SDK
require('dotenv').config(); // Load environment variables

const router = express.Router();

// Configure Cloudinary using the CLOUDINARY_URL from your .env file
cloudinary.config(process.env.CLOUDINARY_URL);

/* ------------------------------------------------------------------
 ✅ Multer Configuration using Memory Storage (for Cloudinary Upload)
------------------------------------------------------------------ */
const storage = multer.memoryStorage();
const upload = multer({
	storage,
	fileFilter: (req, file, cb) => {
		// Allow only images (jpeg, jpg, png, gif)
		const allowedTypes = /jpeg|jpg|png|gif/;
		const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
		const mimetype = allowedTypes.test(file.mimetype);

		if (extname && mimetype) {
			return cb(null, true);
		} else {
			cb(new Error('Only images (jpeg, jpg, png, gif) are allowed.'));
		}
	}
});

/* ------------------------------------------------------------------
 ✅ Helper Function: Upload File Buffer to Cloudinary
     - Uploads the image to the "Employee Dashboard" folder.
------------------------------------------------------------------ */
const uploadToCloudinary = (fileBuffer) => {
	return new Promise((resolve, reject) => {
		const stream = cloudinary.uploader.upload_stream(
			{ folder: "Employee Dashboard" },
			(error, result) => {
				if (error) return reject(error);
				resolve(result);
			}
		);
		stream.end(fileBuffer);
	});
};

/* ------------------------------------------------------------------
 ✅ Route: Add a New Blog (with Cloudinary Image Upload)
------------------------------------------------------------------ */
router.post('/add-blog', authenticate, upload.single('featuredImage'), async (req, res) => {
	const { title, content, limit } = req.body;

	if (!title || !content) {
		return res.status(400).json({ error: 'Title and content are required.' });
	}

	try {
		// If a file is uploaded, send its buffer to Cloudinary
		let featuredImage = null;
		if (req.file) {
			const result = await uploadToCloudinary(req.file.buffer);
			featuredImage = result.secure_url;
			// Optionally, store result.public_id if you plan to manage the image (e.g., delete or update) later.
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

		// Authorization check: allow only the author or admin
		if (blog.uploadedBy.toString() !== req.employeeId && req.role !== 'admin') {
			return res.status(403).json({ error: 'Not authorized to update this blog.' });
		}

		// Update text fields
		blog.title = title || blog.title;
		blog.content = content || blog.content;
		blog.limit = limit ? new Date(limit) : blog.limit;

		// If a new image is uploaded, upload to Cloudinary
		if (req.file) {
			// Optionally: If you stored the previous image's public_id, you can delete it:
			// if (blog.cloudinaryPublicId) {
			//    await cloudinary.uploader.destroy(blog.cloudinaryPublicId);
			// }

			const result = await uploadToCloudinary(req.file.buffer);
			blog.featuredImage = result.secure_url;
			// Optionally, store result.public_id for future management.
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

		// Authorization check
		if (blog.uploadedBy.toString() !== req.employeeId && req.role !== 'admin') {
			return res.status(403).json({ error: 'Not authorized to delete this blog.' });
		}

		// Optionally: Delete image from Cloudinary if you stored the public_id
		// if (blog.cloudinaryPublicId) {
		//    await cloudinary.uploader.destroy(blog.cloudinaryPublicId);
		// }

		await blog.deleteOne();
		res.status(200).json({ message: 'Blog deleted successfully!' });
	} catch (err) {
		console.error(err);
		res.status(500).json({ error: 'Failed to delete blog.' });
	}
});

/* ------------------------------------------------------------------
 ✅ Export Router
------------------------------------------------------------------ */
module.exports = router;
