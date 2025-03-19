const express = require('express');
const multer = require('multer');
const path = require('path');
const HomePage = require('../../models/Pages/Home'); // Adjust the path as needed
const authenticate = require('../../middleware/authenticate');
const { uploadToCloudinary } = require('../../utils/cloudinaryUpload');

const router = express.Router();

// Use memory storage
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
 ✅ Route: Add a New Home Page Content
------------------------------------------ */
router.post(
  '/add-home',
  authenticate,
  upload.fields([
    { name: 'heroBackground', maxCount: 1 },
    { name: 'aboutImage', maxCount: 1 },
    { name: 'portfolioImages' },
  ]),
  async (req, res) => {
    const {
      heroHeading,
      heroTagline,
      heroButtonText,
      heroButtonLink,
      aboutTitle,
      aboutDescription,
      aboutReadMoreLink,
      services,
      portfolio,
      contactHeading,
      contactSubText,
      contactButtonText,
      contactButtonLink,
    } = req.body;

    try {
      // Upload hero background image to Cloudinary (e.g., "EmployeeDashboard/Home/Hero")
      const heroBackground = req.files?.heroBackground
        ? await uploadToCloudinary(req.files.heroBackground[0].buffer, "EmployeeDashboard/Home/Hero")
        : null;
      
      // Upload about section image to Cloudinary (e.g., "EmployeeDashboard/Home/About")
      const aboutImage = req.files?.aboutImage
        ? await uploadToCloudinary(req.files.aboutImage[0].buffer, "EmployeeDashboard/Home/About")
        : null;
      
      // Process portfolio images and parse portfolio data
      let parsedPortfolio = typeof portfolio === 'string' ? JSON.parse(portfolio) : portfolio || [];
      if (req.files?.portfolioImages) {
        for (let i = 0; i < req.files.portfolioImages.length; i++) {
          if (parsedPortfolio[i]) {
            parsedPortfolio[i].image = await uploadToCloudinary(req.files.portfolioImages[i].buffer, "EmployeeDashboard/Home/Portfolio");
          }
        }
      }
      
      // Parse services if sent as string
      const parsedServices = typeof services === 'string' ? JSON.parse(services) : services || [];

      const newHome = new HomePage({
        hero: {
          backgroundImage: heroBackground,
          heading: heroHeading,
          tagline: heroTagline,
          buttonText: heroButtonText,
          buttonLink: heroButtonLink,
        },
        about: {
          image: aboutImage,
          title: aboutTitle,
          description: aboutDescription,
          readMoreLink: aboutReadMoreLink,
        },
        services: parsedServices,
        portfolio: parsedPortfolio,
        contactCTA: {
          heading: contactHeading,
          subText: contactSubText,
          buttonText: contactButtonText,
          buttonLink: contactButtonLink,
        },
      });

      await newHome.save();
      res.status(201).json({ message: 'Home Page content added successfully!', home: newHome });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to add Home Page content.' });
    }
  }
);

/* ------------------------------------------
 ✅ Route: Fetch Home Page Content
------------------------------------------ */
router.get('/get-home', async (req, res) => {
  try {
    const home = await HomePage.findOne();
    if (!home) {
      return res.status(404).json({ error: 'Home Page content not found.' });
    }
    res.status(200).json(home);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch Home Page content.' });
  }
});

/* ------------------------------------------
 ✅ Route: Get Single Home Page by ID
------------------------------------------ */
router.get('/get-home/:id', async (req, res) => {
  const { id } = req.params;
  if (!id.match(/^[0-9a-fA-F]{24}$/)) {
    return res.status(400).json({ error: 'Invalid Home Page ID format.' });
  }
  try {
    const home = await HomePage.findById(id);
    if (!home) {
      return res.status(404).json({ error: 'Home Page content not found.' });
    }
    res.status(200).json(home);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch Home Page content.' });
  }
});

/* ------------------------------------------
 ✅ Route: Update Home Page Content
------------------------------------------ */
router.put(
  '/update-home/:id',
  upload.fields([
    { name: 'heroBackground', maxCount: 1 },
    { name: 'aboutImage', maxCount: 1 },
    { name: 'portfolioImages' },
  ]),
  async (req, res) => {
    const {
      heroHeading,
      heroTagline,
      heroButtonText,
      heroButtonLink,
      aboutTitle,
      aboutDescription,
      aboutReadMoreLink,
      services,
      portfolio,
      contactHeading,
      contactSubText,
      contactButtonText,
      contactButtonLink,
    } = req.body;
    try {
      const home = await HomePage.findById(req.params.id);
      if (!home) {
        return res.status(404).json({ error: 'Home Page content not found.' });
      }

      // Update hero section
      home.hero.heading = heroHeading || home.hero.heading;
      home.hero.tagline = heroTagline || home.hero.tagline;
      home.hero.buttonText = heroButtonText || home.hero.buttonText;
      home.hero.buttonLink = heroButtonLink || home.hero.buttonLink;
      if (req.files?.heroBackground) {
        home.hero.backgroundImage = await uploadToCloudinary(req.files.heroBackground[0].buffer, "EmployeeDashboard/Home/Hero");
      }

      // Update about section
      home.about.title = aboutTitle || home.about.title;
      home.about.description = aboutDescription || home.about.description;
      home.about.readMoreLink = aboutReadMoreLink || home.about.readMoreLink;
      if (req.files?.aboutImage) {
        home.about.image = await uploadToCloudinary(req.files.aboutImage[0].buffer, "EmployeeDashboard/Home/About");
      }

      // Update services
      if (services) {
        home.services = typeof services === 'string' ? JSON.parse(services) : services;
      }

      // Update portfolio
      if (portfolio) {
        home.portfolio = typeof portfolio === 'string' ? JSON.parse(portfolio) : portfolio;
      }
      if (req.files?.portfolioImages) {
        for (let i = 0; i < req.files.portfolioImages.length; i++) {
          if (home.portfolio[i]) {
            home.portfolio[i].image = await uploadToCloudinary(req.files.portfolioImages[i].buffer, "EmployeeDashboard/Home/Portfolio");
          }
        }
      }

      // Update contact CTA section
      home.contactCTA.heading = contactHeading || home.contactCTA.heading;
      home.contactCTA.subText = contactSubText || home.contactCTA.subText;
      home.contactCTA.buttonText = contactButtonText || home.contactCTA.buttonText;
      home.contactCTA.buttonLink = contactButtonLink || home.contactCTA.buttonLink;

      home.updatedAt = Date.now();
      await home.save();
      res.status(200).json({ message: 'Home Page content updated successfully!', home });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to update Home Page content.' });
    }
  }
);

/* ------------------------------------------
 ✅ Route: Delete Home Page Content
------------------------------------------ */
router.delete('/delete-home/:id', authenticate, async (req, res) => {
  try {
    const home = await HomePage.findById(req.params.id);
    if (!home) {
      return res.status(404).json({ error: 'Home Page content not found.' });
    }
    // Optionally, if you wish to remove Cloudinary assets, use Cloudinary's destroy API.
    await home.deleteOne();
    res.status(200).json({ message: 'Home Page content deleted successfully!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete Home Page content.' });
  }
});

module.exports = router;
