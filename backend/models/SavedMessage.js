import mongoose from 'mongoose';

const savedMessageSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  userMessage: {
    type: String,
    required: true
  },
  aiResponse: {
    type: String,
    required: true,
    index: true
  },
  folderName: {
    type: String,
    required: true
  },
  savedAt: {
    type: Date,
    default: Date.now
  }
});

savedMessageSchema.index({ userId: 1, aiResponse: 1 }, { unique: true });

export default mongoose.model('SavedMessage', savedMessageSchema);
