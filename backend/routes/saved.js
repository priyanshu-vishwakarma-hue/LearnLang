import express from 'express';
import SavedMessage from '../models/SavedMessage.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Helper: Get folder name based on date
const getFolderName = (date) => {
  const startDate = new Date('2025-01-01'); // App start date
  const currentDate = date || new Date();
  const diffTime = Math.abs(currentDate - startDate);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const folderNumber = Math.ceil(diffDays / 15);
  
  return `Folder ${folderNumber} (Days ${(folderNumber - 1) * 15 + 1}-${folderNumber * 15})`;
};

// NEW: Get all saved messages
router.get('/all', authenticate, async (req, res) => {
  try {
    const savedMessages = await SavedMessage.find({ userId: req.userId });
    res.json({ savedMessages });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Save a message
router.post('/save', authenticate, async (req, res) => {
  try {
    const { userMessage, aiResponse } = req.body;
    
    // Check if already saved
    const existing = await SavedMessage.findOne({
      userId: req.userId,
      aiResponse: aiResponse
    });
    
    if (existing) {
      return res.status(400).json({ 
        message: 'Message already saved',
        savedMessage: existing
      });
    }
    
    const folderName = getFolderName();
    
    const savedMessage = new SavedMessage({
      userId: req.userId,
      userMessage,
      aiResponse,
      folderName
    });
    
    await savedMessage.save();
    
    res.json({ 
      message: 'Message saved successfully',
      folderName,
      savedMessage
    });
  } catch (error) {
    console.error('Error saving message:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Toggle like on saved message
router.patch('/like/:id', authenticate, async (req, res) => {
  try {
    const savedMessage = await SavedMessage.findOne({
      _id: req.params.id,
      userId: req.userId
    });
    
    if (!savedMessage) {
      return res.status(404).json({ message: 'Saved message not found' });
    }
    
    savedMessage.liked = !savedMessage.liked;
    await savedMessage.save();
    
    res.json({ 
      message: 'Like toggled',
      liked: savedMessage.liked
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all saved messages grouped by folders
router.get('/folders', authenticate, async (req, res) => {
  try {
    const savedMessages = await SavedMessage.find({ userId: req.userId })
      .sort({ savedAt: -1 });
    
    // Group by folder
    const folders = {};
    savedMessages.forEach(msg => {
      if (!folders[msg.folderName]) {
        folders[msg.folderName] = [];
      }
      folders[msg.folderName].push(msg);
    });
    
    res.json({ folders });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete a saved message
router.delete('/:id', authenticate, async (req, res) => {
  try {
    await SavedMessage.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId
    });
    
    res.json({ message: 'Message deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;
