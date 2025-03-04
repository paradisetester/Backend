const jwt = require('jsonwebtoken');

const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role, name:user.name }, // Payload
    'your_jwt_secret', // Secret key
    { expiresIn: '2h' } // Expiration
  );
};

module.exports = { generateToken };
