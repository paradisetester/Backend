const axios = require('axios');

const addAdmin = async () => {
  try {
    const response = await axios.post('http://localhost:5000/api/auth/register', {
      name: 'Dhruv Gupta',
      email: 'dhruv@example.com',
      password: 'admin123',
      age: 35,
      salary: 70000,
      position: 'admin',
      department: 'HR',
      role: 'admin'
    });
    console.log('Admin added successfully:', response.data);
  } catch (err) {
    console.error('Error adding admin:', err.response ? err.response.data : err.message);
  }
};

addAdmin();
