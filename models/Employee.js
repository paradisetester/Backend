const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Employee schema
const employeeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, default: 'employee' }, // 'admin' or 'hr'
  age: { type: Number, required: true }, // Add age field
  salary: { type: Number, required: true }, // Add salary field
  position: { type: String, required: true }, // Add position field
  department: { type: String, required: true }, // Add department field
});

// Hash password before saving
employeeSchema.pre('save', async function(next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

// Password comparison method
employeeSchema.methods.comparePassword = function(password) {
  return bcrypt.compare(password, this.password);
};

const Employee = mongoose.model('Employee', employeeSchema);

module.exports = Employee;
