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

// Get user statistics
router.get('/statistics', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ statistics: user.statistics });
  } catch (error) {
    console.error('Error fetching statistics:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update user profile
router.put('/profile', authenticate, async (req, res) => {
  try {
    const { name, proficiencyLevel } = req.body;
    
    console.log('📝 Updating profile for user:', req.userId);
    console.log('📦 New data:', { name, proficiencyLevel });

    // Validate input
    if (!name || name.trim().length < 2) {
      return res.status(400).json({ message: 'Name must be at least 2 characters' });
    }

    if (!['beginner', 'intermediate', 'advanced'].includes(proficiencyLevel)) {
      return res.status(400).json({ message: 'Invalid proficiency level' });
    }

    const user = await User.findById(req.userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update profile
    user.profile.name = name.trim();
    user.profile.proficiencyLevel = proficiencyLevel;
    
    await user.save();
    
    console.log('✅ Profile updated successfully');

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        email: user.email,
        profile: user.profile
      }
    });
  } catch (error) {
    console.error('❌ Error updating profile:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
