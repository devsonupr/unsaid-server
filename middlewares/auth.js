import jwt from 'jsonwebtoken';
import asyncHandler from 'express-async-handler';
import User from '../models/User.js';


export const protect = asyncHandler(async (req, res, next) => {
  console.log('Protect middleware triggered'); // Debug log
  
  let token = req.cookies.token || req.headers.authorization?.split(' ')[1];
  console.log('Token found:', !!token); // Debug log
  
  if (!token) {
    console.log('No token found'); // Debug log
    res.status(401);
    throw new Error('Not authorized, no token');
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Decoded token:', decoded); // Debug log
    
    req.user = await User.findById(decoded.id).select('-password');
    
    if (!req.user) {
      console.log('User not found in DB'); // Debug log
      res.status(401);
      throw new Error('User not found');
    }
    
    console.log('User authenticated:', req.user._id); // Debug log
    next();
  } catch (error) {
    console.log('Token verification failed:', error.message); // Debug log
    res.status(401);
    throw new Error('Not authorized, token failed');
  }
});