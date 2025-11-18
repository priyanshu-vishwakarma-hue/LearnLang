# LangLearn - AI-Powered English Conversation App

A voice-enabled English learning application with AI tutor powered by Google Gemini.

## Features

- 🎙️ Voice input/output (Speech-to-Text & Text-to-Speech)
- 🤖 AI conversation tutor using Google Gemini
- 🌍 Multi-language support (Hindi/English auto-detection)
- 📊 Progress tracking and statistics
- ✅ Grammar correction with feedback
- 💾 Last 20 messages storage (auto-cleanup for MongoDB space)
- 🔐 Persistent login with JWT
- 📱 Responsive design (mobile & desktop)

## Tech Stack

**Frontend:**
- React 18 with Vite
- Tailwind CSS
- Web Speech API (free voice features)
- React Router v6
- Axios

**Backend:**
- Node.js + Express
- MongoDB + Mongoose
- JWT authentication
- Google Gemini AI (gemini-pro model)
- bcryptjs for password hashing

## Installation

### Prerequisites
- Node.js 18+ 
- MongoDB account (512MB free tier works)
- Google Gemini API key

### Backend Setup

```bash
cd backend
npm install

# Create .env file
cp .env.example .env
# Edit .env and add your credentials:
# MONGODB_URI=your_mongodb_connection_string
# JWT_SECRET=your_secret_key
# GEMINI_API_KEY=your_gemini_api_key

npm run dev
```

### Frontend Setup

```bash
cd frontend
npm install

# Create .env file
cp .env.example .env
# Edit if deploying (default: http://localhost:5000/api)

npm run dev
```

## Usage

1. **Signup:** Create account with name, email, password, native language, and proficiency level
2. **Dashboard:** View statistics and progress
3. **Chat:** Start conversation with AI tutor
   - Click microphone for voice input
   - Type messages manually
   - AI responds with voice output
   - Get grammar corrections in real-time
   - Switch between Hindi/English
4. **Profile:** Update personal information

## Deployment

### Backend (Any Node.js hosting)
```bash
npm run build
npm start
```

### Frontend (Vercel)
```bash
npm run build
# Deploy dist folder to Vercel
```

Set environment variables in your hosting platform.

## Database Space Management

The app automatically:
- Keeps only last 20 messages per user
- Deletes older messages to save space
- Perfect for MongoDB 512MB free tier

## API Endpoints

**Auth:**
- POST `/api/auth/signup` - Register
- POST `/api/auth/login` - Login
- GET `/api/auth/verify` - Verify token

**User:**
- GET `/api/user/profile` - Get profile
- PUT `/api/user/profile` - Update profile
- GET `/api/user/statistics` - Get stats

**Conversation:**
- GET `/api/conversation` - Get messages
- POST `/api/conversation/message` - Send message
- DELETE `/api/conversation/clear` - Clear chat

## License

MIT License
