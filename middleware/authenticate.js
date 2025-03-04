const jwt = require('jsonwebtoken');

const authenticate = (req, res, next) => {
  const token = req.header('Authorization')?.split(' ')[1]; // Extract token from Authorization header
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized: No token provided' });
  }

  try {
    const decoded = jwt.verify(token, 'your_jwt_secret'); // Verify token
    req.employeeId = decoded.id; // Attach employee ID to the request
    req.role = decoded.role; // Attach user role to the request
    req.name = decoded.name; // Attach user name to the request
    next(); // Proceed to the next middleware or route handler
  } catch (err) {
    console.error('Token verification failed:', err.message);
    res.status(401).json({ error: 'Unauthorized: Invalid or expired token' });
  }
};

module.exports = authenticate;
