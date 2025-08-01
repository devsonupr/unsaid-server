import Like from '../models/Like.js';
import Post from '../models/Post.js';
import ErrorResponse from '../utils/errorResponse.js';


export const likePost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.postId);

    if (!post) {
      return next(
        new ErrorResponse(`Post not found with id of ${req.params.postId}`, 404)
      );
    }

    const existingLike = await Like.findOne({
      user: req.user.id,
      post: req.params.postId,
    });

    if (existingLike) {
      return next(new ErrorResponse('Post already liked', 400));
    }

    const like = await Like.create({
      user: req.user.id,
      post: req.params.postId,
    });

    post.likes.unshift(like._id);
    await post.save();

    res.status(201).json({
      success: true,
      data: like,
    });
  } catch (err) {
    next(err);
  }
};


export const unlikePost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.postId);

    if (!post) {
      return next(
        new ErrorResponse(`Post not found with id of ${req.params.postId}`, 404)
      );
    }

    const like = await Like.findOne({
      user: req.user.id,
      post: req.params.postId,
    });

    if (!like) {
      return next(new ErrorResponse('Post not liked', 400));
    }

    post.likes = post.likes.filter(
      (likeId) => likeId.toString() !== like._id.toString()
    );
    await post.save();

    await like.deleteOne();

    res.status(200).json({
      success: true,
      data: {},
    });
  } catch (err) {
    next(err);
  }
};


export const checkLike = async (req, res, next) => {
  try {
    const like = await Like.findOne({
      user: req.user.id,
      post: req.params.postId,
    });

    res.status(200).json({
      success: true,
      data: { liked: !!like },
    });
  } catch (err) {
    next(err);
  }
};
