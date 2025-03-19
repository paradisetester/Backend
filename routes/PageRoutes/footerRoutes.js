const express = require('express');
const multer = require('multer');
const path = require('path');
const Footer = require('../../models/Pages/Footer');
const authenticate = require('../../middleware/authenticate');
const { uploadToCloudinary } = require('../../utils/cloudinaryUpload');

const router = express.Router();

// Use memory storage for file uploads
const storage = multer.memoryStorage();
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
    // Upload mainImage to Cloudinary (e.g., "EmployeeDashboard/Footer/Main")
    const mainImage = await uploadToCloudinary(req.file.buffer, "EmployeeDashboard/Footer/Main");

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
      footer.mainImage = await uploadToCloudinary(req.file.buffer, "EmployeeDashboard/Footer/Main");
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
