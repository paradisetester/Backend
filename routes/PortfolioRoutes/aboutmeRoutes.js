// routes/Pages/aboutMe.js
const express  = require('express');
const multer   = require('multer');
const path     = require('path');
const AboutMe  = require('../../models/Pages/AboutMe');
const authenticate = require('../../middleware/authenticate');
const { uploadToCloudinary } = require('../../utils/cloudinaryUpload');

const router = express.Router();

// Multer: memory storage + file filtering for images
const storage = multer.memoryStorage();
const upload  = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif/;
    const extname = allowed.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowed.test(file.mimetype);
    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error('Only images (jpeg, jpg, png, gif) are allowed.'));
    }
  }
});

/**
 * @route   POST /api/aboutme/add
 * @desc    Create new About Me entry
 * @access  Protected
 */
router.post(
  '/add',
  authenticate,
  upload.fields([
    { name: 'mainImage', maxCount: 1 },
    { name: 'testimonialImages' },
    { name: 'experienceImages' }
  ]),
  async (req, res) => {
    try {
      const {
        name,
        description,
        coreValues,
        testimonials,
        experiences,
        socialMedia
      } = req.body;

      // Validation
      if (!name || !description) {
        return res.status(400).json({ error: 'Name and description are required.' });
      }

      // Upload mainImage if provided
      let mainImageUrl = null;
      if (req.files?.mainImage) {
        mainImageUrl = await uploadToCloudinary(
          req.files.mainImage[0].buffer,
          'Portfolio/AboutMe/Main'
        );
      }

      // Parse JSON arrays if sent as strings
      const parsedCoreValues = typeof coreValues === 'string'
        ? JSON.parse(coreValues)
        : coreValues || [];

      const parsedTestimonials = typeof testimonials === 'string'
        ? JSON.parse(testimonials)
        : testimonials || [];

      const parsedExperiences = typeof experiences === 'string'
        ? JSON.parse(experiences)
        : experiences || [];

      const parsedSocialMedia = typeof socialMedia === 'string'
        ? JSON.parse(socialMedia)
        : socialMedia || [];

      // Upload testimonial images
      if (req.files?.testimonialImages) {
        for (let i = 0; i < req.files.testimonialImages.length; i++) {
          if (parsedTestimonials[i]) {
            parsedTestimonials[i].image = await uploadToCloudinary(
              req.files.testimonialImages[i].buffer,
              'Portfolio/AboutMe/Testimonial'
            );
          }
        }
      }

      // Upload experience images
      if (req.files?.experienceImages) {
        for (let i = 0; i < req.files.experienceImages.length; i++) {
          if (parsedExperiences[i]) {
            parsedExperiences[i].image = await uploadToCloudinary(
              req.files.experienceImages[i].buffer,
              'Portfolio/AboutMe/Experience'
            );
          }
        }
      }

      // Build and save
      const aboutMe = new AboutMe({
        name,
        description,
        coreValues: parsedCoreValues,
        testimonials: parsedTestimonials,
        experiences: parsedExperiences,
        socialMedia: parsedSocialMedia,
        mainImage: mainImageUrl
      });

      await aboutMe.save();
      res.status(201).json({ message: 'About Me created successfully.', aboutMe });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Server error – could not create About Me.' });
    }
  }
);

/**
 * @route   GET /api/aboutme/
 * @desc    Fetch the first About Me entry
 * @access  Public
 */
router.get('/', async (req, res) => {
  try {
    const aboutMe = await AboutMe.findOne();
    if (!aboutMe) {
      return res.status(404).json({ error: 'No About Me content found.' });
    }
    res.json(aboutMe);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error – could not fetch About Me.' });
  }
});

/**
 * @route   GET /api/aboutme/:id
 * @desc    Fetch a single About Me by ID
 * @access  Public
 */
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  if (!id.match(/^[0-9a-fA-F]{24}$/)) {
    return res.status(400).json({ error: 'Invalid ID format.' });
  }
  try {
    const aboutMe = await AboutMe.findById(id);
    if (!aboutMe) {
      return res.status(404).json({ error: 'About Me not found.' });
    }
    res.json(aboutMe);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error – could not fetch About Me.' });
  }
});

/**
 * @route   PUT /api/aboutme/:id
 * @desc    Update About Me entry
 * @access  Protected
 */
router.put(
  '/:id',
  authenticate,
  upload.fields([
    { name: 'mainImage', maxCount: 1 },
    { name: 'testimonialImages' },
    { name: 'experienceImages' }
  ]),
  async (req, res) => {
    try {
      const aboutMe = await AboutMe.findById(req.params.id);
      if (!aboutMe) {
        return res.status(404).json({ error: 'About Me not found.' });
      }

      // Destructure and parse
      const {
        name,
        description,
        coreValues,
        testimonials,
        experiences,
        socialMedia
      } = req.body;

      if (name)        aboutMe.name = name;
      if (description) aboutMe.description = description;

      if (coreValues)  {
        aboutMe.coreValues = typeof coreValues === 'string'
          ? JSON.parse(coreValues)
          : coreValues;
      }

      if (testimonials) {
        aboutMe.testimonials = typeof testimonials === 'string'
          ? JSON.parse(testimonials)
          : testimonials;
      }

      if (experiences) {
        aboutMe.experiences = typeof experiences === 'string'
          ? JSON.parse(experiences)
          : experiences;
      }

      if (socialMedia) {
        aboutMe.socialMedia = typeof socialMedia === 'string'
          ? JSON.parse(socialMedia)
          : socialMedia;
      }

      // Replace main image if new one provided
      if (req.files?.mainImage) {
        aboutMe.mainImage = await uploadToCloudinary(
          req.files.mainImage[0].buffer,
          'Employee Dashboard/Portfolio/AboutMe/Main'
        );
      }

      // Update nested testimonial images
      if (req.files?.testimonialImages) {
        for (let i = 0; i < req.files.testimonialImages.length; i++) {
          if (aboutMe.testimonials[i]) {
            aboutMe.testimonials[i].image = await uploadToCloudinary(
              req.files.testimonialImages[i].buffer,
              'Employee Dashboard/Portfolio/AboutMe/Testimonial'
            );
          }
        }
      }

      // Update nested experience images
      if (req.files?.experienceImages) {
        for (let i = 0; i < req.files.experienceImages.length; i++) {
          if (aboutMe.experiences[i]) {
            aboutMe.experiences[i].image = await uploadToCloudinary(
              req.files.experienceImages[i].buffer,
              'Employee Dashboard/Portfolio/AboutMe/Experience'
            );
          }
        }
      }

      // Save
      await aboutMe.save();
      res.json({ message: 'About Me updated successfully.', aboutMe });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Server error – could not update About Me.' });
    }
  }
);

/**
 * @route   DELETE /api/aboutme/:id
 * @desc    Delete About Me entry
 * @access  Protected
 */
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const aboutMe = await AboutMe.findById(req.params.id);
    if (!aboutMe) {
      return res.status(404).json({ error: 'About Me not found.' });
    }
    await aboutMe.deleteOne();
    res.json({ message: 'About Me deleted successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error – could not delete About Me.' });
  }
});

module.exports = router;
