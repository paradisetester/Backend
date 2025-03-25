const express = require('express');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const multer = require('multer');
const path = require('path');
const { uploadToCloudinary } = require('../utils/cloudinaryUpload');
const Employee = require('../models/Employee');
const authenticate = require('../middleware/authenticate');
const { generateToken } = require('../utils/tokenUtils');

const router = express.Router();

// Configure multer for in-memory storage and file filtering
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
  }
});

/** 
 * 📝 Register a new employee 
 * - Validates all required fields including nested objects.
 * - Expects the nested fields (personaldetails, address, contact, emergencyContact,
 *   identification, socialProfiles) to be sent as JSON strings.
 * - Uploads the profile picture to Cloudinary.
 */
router.post('/register', upload.single('profilepicture'), [
  body('name').notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Invalid email address'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('age').isInt({ min: 18 }).withMessage('Age must be at least 18'),
  body('salary').isFloat({ min: 0 }).withMessage('Salary must be a positive number'),
  body('position').notEmpty().withMessage('Position is required'),
  body('department').notEmpty().withMessage('Department is required'),
  // For personaldetails as an object (not an array)
  body('personaldetails').notEmpty().withMessage('Personal details are required'),
  body('personaldetails.location').notEmpty().withMessage('Location is required in personal details'),
  body('personaldetails.dob').notEmpty().withMessage('DOB is required in personal details'),
  body('address.street').notEmpty().withMessage('Street is required'),
  body('address.city').notEmpty().withMessage('City is required'),
  body('address.state').notEmpty().withMessage('State is required'),
  body('address.zipCode').notEmpty().withMessage('Zip Code is required'),
  body('address.country').notEmpty().withMessage('Country is required'),
  body('contact.primaryPhone').notEmpty().withMessage('Primary phone is required'),
  body('emergencyContact.name').notEmpty().withMessage('Emergency contact name is required'),
  body('emergencyContact.phone').notEmpty().withMessage('Emergency contact phone is required'),
  body('emergencyContact.relationship').notEmpty().withMessage('Emergency contact relationship is required')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  const { 
    name, email, password, role, age, salary, position, department,
    personaldetails, address, contact, emergencyContact, identification, socialProfiles
  } = req.body;

  try {
    // Ensure a profile picture file is provided
    if (!req.file) {
      return res.status(400).json({ error: 'Profile picture is required.' });
    }

    // Upload the profile picture to Cloudinary
    const profilepictureUrl = await uploadToCloudinary(req.file.buffer, "Employee Dashboard/Employee Profile Picutres");

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Parse nested fields if provided as JSON strings
    const pd = typeof personaldetails === 'string' ? JSON.parse(personaldetails) : personaldetails;
    const addrObj = typeof address === 'string' ? JSON.parse(address) : address;
    const contactObj = typeof contact === 'string' ? JSON.parse(contact) : contact;
    const emergencyContactObj = typeof emergencyContact === 'string' ? JSON.parse(emergencyContact) : emergencyContact;
    const identificationObj = identification ? (typeof identification === 'string' ? JSON.parse(identification) : identification) : {};
    const socialProfilesObj = socialProfiles ? (typeof socialProfiles === 'string' ? JSON.parse(socialProfiles) : socialProfiles) : {};

    const employee = new Employee({
      name,
      email,
      password: hashedPassword,
      role,
      age,
      salary,
      position,
      department,
      personaldetails: pd, // now a plain object
      address: addrObj,
      contact: contactObj,
      emergencyContact: emergencyContactObj,
      identification: identificationObj,
      socialProfiles: socialProfilesObj,
      profilepicture: profilepictureUrl
    });
    await employee.save();

    const token = generateToken(employee);
    res.status(201).json({ message: 'Employee registered successfully', token });
  } catch (err) {
    console.error('Registration Error:', err.message);
    res.status(500).json({ error: 'Server error during registration' });
  }
});

/** 
 * 📝 Login for employee 
 */
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const employee = await Employee.findOne({ email });
    if (!employee) {
      console.log('Employee not found for email:', email);
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, employee.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const token = generateToken(employee);
    res.json({
      token,
      // Include _id at the top level along with other fields:
      id: employee._id,
      name: employee.name,
      role: employee.role,
      // Also include the full employee object if needed:
      employee: {
        name: employee.name,
        email: employee.email,
        age: employee.age,
        salary: employee.salary,
        position: employee.position,
        department: employee.department,
        profilepicture: employee.profilepicture,
        personaldetails: employee.personaldetails,
        address: employee.address,
        contact: employee.contact,
        emergencyContact: employee.emergencyContact,
        identification: employee.identification,
        socialProfiles: employee.socialProfiles,
        role: employee.role
      }
    });
  } catch (err) {
    console.error('Login Error:', err.message);
    res.status(500).json({ error: 'Server error during login' });
  }
});

/** 
 * 📝 Fetch all employees 
 */
router.get('/employees', authenticate, async (req, res) => {
  try {
    const employees = await Employee.find({}, '-password');
    res.status(200).json(employees);
  } catch (err) {
    console.error('Fetch Employees Error:', err.message);
    res.status(500).json({ error: 'Failed to fetch employees' });
  }
});

/** 
 * 📝 Get profile of the currently logged-in employee 
 */
router.get('/get-profile', authenticate, async (req, res) => {
  try {
    const employee = await Employee.findById(req.employeeId, '-password');
    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }
    res.status(200).json(employee);
  } catch (err) {
    console.error('Get Profile Error:', err.message);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

/** 
 * 📝 Delete an employee by ID 
 */
router.delete('/delete-employee/:id', authenticate, async (req, res) => {
  const { id } = req.params;
  try {
    const employee = await Employee.findByIdAndDelete(id);
    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }
    res.status(200).json({ message: 'Employee deleted successfully' });
  } catch (err) {
    console.error('Delete Employee Error:', err.message);
    res.status(500).json({ error: 'Failed to delete employee' });
  }
});

/** 
 * 📝 Update employee profile (Admin or User)
 * - Supports updating both simple and nested fields.
 * - Optionally updates the profile picture if a new file is provided.
 */
router.put('/update-profile/:employeeId', upload.single('profilepicture'), [
  body('name').optional().notEmpty().withMessage('Name cannot be empty'),
  body('email').optional().isEmail().withMessage('Invalid email address'),
  body('age').optional().isInt({ min: 18 }).withMessage('Age must be at least 18'),
  body('salary').optional().isFloat({ min: 0 }).withMessage('Salary must be a positive number'),
  body('position').optional().notEmpty().withMessage('Position is required'),
  body('department').optional().notEmpty().withMessage('Department is required'),
  // For personaldetails as an object
  body('personaldetails').optional().notEmpty().withMessage('Personal details cannot be empty'),
  body('personaldetails.location').optional().notEmpty().withMessage('Location is required in personal details'),
  body('personaldetails.dob').optional().notEmpty().withMessage('DOB is required in personal details'),
  body('address.street').optional().notEmpty().withMessage('Street is required'),
  body('address.city').optional().notEmpty().withMessage('City is required'),
  body('address.state').optional().notEmpty().withMessage('State is required'),
  body('address.zipCode').optional().notEmpty().withMessage('Zip Code is required'),
  body('address.country').optional().notEmpty().withMessage('Country is required'),
  body('contact.primaryPhone').optional().notEmpty().withMessage('Primary phone is required'),
  body('emergencyContact.name').optional().notEmpty().withMessage('Emergency contact name is required'),
  body('emergencyContact.phone').optional().notEmpty().withMessage('Emergency contact phone is required'),
  body('emergencyContact.relationship').optional().notEmpty().withMessage('Emergency contact relationship is required')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { employeeId } = req.params;
  try {
    let profilepicture=null;
    // Upload a new profile picture if provided.
    if (req.file) {

      profilepicture = await uploadToCloudinary(req.file.buffer, "Employee Dashboard/Employee Profile Picutres");
      // req.body.profilepicture = profilepictureUrl;
    }

    // Parse nested fields if provided as JSON strings.
    if (req.body.personaldetails) {
      req.body.personaldetails = typeof req.body.personaldetails === 'string'
        ? JSON.parse(req.body.personaldetails)
        : req.body.personaldetails;
    }
    if (req.body.address) req.body.address = typeof req.body.address === 'string' ? JSON.parse(req.body.address) : req.body.address;
    if (req.body.contact) req.body.contact = typeof req.body.contact === 'string' ? JSON.parse(req.body.contact) : req.body.contact;
    if (req.body.emergencyContact) req.body.emergencyContact = typeof req.body.emergencyContact === 'string' ? JSON.parse(req.body.emergencyContact) : req.body.emergencyContact;
    if (req.body.identification) req.body.identification = typeof req.body.identification === 'string' ? JSON.parse(req.body.identification) : req.body.identification;
    if (req.body.socialProfiles) req.body.socialProfiles = typeof req.body.socialProfiles === 'string' ? JSON.parse(req.body.socialProfiles) : req.body.socialProfiles;
    
    const updatedEmployee = await Employee.findByIdAndUpdate(employeeId, req.body, { new: true });
    if (!updatedEmployee) {
      return res.status(404).json({ error: 'Employee not found' });
    }
    res.status(200).json({
      message: 'Profile updated successfully',
      employee: updatedEmployee,
    });
  } catch (err) {
    console.error('Update Profile Error:', err.message);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

module.exports = router;
