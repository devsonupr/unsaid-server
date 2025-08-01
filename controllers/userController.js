import User from '../models/User.js';
import Post from '../models/Post.js';
import ErrorResponse from '../utils/errorResponse.js';
import asyncHandler from 'express-async-handler';
import cloudinary from '../config/cloudinary.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET 
});


export const getUsers = async (req, res, next) => {
  try {
    const users = await User.find().select('-password');
    res.status(200).json({
      success: true,
      count: users.length,
      data: users,
    });
  } catch (err) {
    next(err);
  }
};


export const getUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-password');

    if (!user) {
      return next(new ErrorResponse(`User not found with id of ${req.params.id}`, 404));
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (err) {
    next(err);
  }
};

// export const getUserByUsername = async (req, res, next) => {
//   try {
//     const user = await User.findOne({ username: req.params.username }).select('-password');

//     if (!user) {
//       return next(new ErrorResponse(`User not found with username of ${req.params.username}`, 404));
//     }

//     res.status(200).json({
//       success: true,
//       data: user,
//     });
//   } catch (err) {
//     next(err);
//   }
// };



export const getUserByUsername = async (req, res, next) => {
  try {
    // 1. Find the user by username
    const user = await User.findOne({ username: req.params.username })
      .select('-password');

    if (!user) {
      return next(new ErrorResponse(`User not found with username of ${req.params.username}`, 404));
    }

    // 2. Find all posts by this user
    const posts = await Post.find({ user: user._id })
      .select('content image likesCount createdAt')
      .sort({ createdAt: -1 })
      .lean(); // Convert to plain JavaScript object

    res.status(200).json({
      success: true,
      data: {
        ...user.toObject(), // Convert user document to plain object
        posts: posts // Include the fetched posts
      }
    });
  } catch (err) {
    next(err);
  }
};

// controllers/userController.js
export const getUsersByIds = async (req, res, next) => {
  try {
    const { userIds } = req.body;
    
    if (!userIds || !Array.isArray(userIds)) {
      return next(new ErrorResponse('Please provide an array of user IDs', 400));
    }

    const users = await User.find({ _id: { $in: userIds } }).select('-password');
    
    res.status(200).json({
      success: true,
      data: users
    });
  } catch (err) {
    next(err);
  }
};


export const updateUser = async (req, res, next) => {
  try {
    let user = await User.findById(req.params.id);

    if (!user) {
      return next(new ErrorResponse(`User not found with id of ${req.params.id}`, 404));
    }

    if (user._id.toString() !== req.user.id && req.user.role !== 'admin') {
      return next(new ErrorResponse(`User ${req.params.id} is not authorized to update this user`, 401));
    }

    user = await User.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).select('-password');

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (err) {
    next(err);
  }
};

export const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return next(new ErrorResponse(`User not found with id of ${req.params.id}`, 404));
    }

    if (user._id.toString() !== req.user.id && req.user.role !== 'admin') {
      return next(new ErrorResponse(`User ${req.params.id} is not authorized to delete this user`, 401));
    }

    await Post.deleteMany({ user: user._id });

    // Optional: Add these imports if needed
    // import Comment from '../models/Comment.js';
    // import Like from '../models/Like.js';
    // await Comment.deleteMany({ user: user._id });
    // await Like.deleteMany({ user: user._id });

    await user.remove();

    res.status(200).json({
      success: true,
      data: {},
    });
  } catch (err) {
    next(err);
  }
};


export const followUser = asyncHandler(async (req, res) => {
  const currentUserId = req.user._id;
  const targetUserId = req.params.id;

  if (currentUserId.toString() === targetUserId.toString()) {
    res.status(400);
    throw new Error("You can't follow yourself.");
  }

  const currentUser = await User.findById(currentUserId);
  const targetUser = await User.findById(targetUserId);

  if (!currentUser || !targetUser) {
    res.status(404);
    throw new Error("User not found");
  }

  // Check if already following
  const isAlreadyFollowing = currentUser.following.includes(targetUserId);
  if (isAlreadyFollowing) {
    return res.status(400).json({ message: "Already following this user" });
  }

  // Update current user's following list
  currentUser.following.push(targetUserId);
  // Update target user's followers list
  targetUser.followers.push(currentUserId);

  await currentUser.save();
  await targetUser.save();

  res.status(200).json({ 
    message: "Followed successfully",
    updatedCurrentUser: {
      following: currentUser.following
    },
    updatedTargetUser: {
      followers: targetUser.followers
    }
  });
});


export const unfollowUser = asyncHandler(async (req, res) => {
  const currentUserId = req.user._id;
  const targetUserId = req.params.id;

  if (currentUserId.toString() === targetUserId.toString()) {
    res.status(400);
    throw new Error("You can't unfollow yourself.");
  }

  const currentUser = await User.findById(currentUserId);
  const targetUser = await User.findById(targetUserId);

  if (!currentUser || !targetUser) {
    res.status(404);
    throw new Error("User not found");
  }

  // Check if not following
  const isFollowing = currentUser.following.includes(targetUserId);
  if (!isFollowing) {
    return res.status(400).json({ message: "Not following this user" });
  }

  // Remove from current user's following list
  currentUser.following = currentUser.following.filter(
    id => id.toString() !== targetUserId.toString()
  );

  // Remove from target user's followers list
  targetUser.followers = targetUser.followers.filter(
    id => id.toString() !== currentUserId.toString()
  );

  await currentUser.save();
  await targetUser.save();

  res.status(200).json({ 
    message: "Unfollowed successfully",
    updatedCurrentUser: {
      following: currentUser.following
    },
    updatedTargetUser: {
      followers: targetUser.followers
    }
  });
});


export const savePost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.postId);
    const user = await User.findById(req.user.id);

    if (!post) {
      return next(new ErrorResponse(`Post not found with id of ${req.params.postId}`, 404));
    }

    if (user.savedPosts.some(savedPost => savedPost.toString() === post._id.toString())) {
      return next(new ErrorResponse('Post already saved', 400));
    }

    user.savedPosts.unshift(post._id);
    await user.save();

    res.status(200).json({
      success: true,
      data: user.savedPosts,
    });
  } catch (err) {
    next(err);
  }
};


export const unsavePost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.postId);
    const user = await User.findById(req.user.id);

    if (!post) {
      return next(new ErrorResponse(`Post not found with id of ${req.params.postId}`, 404));
    }

    if (!user.savedPosts.some(savedPost => savedPost.toString() === post._id.toString())) {
      return next(new ErrorResponse('Post not saved', 400));
    }

    user.savedPosts = user.savedPosts.filter(
      savedPost => savedPost.toString() !== post._id.toString()
    );

    await user.save();

    res.status(200).json({
      success: true,
      data: user.savedPosts,
    });
  } catch (err) {
    next(err);
  }
};



export const updateProfile = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { name, bio, location, username } = req.body;
  
  // Authorization check
  if (userId !== req.user._id.toString()) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to update this profile'
    });
  }

  try {
    let profileImageUrl = req.user.profileImage;
    let publicIdToDelete = null;

    // Handle file upload if new image was provided
    if (req.file) {
      console.log('Uploading file to Cloudinary:', req.file.path);
      
      try {
        // Upload to Cloudinary
        const result = await cloudinary.uploader.upload(req.file.path, {
          folder: 'user_profiles',
          width: 500,
          height: 500,
          crop: 'fill',
          quality: 'auto',
          fetch_format: 'auto'
        });

        console.log('Cloudinary upload result:', {
          url: result.secure_url,
          public_id: result.public_id
        });

        profileImageUrl = result.secure_url;
        
        // Mark old image for deletion if it exists and isn't default
        if (req.user.profileImage && !req.user.profileImage.includes('default.jpg')) {
          const urlParts = req.user.profileImage.split('/');
          const filename = urlParts[urlParts.length - 1];
          publicIdToDelete = `user_profiles/${filename.split('.')[0]}`;
          console.log('Old image marked for deletion:', publicIdToDelete);
        }
      } catch (uploadError) {
        console.error('Cloudinary upload failed:', uploadError);
        throw new Error('Failed to upload profile image to Cloudinary');
      }
    }

    // Update user data
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        name: name || req.user.name,
        username: username || req.user.username,
        bio: bio || req.user.bio,
        location: location || req.user.location,
        profileImage: profileImageUrl
      },
      { 
        new: true,
        runValidators: true 
      }
    ).select('-password');

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Delete old image from Cloudinary if needed
    if (publicIdToDelete) {
      try {
        await cloudinary.uploader.destroy(publicIdToDelete);
        console.log('Successfully deleted old image:', publicIdToDelete);
      } catch (deleteError) {
        console.error('Failed to delete old image:', deleteError);
        // Not critical - we can continue
      }
    }

    return res.status(200).json({
      success: true,
      data: updatedUser
    });

  } catch (error) {
    console.error('Profile update error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Profile update failed'
    });
  } finally {
    // Clean up uploaded file if it exists
    if (req.file && req.file.path) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (cleanupError) {
        console.error('Failed to cleanup temp file:', cleanupError);
      }
    }
  }
});



export const deleteUserAccount = asyncHandler(async (req, res) => {
  const { identifier } = req.params;
  
  // Find user by ID or username
  const user = await User.findOne({
    $or: [
      { _id: identifier },
      { username: identifier }
    ]
  });

  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  // Verify the requesting user owns this account
  if (user._id.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error("Not authorized to delete this account");
  }

  // Delete profile image from Cloudinary if not default
  if (user.profileImage && !user.profileImage.includes('default.jpg')) {
    const publicId = user.profileImage.split('/').pop().split('.')[0];
    await cloudinary.uploader.destroy(`user_profiles/${publicId}`);
  }

  // Delete all user posts and their associated likes and comments
  const userPosts = await Post.find({ user: user._id });
  
  // Delete all likes on these posts
  await Like.deleteMany({ 
    post: { $in: userPosts.map(post => post._id) } 
  });

  // Delete all comments on these posts
  await Comment.deleteMany({ 
    post: { $in: userPosts.map(post => post._id) } 
  });

  // Delete the posts themselves
  await Post.deleteMany({ user: user._id });

  // Delete all likes by this user on other posts
  await Like.deleteMany({ user: user._id });

  // Delete all comments by this user on other posts
  await Comment.deleteMany({ user: user._id });

  // Remove user from followers/following lists of other users
  await User.updateMany(
    { $or: [{ followers: user._id }, { following: user._id }] },
    { $pull: { followers: user._id, following: user._id } }
  );

  // Finally, delete the user
  await User.findByIdAndDelete(user._id);

  // Clear the JWT cookie if using cookie-based auth
  res.cookie("token", "none", {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });

  res.status(200).json({ 
    success: true, 
    message: "User account and all related data deleted successfully" 
  });
});