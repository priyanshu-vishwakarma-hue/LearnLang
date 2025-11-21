import express from 'express';
import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const router = express.Router();

// SIGNUP
router.post('/signup', async (req, res) => {
  try {
    const { email, password, name, proficiencyLevel } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ message: 'All fields required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const hashedPassword = await bcryptjs.hash(password, 10);
    
    console.log('🔐 Signup - Password hash created for:', email);
    console.log('Original password:', password);
    console.log('Hash created:', hashedPassword);
    
    const testMatch = await bcryptjs.compare(password, hashedPassword);
    console.log('Immediate test match:', testMatch);

    const user = new User({
      email: email.toLowerCase(),
      password: hashedPassword,
      profile: {
        name,
        proficiencyLevel: proficiencyLevel || 'beginner'
      }
    });

    await user.save();
    
    // VERIFY SAVED HASH
    const savedUser = await User.findOne({ email: email.toLowerCase() });
    console.log('Hash saved in DB:', savedUser.password);
    console.log('Hashes match:', savedUser.password === hashedPassword);
    
    console.log('✅ User created successfully:', email);

    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.status(201).json({
      token,
      user: {
        id: user._id,
        email: user.email,
        profile: user.profile,
        statistics: user.statistics,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// LOGIN
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      console.log('❌ User not found:', email);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    console.log('🔐 Login request received:', email);
    console.log('✅ User found, checking password...');
    console.log('Stored hash:', user.password.substring(0, 20) + '...');
    console.log('Password to check:', password);
    console.log('Password type:', typeof password);
    console.log('Hash type:', typeof user.password);
    console.log('Hash length:', user.password.length);
    
    // TRY COMPARISON
    const isMatch = await bcryptjs.compare(password, user.password);
    
    console.log('Password match result:', isMatch);

    // MANUAL DEBUG
    console.log('Testing with same string again...');
    const testAgain = await bcryptjs.hash(password, 10);
    console.log('New test hash:', testAgain);
    const testCompare = await bcryptjs.compare(password, testAgain);
    console.log('Test comparison:', testCompare);
    
    if (!isMatch) {
      console.log('❌ Invalid password for:', email);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    console.log('✅ Password matched!');

    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        email: user.email,
        profile: user.profile,
        statistics: user.statistics,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
