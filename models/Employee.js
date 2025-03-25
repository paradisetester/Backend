const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Employee schema
const employeeSchema = new mongoose.Schema({
  personaldetails: {
    location: { type: String, required: true },
    dob: { type: Date, required: true },
    gender: { type: String, enum: ['male', 'female', 'other'] },
    maritalStatus: { type: String, enum: ['single', 'married', 'divorced', 'widowed'] },
    nationality: { type: String }
  },
  address: {
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    zipCode: { type: String, required: true },
    country: { type: String, required: true }
  },
  contact: {
    primaryPhone: { type: String, required: true },
    secondaryPhone: { type: String }
  },
  emergencyContact: {
    name: { type: String, required: true },
    phone: { type: String, required: true },
    relationship: { type: String, required: true }
  },
  profilepicture: { type: String, required: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, default: 'employee' }, // 'admin' or 'hr'
  age: { type: Number, required: true },
  salary: { type: Number, required: true },
  position: { type: String, required: true },
  department: { type: String, required: true },
  // Optional: identification details for verification purposes
  identification: {
    nationalId: { type: String },
    passportNumber: { type: String }
  },
  // Optional: Social media profiles
  socialProfiles: {
    linkedIn: { type: String },
    twitter: { type: String }
  }
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
