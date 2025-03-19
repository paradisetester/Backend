// cloudinaryUpload.js
const cloudinary = require('cloudinary').v2;
require('dotenv').config(); // load env variables

// Cloudinary is configured via CLOUDINARY_URL in your .env file
// Format: cloudinary://<your_api_key>:<your_api_secret>@<your_cloud_name>

const uploadToCloudinary = (fileBuffer, folder) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder },
      (error, result) => {
        if (error) return reject(error);
        resolve(result.secure_url);
      }
    );
    stream.end(fileBuffer);
  });
};

module.exports = { uploadToCloudinary };
