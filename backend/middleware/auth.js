const jwt = require('jsonwebtoken');

const auth = (req, res, next) => {
  const authHeader = req.header('Authorization');
  if (!authHeader) return res.status(401).json({ error: 'Access Denied. No token provided.' });

  const token = authHeader.replace('Bearer ', '');
  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret_key');
    req.user = verified; // contains user id
    next();
  } catch (err) {
    res.status(400).json({ error: 'Invalid Token' });
  }
};

module.exports = auth;