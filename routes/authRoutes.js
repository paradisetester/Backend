const express = require('express');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const Employee = require('../models/Employee');
const authenticate = require('../middleware/authenticate');
const { generateToken } = require('../utils/tokenUtils');

const router = express.Router();

/** 
 * 📝 Register a new employee 
 */
router.post('/register', [
  body('age').isInt({ min: 18 }).withMessage('Age must be at least 18'),
  body('salary').isFloat({ min: 0 }).withMessage('Salary must be a positive number'),
  body('position').notEmpty().withMessage('Position is required'),
  body('department').notEmpty().withMessage('Department is required'),
  body('email').isEmail().withMessage('Invalid email address'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { name, email, password, role, age, salary, position, department } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log('Hashed Password:', hashedPassword); // Check the generated hash
    const employee = new Employee({
      name,
      email,
      password: hashedPassword,
      role,
      age,
      salary,
      position,
      department,
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

    // console.log('Employee found:', employee);

    const isMatch = bcrypt.compare(password, employee.password);
    console.log('Password Match:', isMatch);

    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const token = generateToken(employee);
    console.log('Generated Token:', token);

    res.json({
      token,
      role: employee.role,
      employee: {
        name: employee.name,
        email: employee.email,
        age: employee.age,
        salary: employee.salary,
        position: employee.position,
        department: employee.department,
      },
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
    // The authenticated employee's ID is available via req.user
    // console.log(req.employeeId);
    const employee = await Employee.findById(req.employeeId, '-password'); // Exclude password field
    // console.log(employee, 'Employee')
    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    res.status(200).json({
      name: employee.name,
      email: employee.email,
      age: employee.age,
      salary: employee.salary,
      position: employee.position,
      department: employee.department,
    });
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
 */
router.put('/update-profile/:employeeId', authenticate, [
  body('name').notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Invalid email address'),
  body('age').optional().isInt({ min: 18 }).withMessage('Age must be at least 18'),
  body('salary').optional().isFloat({ min: 0 }).withMessage('Salary must be a positive number'),
  body('position').notEmpty().withMessage('Position is required'),
  body('department').notEmpty().withMessage('Department is required')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { employeeId } = req.params;
  try {
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
