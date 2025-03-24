const express = require('express');
const mongoose = require('mongoose');
const ContactFormEntries = require('../../models/Pages/ContactForm');
const authenticate = require('../../middleware/authenticate');

const router = express.Router();

/* ------------------------------------------
 ✅ Route: Fetch All Contact Form Entries
------------------------------------------ */
router.get('/get-entries', authenticate, async (req, res) => {
  try {
    const entries = await ContactFormEntries.find();
    res.status(200).json(entries);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch entries.' });
  }
});

/* ------------------------------------------
 ✅ Route: Add a New Contact Form Entry
------------------------------------------ */
router.post('/add-entry', async (req, res) => {
  const { name, email, message } = req.body;

  if (!name || !email) {
    return res.status(400).json({ error: 'Name and email are required.' });
  }

  try {
    // Create a new contact form entry
    const newEntry = new ContactFormEntries({
      name,
      email,
      message,
    });

    await newEntry.save();
    res.status(201).json({ 
      message: 'Contact form submitted successfully!', 
      contactFormData: newEntry 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to add entry.' });
  }
});

/* ------------------------------------------
 ✅ Route: Delete Contact Form Entry
------------------------------------------ */
router.delete('/delete-entry/:id', authenticate, async (req, res) => {
  try {
    const entry = await ContactFormEntries.findById(req.params.id);
    if (!entry) {
      return res.status(404).json({ error: 'Entry not found.' });
    }

    await entry.deleteOne();
    res.status(200).json({ message: 'Entry deleted successfully!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete entry.' });
  }
});

module.exports = router;
