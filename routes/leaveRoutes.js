const express = require('express');
const Leave = require('../models/Leave'); // Import the Leave model
const authenticate = require('../middleware/authenticate');

const router = express.Router();

// Route to fetch all leave requests (Admin only)
router.get('/all-leaves', authenticate, async (req, res) => {
  try {
    // You can add a role check for admins if necessary
    const leaves = await Leave.find().populate('employee', 'name position');
    res.status(200).json(leaves);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch leave requests' });
  }
});

// Route to fetch an authenticated employee's leave history
router.get('/my-leaves', authenticate, async (req, res) => {
  try {
    const myLeaves = await Leave.find({ employee: req.employeeId });
    res.status(200).json(myLeaves);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch your leave history' });
  }
});

// Route to apply for leave
// Apply for leave
router.post('/apply-leave', authenticate, async (req, res) => {
  const { startDate, endDate, reason } = req.body;

  if (!startDate || !endDate || !reason) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  try {
    const newLeave = new Leave({
      employee: req.employeeId, // Captured from the JWT token
      startDate,
      endDate,
      reason,
    });

    await newLeave.save();

    res.status(201).json({ message: 'Leave applied successfully', leave: newLeave });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to apply for leave' });
  }
});
// Route to approve or reject leave (HR/Admin only)
router.put('/update-leave-status/:id', authenticate, async (req, res) => {
  try {
    const { status } = req.body; // 'approved' or 'rejected'
    const leaveId = req.params.id;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status. Use "approved" or "rejected".' });
    }

    // Fetch the leave request
    const leave = await Leave.findById(leaveId).populate('employee');

    if (!leave) {
      return res.status(404).json({ error: 'Leave request not found' });
    }

    // Check if the user is authorized (HR/Admin)
    if (!['admin', 'hr'].includes(req.role)) {
      return res.status(403).json({ error: 'Access denied. Only HR or Admin can approve/reject leaves.' });
    }

    // Update the leave status
    leave.status = status;
    await leave.save();

    res.status(200).json({
      message: `Leave has been ${status} successfully.`,
      leave,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update leave status' });
  }
});


// Route to delete a leave request (Admin or the leave owner)
router.delete('/delete-leave/:id', authenticate, async (req, res) => {
  try {
    const leave = await Leave.findById(req.params.id);

    if (!leave) {
      return res.status(404).json({ error: 'Leave not found' });
    }

    if (leave.employee.toString() !== req.employeeId && req.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to delete this leave' });
    }

    // Use `findByIdAndRemove` to delete the leave
    await Leave.findByIdAndDelete(req.params.id);

    res.status(200).json({ message: 'Leave deleted successfully' });
  } catch (err) {
    console.error('Error deleting leave:', err);
    res.status(500).json({ error: 'Failed to delete leave', details: err.message });
  }
});


module.exports = router;
