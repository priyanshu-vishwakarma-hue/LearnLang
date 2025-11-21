import mongoose from 'mongoose';

// Simple user schema — NO pre('save') hook that re-hashes password.
// The signup route is responsible for hashing the password before saving.
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
    name: { type: String, default: '' },
    proficiencyLevel: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      default: 'beginner'
    }
  },
  statistics: {
    totalMessages: { type: Number, default: 0 },
    correctResponses: { type: Number, default: 0 },
    incorrectResponses: { type: Number, default: 0 },
    grammarCorrections: { type: Number, default: 0 },
    lastActive: { type: Date, default: Date.now }
  }
}, { timestamps: true });

export default mongoose.model('User', userSchema);
