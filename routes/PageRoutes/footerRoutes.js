const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Footer = require('../../models/Pages/Footer'); // Updated Footer model path
const authenticate = require('../../middleware/authenticate');

const router = express.Router();

/* ------------------------------------------
 ✅ Multer Configuration for File Uploads (mainImage)
------------------------------------------ */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../../uploads');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});
const upload = multer({ storage });

/* ------------------------------------------
 ✅ Route: Add New Footer Content
------------------------------------------ */
router.post('/add-footer', authenticate, upload.single('mainImage'), async (req, res) => {
  try {
    const { text, quickLinks, services, contactUs } = req.body;
    if (!text) {
      return res.status(400).json({ error: 'Footer text is required.' });
    }
    if (!req.file) {
      return res.status(400).json({ error: 'Footer mainImage is required.' });
    }
    const mainImage = `/uploads/${req.file.filename}`;

    // Parse nested fields if provided as JSON strings
    const parsedQuickLinks = typeof quickLinks === 'string' ? JSON.parse(quickLinks) : quickLinks || [];
    const parsedServices = typeof services === 'string' ? JSON.parse(services) : services || [];
    const parsedContactUs = typeof contactUs === 'string' ? JSON.parse(contactUs) : contactUs;

    // Validate contactUs fields
    if (!parsedContactUs || !parsedContactUs.address || !parsedContactUs.phone || !parsedContactUs.emails) {
      return res.status(400).json({ error: 'Complete contactUs information is required (address, phone, emails).' });
    }

    const newFooter = new Footer({
      mainImage,
      text,
      quickLinks: parsedQuickLinks,
      services: parsedServices,
      contactUs: parsedContactUs,
    });
    await newFooter.save();
    res.status(201).json({ message: 'Footer content added successfully!', footer: newFooter });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to add Footer content.' });
  }
});

/* ------------------------------------------
 ✅ Route: Fetch Footer Content
------------------------------------------ */
router.get('/get-footer', async (req, res) => {
  try {
    // Assuming only one Footer document exists; otherwise, use .find() to return an array.
    const footer = await Footer.findOne();
    if (!footer) {
      return res.status(404).json({ error: 'Footer content not found.' });
    }
    res.status(200).json(footer);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch Footer content.' });
  }
});

/* ------------------------------------------
 ✅ Route: Get Single Footer by ID
------------------------------------------ */
router.get('/get-footer/:id', async (req, res) => {
  const { id } = req.params;
  if (!id.match(/^[0-9a-fA-F]{24}$/)) {
    return res.status(400).json({ error: 'Invalid Footer ID format.' });
  }
  try {
    const footer = await Footer.findById(id);
    if (!footer) {
      return res.status(404).json({ error: 'Footer content not found.' });
    }
    res.status(200).json(footer);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch Footer content.' });
  }
});

/* ------------------------------------------
 ✅ Route: Update Footer Content
------------------------------------------ */
router.put('/update-footer/:id', upload.single('mainImage'), async (req, res) => {
  try {
    const { text, quickLinks, services, contactUs } = req.body;
    const footer = await Footer.findById(req.params.id);
    if (!footer) {
      return res.status(404).json({ error: 'Footer content not found.' });
    }
    // Update mainImage if a new file is provided
    if (req.file) {
      // Optionally, delete the old image file here
      footer.mainImage = `/uploads/${req.file.filename}`;
    }
    footer.text = text || footer.text;
    if (quickLinks) {
      footer.quickLinks = typeof quickLinks === 'string' ? JSON.parse(quickLinks) : quickLinks;
    }
    if (services) {
      footer.services = typeof services === 'string' ? JSON.parse(services) : services;
    }
    if (contactUs) {
      footer.contactUs = typeof contactUs === 'string' ? JSON.parse(contactUs) : contactUs;
    }
    footer.updatedAt = Date.now();
    await footer.save();
    res.status(200).json({ message: 'Footer content updated successfully!', footer });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update Footer content.' });
  }
});

/* ------------------------------------------
 ✅ Route: Delete Footer Content
------------------------------------------ */
router.delete('/delete-footer/:id', authenticate, async (req, res) => {
  try {
    const footer = await Footer.findById(req.params.id);
    if (!footer) {
      return res.status(404).json({ error: 'Footer content not found.' });
    }
    await footer.deleteOne();
    res.status(200).json({ message: 'Footer content deleted successfully!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete Footer content.' });
  }
});

module.exports = router;
