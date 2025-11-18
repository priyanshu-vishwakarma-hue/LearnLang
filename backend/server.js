import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import authRoutes from './routes/auth.js';
import conversationRoutes from './routes/conversation.js';
import userRoutes from './routes/user.js';
import savedRoutes from './routes/saved.js';

dotenv.config();

const app = express();

// Debug: Check if environment variables are loaded
console.log('🔍 Environment Check:');
console.log('PORT:', process.env.PORT);
console.log('MONGODB_URI:', process.env.MONGODB_URI ? 'Present ✓' : 'MISSING ✗');
console.log('JWT_SECRET:', process.env.JWT_SECRET ? 'Present ✓' : 'MISSING ✗');
console.log('GROQ_API_KEY:', process.env.GROQ_API_KEY ? `Present ✓` : 'MISSING ✗');

if (!process.env.GROQ_API_KEY) {
  console.error('❌ FATAL ERROR: GROQ_API_KEY is not set in .env file!');
  process.exit(1);
}

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB Connected'))
  .catch(err => console.error('❌ MongoDB Connection Error:', err));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/conversation', conversationRoutes);
app.use('/api/user', userRoutes);
app.use('/api/saved', savedRoutes);

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'LangLearn API is running with Groq' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT} with Groq AI`);
});
