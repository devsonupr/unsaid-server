import User from '../models/User.js';
import Post from '../models/Post.js';
import asyncHandler from 'express-async-handler';


export const createPost = asyncHandler(async (req, res) => {
  if (!req.user || !req.user._id) {
    res.status(401);
    throw new Error('Not authenticated');
  }

  if (!req.body.content) {
    res.status(400);
    throw new Error('Content is required');
  }

  const post = await Post.create({
    content: req.body.content,
    image: req.body.image,
    user: req.user._id // Comes from protect middleware
  });

  res.status(201).json(post);
});

export const getPosts = asyncHandler(async (req, res) => {
  const posts = await Post.find()
    .populate('user', 'name username profileImage') 
    .sort({ createdAt: -1 }); 

  res.json(posts);
});

export const getPost = asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (!post) throw new Error('Post not found');
  res.json(post);
});

export const getPostsByUser = asyncHandler(async (req, res) => {
  const posts = await Post.find({ user: req.params.userId });
  res.json(posts);
});

export const getPostsByUsername = asyncHandler(async (req, res) => {
   try {
    const user = await User.findOne({ username: req.params.username });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    const posts = await Post.find({ user: user._id })
      .sort({ createdAt: -1 })
      .populate('user', 'username profileImage');
    
    res.status(200).json({ success: true, data: posts });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});



export const updatePost = asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (!post) throw new Error('Post not found');
  if (post.user.toString() !== req.user._id.toString()) throw new Error('Unauthorized');
  post.content = req.body.content || post.content;
  await post.save();
  res.json(post);
});

export const deletePost = asyncHandler(async (req, res) => {
  // Check if user is authenticated
  if (!req.user || !req.user._id) {
    res.status(401);
    throw new Error('Not authenticated');
  }

  // Find the post by ID
  const post = await Post.findById(req.params.id);
  
  // Check if post exists
  if (!post) {
    res.status(404);
    throw new Error('Post not found');
  }
  
  // Check if the authenticated user is the owner of the post
  if (post.user.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Unauthorized - You can only delete your own posts');
  }
  
  // Delete the post
  await post.deleteOne();
  
  // Send success response
  res.status(200).json({ 
    success: true,
    message: 'Post deleted successfully' 
  });
});
