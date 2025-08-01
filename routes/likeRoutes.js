import express from 'express';
import {
  likePost,
  unlikePost,
  checkLike,
} from '../controllers/likeController.js';
import { protect } from '../middlewares/auth.js';

const router = express.Router({ mergeParams: true });

router.get('/check', protect, checkLike);
router.post('/', protect, likePost);
router.delete('/', protect, unlikePost);

export default router;








