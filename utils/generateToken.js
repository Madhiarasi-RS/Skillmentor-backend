// utils/generateToken.js
const jwt = require('jsonwebtoken');

const generateToken = (user) => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET not set in environment variables');
  }

  return jwt.sign(
    {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role || 'user'
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRE || '7d'
    }
  );
};

module.exports = generateToken;
