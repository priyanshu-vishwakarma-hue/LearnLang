import express from 'express';
import User from '../models/User.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Get user profile
router.get('/profile', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    res.json({ user });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update user profile
router.put('/profile', authenticate, async (req, res) => {
  try {
    const updates = req.body;
    const user = await User.findById(req.userId);

    if (updates.profile) {
      user.profile = { ...user.profile, ...updates.profile };
    }

    await user.save();
    res.json({ message: 'Profile updated', user: user.profile });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get statistics
router.get('/statistics', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('statistics');
    res.json({ statistics: user.statistics });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;
