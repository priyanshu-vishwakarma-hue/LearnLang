import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  role: { 
    type: String, 
    enum: ['user', 'assistant'],
    required: true 
  },
  content: { type: String, required: true },
  language: { type: String, default: 'en' },
  hasGrammarError: { type: Boolean, default: false },
  correction: { type: String },
  timestamp: { type: Date, default: Date.now }
});

const conversationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  messages: [messageSchema],
  sessionActive: { type: Boolean, default: true }
}, {
  timestamps: true
});

// Keep only last 20 messages per user
conversationSchema.methods.maintainMessageLimit = async function() {
  if (this.messages.length > 20) {
    this.messages = this.messages.slice(-20);
    await this.save();
  }
};

export default mongoose.model('Conversation', conversationSchema);
