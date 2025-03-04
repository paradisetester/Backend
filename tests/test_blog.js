const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');

// Step 1: Login to get the JWT token
const login = async () => {
  try {
    const response = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'dhruv@example.com',
      password: 'admin123',
    });

    const token = response.data.token;  // Assuming the response contains a 'token' field
    console.log('JWT Token:', token);

    // Step 2: Call addBlog function after successfully logging in
    await addBlog(token);  // Pass the JWT token to the addBlog function

  } catch (err) {
    console.error('Login failed:', err.response ? err.response.data : err.message);
  }
};

// Step 2: Add a Blog using the JWT token
const addBlog = async (token) => {
  try {
    const formData = new FormData();

    // ✅ Append text fields
    formData.append('title', 'My First Blog Post');
    formData.append('content', 'This is the content of my first blog post.');
    formData.append('limit', '2024-12-31'); // Optional: Add a display limit date if needed

    // ✅ Append an image (optional)
    const imagePath = './uploads/image.png'; // Update with your actual image path
    if (fs.existsSync(imagePath)) {
      formData.append('featuredImage', fs.createReadStream(imagePath));
    } else {
      console.warn('⚠️ Image file not found, proceeding without an image.');
    }

    // ✅ Make the POST request to add the blog
    const response = await axios.post('http://localhost:5000/api/blogs/add-blog', formData, {
      headers: {
        ...formData.getHeaders(),
        Authorization: `Bearer ${token}`, // Add the JWT token here
      },
    });

    console.log('✅ Blog added successfully:', response.data);

  } catch (err) {
    console.error('❌ Error adding blog:', err.response ? err.response.data : err.message);
  }
};

// Call the login function to get the token and proceed with adding the blog
login();
