import jwt from 'jsonwebtoken';
import asyncHandler from 'express-async-handler';
import User from '../models/User.js';


// export const protect = asyncHandler(async (req, res, next) => {
//   console.log('Protect middleware triggered'); // Debug log
  
//   let token = req.cookies.token || req.headers.authorization?.split(' ')[1];
//   console.log('Token found:', !!token); // Debug log
  
//   if (!token) {
//     console.log('No token found'); // Debug log
//     res.status(401);
//     throw new Error('Not authorized, no token');
//   }

//   try {
//     const decoded = jwt.verify(token, process.env.JWT_SECRET);
//     console.log('Decoded token:', decoded); // Debug log
    
//     req.user = await User.findById(decoded.id).select('-password');
    
//     if (!req.user) {
//       console.log('User not found in DB'); // Debug log
//       res.status(401);
//       throw new Error('User not found');
//     }
    
//     console.log('User authenticated:', req.user._id); // Debug log
//     next();
//   } catch (error) {
//     console.log('Token verification failed:', error.message); // Debug log
//     res.status(401);
//     throw new Error('Not authorized, token failed');
//   }
// });

















export const protect = asyncHandler(async (req, res, next) => {
  let token;
  
  // Check Authorization header (for API requests)
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  // Check cookies (for browser requests)
  else if (req.cookies.token) {
    token = req.cookies.token;
  }

  if (!token) {
    console.log('No token found in headers or cookies');
    res.status(401);
    throw new Error('Not authorized, no token');
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Decoded token:', decoded);
    
    // Get user from database
    req.user = await User.findById(decoded.id).select('-password');
    
    if (!req.user) {
      console.log('User not found in database');
      res.status(401);
      throw new Error('User not found');
    }
    
    console.log('Authenticated user:', req.user._id);
    next();
  } catch (error) {
    console.error('Token verification failed:', error.message);
    
    // Specific error messages for different failure cases
    if (error.name === 'TokenExpiredError') {
      res.status(401);
      throw new Error('Session expired, please login again');
    } else if (error.name === 'JsonWebTokenError') {
      res.status(401);
      throw new Error('Invalid token');
    } else {
      res.status(401);
      throw new Error('Not authorized');
    }
  }
});