import express from 'express';
import {
  getComments,
  addComment,
  addReply,
  updateComment,
  deleteComment,
} from '../controllers/commentController.js';
import { protect } from '../middlewares/auth.js';

const router = express.Router({ mergeParams: true });

router.get('/', getComments);
router.post('/', protect, addComment);
router.post('/:commentId/replies', protect, addReply);
router.put('/:id', protect, updateComment);
router.delete('/:id', protect, deleteComment);

export default router;
