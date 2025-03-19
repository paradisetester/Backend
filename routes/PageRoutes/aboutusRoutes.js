const express = require('express');
const multer = require('multer'); // File upload middleware
const path = require('path');
const About = require('../../models/Pages/AboutUs');
const authenticate = require('../../middleware/authenticate');
const { uploadToCloudinary } = require('../../utils/cloudinaryUpload'); // adjust the path as needed

const router = express.Router();

// Use Multer memory storage to work with file buffers
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
      // Upload main image to Cloudinary (e.g., in "EmployeeDashboard/AboutUs/Main")
      let mainImage = null;
      if (req.files?.mainImage) {
        mainImage = await uploadToCloudinary(req.files.mainImage[0].buffer, "Employee Dashboard/AboutUs/Main");
      }

      // Parse JSON fields
      const parsedCoreValues = typeof coreValues === 'string' ? JSON.parse(coreValues) : coreValues;
      const parsedTestimonials = typeof testimonials === 'string' ? JSON.parse(testimonials) : testimonials || [];
      const parsedExperiences = typeof experiences === 'string' ? JSON.parse(experiences) : experiences || [];
      const parsedTeam = typeof team === 'string' ? JSON.parse(team) : team || [];
      const parsedMilestones = typeof milestones === 'string' ? JSON.parse(milestones) : milestones || [];
      const parsedSocialMedia = typeof socialMedia === 'string' ? JSON.parse(socialMedia) : socialMedia || [];

      // For nested images, upload each file to Cloudinary and update the corresponding object
      if (req.files?.testimonialImages) {
        for (let i = 0; i < req.files.testimonialImages.length; i++) {
          if (parsedTestimonials[i]) {
            parsedTestimonials[i].image = await uploadToCloudinary(req.files.testimonialImages[i].buffer, "Employee Dashboard/AboutUs/Testimonial");
          }
        }
      }
      if (req.files?.experienceImages) {
        for (let i = 0; i < req.files.experienceImages.length; i++) {
          if (parsedExperiences[i]) {
            parsedExperiences[i].image = await uploadToCloudinary(req.files.experienceImages[i].buffer, "Employee Dashboard/AboutUs/Experience");
          }
        }
      }
      if (req.files?.teamImages) {
        for (let i = 0; i < req.files.teamImages.length; i++) {
          if (parsedTeam[i]) {
            parsedTeam[i].image = await uploadToCloudinary(req.files.teamImages[i].buffer, "Employee Dashboard/AboutUs/Team");
          }
        }
      }
      if (req.files?.milestoneImages) {
        for (let i = 0; i < req.files.milestoneImages.length; i++) {
          if (parsedMilestones[i]) {
            parsedMilestones[i].image = await uploadToCloudinary(req.files.milestoneImages[i].buffer, "Employee Dashboard/AboutUs/Milestones");
          }
        }
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
      about.coreValues = coreValues ? (typeof coreValues === 'string' ? JSON.parse(coreValues) : coreValues) : about.coreValues;
      about.testimonials = testimonials ? (typeof testimonials === 'string' ? JSON.parse(testimonials) : testimonials) : about.testimonials;
      about.experiences = experiences ? (typeof experiences === 'string' ? JSON.parse(experiences) : experiences) : about.experiences;
      about.team = team ? (typeof team === 'string' ? JSON.parse(team) : team) : about.team;
      about.milestones = milestones ? (typeof milestones === 'string' ? JSON.parse(milestones) : milestones) : about.milestones;
      about.socialMedia = socialMedia ? (typeof socialMedia === 'string' ? JSON.parse(socialMedia) : socialMedia) : about.socialMedia;

      // Update main image if provided
      if (req.files?.mainImage) {
        about.mainImage = await uploadToCloudinary(req.files.mainImage[0].buffer, "Employee Dashboard/AboutUs/Main");
      }

      // Update nested image fields similarly
      if (req.files?.testimonialImages) {
        for (let i = 0; i < req.files.testimonialImages.length; i++) {
          if (about.testimonials[i]) {
            about.testimonials[i].image = await uploadToCloudinary(req.files.testimonialImages[i].buffer, "Employee Dashboard/AboutUs/Testimonial");
          }
        }
      }
      if (req.files?.experienceImages) {
        for (let i = 0; i < req.files.experienceImages.length; i++) {
          if (about.experiences[i]) {
            about.experiences[i].image = await uploadToCloudinary(req.files.experienceImages[i].buffer, "Employee Dashboard/AboutUs/Experience");
          }
        }
      }
      if (req.files?.teamImages) {
        for (let i = 0; i < req.files.teamImages.length; i++) {
          if (about.team[i]) {
            about.team[i].image = await uploadToCloudinary(req.files.teamImages[i].buffer, "Employee Dashboard/AboutUs/Team");
          }
        }
      }
      if (req.files?.milestoneImages) {
        for (let i = 0; i < req.files.milestoneImages.length; i++) {
          if (about.milestones[i]) {
            about.milestones[i].image = await uploadToCloudinary(req.files.milestoneImages[i].buffer, "Employee Dashboard/AboutUs/Milestones");
          }
        }
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
    // Note: Since files are stored in Cloudinary, you may optionally use Cloudinary's destroy method here.
    await about.deleteOne();
    res.status(200).json({ message: 'About Us content deleted successfully!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete About Us content.' });
  }
});

module.exports = router;
