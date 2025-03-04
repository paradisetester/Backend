const express = require('express');
const multer = require('multer');
const path = require('path');

const router = express.Router();

// ⚙️ Configure Multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Files will be saved in 'uploads/' folder
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`); // Unique file name
  }
});

// 🛡️ File filter (Optional)
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|pdf/;
  const extName = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimeType = allowedTypes.test(file.mimetype);

  if (extName && mimeType) {
    return cb(null, true);
  } else {
    cb(new Error('Only images and PDFs are allowed'));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// 📤 Upload a single file
router.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  res.status(201).json({
    message: 'File uploaded successfully',
    filePath: `/uploads/${req.file.filename}`,
  });
});

// 📥 Fetch uploaded files (if required)
router.get('/files', (req, res) => {
  res.status(200).json({
    message: 'Use the file path from upload API to access the file',
  });
});

module.exports = router;
