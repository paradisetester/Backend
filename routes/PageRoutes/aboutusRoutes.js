const express = require('express');
const multer = require('multer'); // File upload middleware
const path = require('path');
const fs = require('fs');
const About = require('../../models/Pages/AboutUs');
const authenticate = require('../../middleware/authenticate');

const router = express.Router();

/* ------------------------------------------
 ✅ Multer Configuration for File Uploads
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
  }
});

/* ------------------------------------------
 ✅ Route: Add a New About Us Content
------------------------------------------ */
router.post(
  '/add-aboutus',
  authenticate,
  upload.fields([
    { name: 'mainImage', maxCount: 1 },
    { name: 'testimonialImages' },
    { name: 'experienceImages' },
    { name: 'teamImages' },
    { name: 'milestoneImages' },
  ]),
  async (req, res) => {
    const {
      companyName,
      description,
      mission,
      vision,
      coreValues,
      testimonials,
      experiences,
      team,
      milestones,
      socialMedia,
    } = req.body;

    if (!companyName || !description) {
      return res.status(400).json({ error: 'Company name and description are required.' });
    }

    try {
      // Process the main image using optional chaining
      const mainImage = req.files?.mainImage
        ? `/uploads/${req.files.mainImage[0].filename}`
        : null;

      // Parse JSON fields (they might be sent as strings)
      const parsedCoreValues = typeof coreValues === 'string' ? JSON.parse(coreValues) : coreValues;
      const parsedTestimonials =
        typeof testimonials === 'string' ? JSON.parse(testimonials) : testimonials || [];
      const parsedExperiences =
        typeof experiences === 'string' ? JSON.parse(experiences) : experiences || [];
      const parsedTeam = typeof team === 'string' ? JSON.parse(team) : team || [];
      const parsedMilestones =
        typeof milestones === 'string' ? JSON.parse(milestones) : milestones || [];
      const parsedSocialMedia =
        typeof socialMedia === 'string' ? JSON.parse(socialMedia) : socialMedia || [];

      // Map uploaded nested images to their corresponding entries (if they exist)
      if (req.files?.testimonialImages) {
        req.files.testimonialImages.forEach((file, index) => {
          if (parsedTestimonials[index]) {
            parsedTestimonials[index].image = `/uploads/${file.filename}`;
          }
        });
      }

      if (req.files?.experienceImages) {
        req.files.experienceImages.forEach((file, index) => {
          if (parsedExperiences[index]) {
            parsedExperiences[index].image = `/uploads/${file.filename}`;
          }
        });
      }

      if (req.files?.teamImages) {
        req.files.teamImages.forEach((file, index) => {
          if (parsedTeam[index]) {
            parsedTeam[index].image = `/uploads/${file.filename}`;
          }
        });
      }

      if (req.files?.milestoneImages) {
        req.files.milestoneImages.forEach((file, index) => {
          if (parsedMilestones[index]) {
            parsedMilestones[index].image = `/uploads/${file.filename}`;
          }
        });
      }

      const newAbout = new About({
        companyName,
        description,
        mission,
        vision,
        coreValues: parsedCoreValues,
        testimonials: parsedTestimonials,
        experiences: parsedExperiences,
        team: parsedTeam,
        milestones: parsedMilestones,
        socialMedia: parsedSocialMedia,
        mainImage,
      });

      await newAbout.save();
      res.status(201).json({ message: 'About Us content added successfully!', about: newAbout });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to add About Us content.' });
    }
  }
);




/* ------------------------------------------
 ✅ Route: Fetch About Us Content
------------------------------------------ */
router.get('/get-aboutus', async (req, res) => {
  try {
    // Assuming only one About Us document exists; otherwise, you can use .find() to return an array.
    const about = await About.findOne();
    if (!about) {
      return res.status(404).json({ error: 'About Us content not found.' });
    }
    res.status(200).json(about);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch About Us content.' });
  }
});

/* ------------------------------------------
 ✅ Route: Get Single About Us by ID
------------------------------------------ */
router.get('/get-aboutus/:id', async (req, res) => {
  const { id } = req.params;
  
  // Validate ID format
  if (!id.match(/^[0-9a-fA-F]{24}$/)) {
    return res.status(400).json({ error: 'Invalid About Us ID format.' });
  }
  
  try {
    const about = await About.findById(id);
    if (!about) {
      return res.status(404).json({ error: 'About Us content not found.' });
    }
    res.status(200).json(about);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch About Us content.' });
  }
});

/* ------------------------------------------
 ✅ Route: Update About Us Content
------------------------------------------ */
// Update About Us Content Route
router.put(
  '/update-aboutus/:id',
  upload.fields([
    { name: 'mainImage', maxCount: 1 },
    { name: 'testimonialImages' },
    { name: 'experienceImages' },
    { name: 'teamImages' },
    { name: 'milestoneImages' },
  ]),
  async (req, res) => {
    const {
      companyName,
      description,
      mission,
      vision,
      coreValues,
      testimonials,
      experiences,
      team,
      milestones,
      socialMedia,
    } = req.body;
    
    try {
      const about = await About.findById(req.params.id);
      if (!about) {
        return res.status(404).json({ error: 'About Us content not found.' });
      }
      
      // Update basic fields
      about.companyName = companyName || about.companyName;
      about.description = description || about.description;
      about.mission = mission || about.mission;
      about.vision = vision || about.vision;
      about.coreValues = coreValues
        ? (typeof coreValues === 'string' ? JSON.parse(coreValues) : coreValues)
        : about.coreValues;
      about.testimonials = testimonials
        ? (typeof testimonials === 'string' ? JSON.parse(testimonials) : testimonials)
        : about.testimonials;
      about.experiences = experiences
        ? (typeof experiences === 'string' ? JSON.parse(experiences) : experiences)
        : about.experiences;
      about.team = team
        ? (typeof team === 'string' ? JSON.parse(team) : team)
        : about.team;
      about.milestones = milestones
        ? (typeof milestones === 'string' ? JSON.parse(milestones) : milestones)
        : about.milestones;
      about.socialMedia = socialMedia
        ? (typeof socialMedia === 'string' ? JSON.parse(socialMedia) : socialMedia)
        : about.socialMedia;
      
      // If a new main image is provided, remove the old one and update
      if (req.files?.mainImage) {
        if (about.mainImage) {
          const oldImagePath = path.join(__dirname, '..', about.mainImage);
          fs.unlink(oldImagePath, (err) => {
            if (err) console.error('Failed to delete old main image:', err);
          });
        }
        about.mainImage = `/uploads/${req.files.mainImage[0].filename}`;
      }
      
      // For nested file fields, update images if new files are provided
      if (req.files?.testimonialImages) {
        req.files.testimonialImages.forEach((file, index) => {
          if (about.testimonials[index]) {
            about.testimonials[index].image = `/uploads/${file.filename}`;
          }
        });
      }
      
      if (req.files?.experienceImages) {
        req.files.experienceImages.forEach((file, index) => {
          if (about.experiences[index]) {
            about.experiences[index].image = `/uploads/${file.filename}`;
          }
        });
      }
      
      if (req.files?.teamImages) {
        req.files.teamImages.forEach((file, index) => {
          if (about.team[index]) {
            about.team[index].image = `/uploads/${file.filename}`;
          }
        });
      }
      
      if (req.files?.milestoneImages) {
        req.files.milestoneImages.forEach((file, index) => {
          if (about.milestones[index]) {
            about.milestones[index].image = `/uploads/${file.filename}`;
          }
        });
      }
      
      about.updatedAt = Date.now();
      
      await about.save();
      res.status(200).json({ message: 'About Us content updated successfully!', about });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to update About Us content.' });
    }
  }
);


/* ------------------------------------------
 ✅ Route: Delete About Us Content
------------------------------------------ */
router.delete('/delete-aboutus/:id', authenticate, async (req, res) => {
  try {
    const about = await About.findById(req.params.id);
    if (!about) {
      return res.status(404).json({ error: 'About Us content not found.' });
    }
    
    // Remove main image if it exists
    if (about.mainImage) {
      const imagePath = path.join(__dirname, '..', about.mainImage);
      fs.unlink(imagePath, (err) => {
        if (err) console.error('Failed to delete main image:', err);
      });
    }
    
    await about.deleteOne();
    res.status(200).json({ message: 'About Us content deleted successfully!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete About Us content.' });
  }
});

/* ------------------------------------------
 ✅ Export Router
------------------------------------------ */
module.exports = router;
