import express from 'express';
import {
  getUsers,
  getUser,
  updateUser,
  deleteUser,
  followUser,
  unfollowUser,
  savePost,
  unsavePost,
  updateProfile,
  getUserByUsername,
  getUsersByIds,
  deleteUserAccount,
} from '../controllers/userController.js';
import { protect } from '../middlewares/auth.js';
import upload from '../middlewares/upload.js';
import User from '../models/User.js';


const router = express.Router();

// Profile routes - should come before the :id routes
router.put('/:userId/profile', protect, upload.single('profileImage'), updateProfile);


// router.route('/delete-account')
//   .delete(protect, deleteAccount);
  router.route("/:identifier").delete(protect, deleteUserAccount);

router.get('/', getUsers);
router.get('/:id', getUser);
router.get('/username/:username', getUserByUsername);
router.post('/get-users-by-ids', getUsersByIds);

router.put('/:id', protect, updateUser);
router.delete('/:id', protect, deleteUser);
router.put('/:id/follow', protect, followUser);
router.put('/:id/unfollow', protect, unfollowUser);
router.put('/save/:postId', protect, savePost);
router.put('/unsave/:postId', protect, unsavePost);


// routes/userRoutes.js
router.get('/search', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) {
      return res.status(400).json({ success: false, message: 'Search query required' });
    }

    const users = await User.find({
      $or: [
        { username: { $regex: q, $options: 'i' } },
        { name: { $regex: q, $options: 'i' } }
      ]
    }).select('-password').limit(10);

    res.status(200).json({ success: true, data: users });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});


export default router;
