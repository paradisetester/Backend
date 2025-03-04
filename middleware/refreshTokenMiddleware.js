// middlewares/refreshTokenMiddleware.js
const { generateToken } = require('../utils/tokenUtils');

const refreshTokenMiddleware = (req, res, next) => {
  // Check if the user is authenticated (authenticate middleware has set req.employeeId)
  if (req.employeeId) {
    // Verify that the request comes from the frontend and is not a dashboard URL
    const origin = req.get('Origin');
    if (origin === 'http://localhost:3000' && !req.originalUrl.includes('/dashboard')) {
      // Generate a new token using details already attached by the authenticate middleware
      const newToken = generateToken({
        _id: req.employeeId,
        role: req.role,
        name: req.name,
      });
      // Attach the new token to the response header
      res.setHeader('New-Token', newToken);
    }
  }
  next();
};

module.exports = refreshTokenMiddleware;
