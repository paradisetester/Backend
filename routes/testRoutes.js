const express = require('express');
const multer = require('multer'); // File upload middleware
const path = require('path');
const fs = require('fs');
const Test = require('../models/test');
const authenticate = require('../middleware/authenticate');

const router = express.Router();

/* ------------------------------------------
 ✅ Multer Configuration for File Uploads
------------------------------------------ */

// Define the storage engine with custom destination and filename settings
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../testUploads');
    // Ensure the upload directory exists; if not, create it
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Generate a unique filename by prefixing the original name with a timestamp
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

// Define allowed file extensions and their corresponding MIME types
const allowedExtensions = ['.txt', '.doc', '.docx', '.pdf', '.mp3', '.mp4'];
const allowedMimetypes = [
  'text/plain',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/pdf',
  'audio/mpeg',
  'video/mp4',
];

// Configure Multer with the storage engine and a file filter for validation
const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const isValidExtension = allowedExtensions.includes(ext);
    const isValidMimetype = allowedMimetypes.includes(file.mimetype);

    if (isValidExtension && isValidMimetype) {
      return cb(null, true);
    } else {
      cb(new Error('Invalid file type!'));
    }
  },
});

/* ------------------------------------------
 ✅ Route to Upload a File
------------------------------------------ */
router.post(
  '/upload',
  authenticate,
  upload.single('file'),
  async (req, res) => {
    try {
      // Check if a file was provided in the request
      if (!req.file) {
        return res.status(400).json({ error: 'No file provided' });
      }
      // Create a relative path to the uploaded file for client access
      const filePath = `/testUploads/${req.file.filename}`;
      
      // Create a new Test document to store file information
      const test = new Test({
        title: req.body.title,
        content: filePath, // using the relative path
      });
      
      // Save the document to the database
      await test.save();
      
      res
        .status(201)
        .json({ message: 'File uploaded successfully!', file: filePath });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to upload file.' });
    }
  }
);

/* ------------------------------------------
 ✅ Export Router
------------------------------------------ */
module.exports = router;
