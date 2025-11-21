import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import User from '../models/User.js';

const router = express.Router();

// SIGNUP
router.post(
  '/signup',
  [
    body('name')
      .trim()
      .notEmpty().withMessage('Name is required')
      .isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
    body('email')
      .trim()
      .isEmail().withMessage('Please enter a valid email')
      .normalizeEmail(),
    body('password')
      .isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('proficiencyLevel')
      .isIn(['beginner', 'intermediate', 'advanced'])
      .withMessage('Invalid proficiency level')
  ],
  async (req, res) => {
    try {
      console.log('📝 Signup request received:', {
        name: req.body.name,
        email: req.body.email,
        proficiencyLevel: req.body.proficiencyLevel
      });

      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        console.log('❌ Validation errors:', errors.array());
        return res.status(400).json({ 
          message: 'Validation failed',
          errors: errors.array().map(err => ({
            field: err.path,
            message: err.msg
          }))
        });
      }

      const { name, email, password, proficiencyLevel } = req.body;

      // Check if user already exists
      const existingUser = await User.findOne({ email: email.toLowerCase() });
      if (existingUser) {
        console.log('❌ User already exists:', email);
        return res.status(400).json({ 
          message: 'User with this email already exists' 
        });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create new user
      const user = new User({
        email: email.toLowerCase(),
        password: hashedPassword,
        profile: {
          name: name.trim(),
          proficiencyLevel: proficiencyLevel || 'beginner'
        }
      });

      await user.save();
      console.log('✅ User created successfully:', user.email);

      // Generate token
      const token = jwt.sign(
        { userId: user._id },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      res.status(201).json({
        message: 'User created successfully',
        token,
        user: {
          id: user._id,
          email: user.email,
          profile: user.profile
        }
      });
    } catch (error) {
      console.error('❌ Signup error:', error);
      res.status(500).json({ 
        message: 'Server error during signup',
        error: error.message 
      });
    }
  }
);

// LOGIN
router.post(
  '/login',
  [
    body('email').trim().isEmail().withMessage('Please enter a valid email').normalizeEmail(),
    body('password').notEmpty().withMessage('Password is required')
  ],
  async (req, res) => {
    try {
      console.log('🔐 Login request received:', req.body.email);

      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        console.log('❌ Validation errors:', errors.array());
        return res.status(400).json({ 
          message: 'Validation failed',
          errors: errors.array().map(err => ({
            field: err.path,
            message: err.msg
          }))
        });
      }

      const { email, password } = req.body;

      // Find user
      const user = await User.findOne({ email: email.toLowerCase() });
      if (!user) {
        console.log('❌ User not found:', email);
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      // Check password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        console.log('❌ Invalid password for:', email);
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      // Generate token
      const token = jwt.sign(
        { userId: user._id },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      console.log('✅ Login successful:', user.email);

      res.json({
        message: 'Login successful',
        token,
        user: {
          id: user._id,
          email: user.email,
          profile: user.profile
        }
      });
    } catch (error) {
      console.error('❌ Login error:', error);
      res.status(500).json({ 
        message: 'Server error during login',
        error: error.message 
      });
    }
  }
);

export default router;
