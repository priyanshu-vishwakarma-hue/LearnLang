import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  profile: {
    name: { type: String, required: true },
    nativeLanguage: { type: String, default: 'Hindi' },
    targetLanguage: { type: String, default: 'English' },
    proficiencyLevel: { 
      type: String, 
      enum: ['beginner', 'intermediate', 'advanced'],
      default: 'beginner'
    },
    learningGoals: { type: String, default: '' },
    age: { type: Number },
    occupation: { type: String },
    interests: [String]
  },
  statistics: {
    totalConversations: { type: Number, default: 0 },
    correctResponses: { type: Number, default: 0 },
    incorrectResponses: { type: Number, default: 0 },
    grammarCorrections: { type: Number, default: 0 },
    vocabularyLearned: { type: Number, default: 0 },
    totalMessages: { type: Number, default: 0 },
    lastActive: { type: Date, default: Date.now }
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model('User', userSchema);
