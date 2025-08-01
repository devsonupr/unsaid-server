import User from "../models/User.js";
import asyncHandler from "express-async-handler";
import jwt from "jsonwebtoken";
import Post from "../models/Post.js";

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "30d" });
};

export const register = asyncHandler(async (req, res) => {
  const { name, username, password, mobileNo } = req.body;

  const userExists = await User.findOne({ username });
  if (userExists) {
    res.status(400);
    throw new Error("User already exists");
  }

  const user = await User.create({ name, username, password, mobileNo });
  const token = generateToken(user._id);

  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 30 * 24 * 60 * 60 * 1000,
  };

  res.cookie("token", token, cookieOptions);

  const userResponse = {
    _id: user._id,
    name: user.name,
    username: user.username,
    mobileNo: user.mobileNo,
    followers: user.followers,
    following: user.following,
    profileImage: user.profileImage,
    createdAt: user.createdAt,
    token: token, // Include the token in the response
  };

  res.status(201).json({
    success: true,
    data: userResponse,
  });
});

export const login = asyncHandler(async (req, res) => {
  const { username, password } = req.body;

  const user = await User.findOne({ username }).select("+password");

  if (!user) {
    res.status(401);
    throw new Error("Invalid credentials");
  }

  const isMatch = await user.matchPassword(password);

  if (isMatch) {
    const token = generateToken(user._id);

    // Set cookie options
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    };

    // Set cookie
    res.cookie("token", token, cookieOptions);

    // Create response object
    const userResponse = {
      _id: user._id,
      name: user.name,
      username: user.username,
      mobileNo: user.mobileNo,
      followers: user.followers,
      following: user.following,
      profileImage: user.profileImage,
      createdAt: user.createdAt,
      token: token, // Include the token in the response
    };

    res.json({
      success: true,
      data: userResponse,
    });
  } else {
    res.status(401);
    throw new Error("Invalid credentials");
  }
});

export const logout = asyncHandler(async (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  });

  res.status(200).json({
    success: true,
    message: "Logged out successfully",
  });
});

export const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select("-password");
  const posts = await Post.find({ user: req.user._id })
    .sort({ createdAt: -1 }) // Sort by newest first
    .select("content image createdAt updatedAt"); // Select only needed fields

  const userWithPosts = {
    ...user.toObject(),
    posts: posts,
  };

  res.status(200).json(userWithPosts);
});
