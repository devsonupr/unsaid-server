import express from 'express';
import {
  getPosts,
  getPost,
  createPost,
  updatePost,
  deletePost,
  getPostsByUser,
  getPostsByUsername,
} from '../controllers/postController.js';
import { protect } from '../middlewares/auth.js';
import likeRoutes from '../routes/likeRoutes.js';

const router = express.Router();

// Re-route to like routes
router.use('/:postId/likes', likeRoutes);

router.get('/', getPosts);
router.get('/:id', getPost);
router.get('/user/:userId', getPostsByUser);
router.get('/userr/:username', getPostsByUsername);
router.post('/', protect, createPost);
router.put('/:id', protect, updatePost);
router.delete('/:id', protect, deletePost);

export default router;






