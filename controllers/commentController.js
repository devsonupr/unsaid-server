import Comment from '../models/Comment.js';
import Post from '../models/Post.js';
import ErrorResponse from '../utils/errorResponse.js';

// @desc    Get comments for a post
// @route   GET /api/v1/posts/:postId/comments
// @access  Public
export const getComments = async (req, res, next) => {
  try {
    const comments = await Comment.find({ post: req.params.postId })
      .populate('user', 'username name profileImage')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: comments.length,
      data: comments,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Add comment to a post
// @route   POST /api/v1/posts/:postId/comments
// @access  Private
export const addComment = async (req, res, next) => {
  try {
    req.body.user = req.user.id;
    req.body.post = req.params.postId;

    const post = await Post.findById(req.params.postId);

    if (!post) {
      return next(
        new ErrorResponse(`Post not found with id of ${req.params.postId}`, 404)
      );
    }

    const comment = await Comment.create(req.body);

    post.comments.unshift(comment._id);
    await post.save();

    res.status(201).json({
      success: true,
      data: comment,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Reply to a comment
// @route   POST /api/v1/comments/:commentId/replies
// @access  Private
export const addReply = async (req, res, next) => {
  try {
    const parentComment = await Comment.findById(req.params.commentId);

    if (!parentComment) {
      return next(
        new ErrorResponse(`Comment not found with id of ${req.params.commentId}`, 404)
      );
    }

    req.body.user = req.user.id;
    req.body.post = parentComment.post;
    req.body.parentComment = parentComment._id;

    const reply = await Comment.create(req.body);

    parentComment.replies.unshift(reply._id);
    await parentComment.save();

    res.status(201).json({
      success: true,
      data: reply,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update comment
// @route   PUT /api/v1/comments/:id
// @access  Private
export const updateComment = async (req, res, next) => {
  try {
    let comment = await Comment.findById(req.params.id);

    if (!comment) {
      return next(
        new ErrorResponse(`Comment not found with id of ${req.params.id}`, 404)
      );
    }

    if (comment.user.toString() !== req.user.id) {
      return next(
        new ErrorResponse(
          `User ${req.user.id} is not authorized to update this comment`,
          401
        )
      );
    }

    comment = await Comment.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      data: comment,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete comment
// @route   DELETE /api/v1/comments/:id
// @access  Private
export const deleteComment = async (req, res, next) => {
  try {
    const comment = await Comment.findById(req.params.id);

    if (!comment) {
      return next(
        new ErrorResponse(`Comment not found with id of ${req.params.id}`, 404)
      );
    }

    if (comment.user.toString() !== req.user.id) {
      return next(
        new ErrorResponse(
          `User ${req.user.id} is not authorized to delete this comment`,
          401
        )
      );
    }

    const post = await Post.findById(comment.post);
    post.comments = post.comments.filter(
      (commentId) => commentId.toString() !== comment._id.toString()
    );
    await post.save();

    if (comment.parentComment) {
      const parentComment = await Comment.findById(comment.parentComment);
      parentComment.replies = parentComment.replies.filter(
        (replyId) => replyId.toString() !== comment._id.toString()
      );
      await parentComment.save();
    }

    if (comment.replies.length > 0) {
      await Comment.deleteMany({ _id: { $in: comment.replies } });
    }

    await comment.remove();

    res.status(200).json({
      success: true,
      data: {},
    });
  } catch (err) {
    next(err);
  }
};
