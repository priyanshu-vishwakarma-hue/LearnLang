import express from "express";
import Groq from "groq-sdk";
import Conversation from "../models/Conversation.js";
import User from "../models/User.js";
import { authenticate } from "../middleware/auth.js";

const router = express.Router();

// Initialize Groq LAZILY (only when needed, after env is loaded)
let groq = null;
const getGroq = () => {
  if (!groq) {
    groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  }
  return groq;
};

// Language detection helper
const detectLanguage = (text) =>
  /[\u0900-\u097F]/.test(text) ? "hi" : "en";

// ===================================================================
// GET OR CREATE CONVERSATION
// ===================================================================
router.get("/", authenticate, async (req, res) => {
  try {
    let conversation = await Conversation.findOne({
      userId: req.userId,
      sessionActive: true,
    });

    if (!conversation) {
      conversation = new Conversation({
        userId: req.userId,
        messages: [],
      });
      await conversation.save();
    }

    res.json({ conversation });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// ===================================================================
// SEND MESSAGE
// ===================================================================
router.post("/message", authenticate, async (req, res) => {
  try {
    console.log('📥 ===== NEW MESSAGE REQUEST =====');
    console.log('📦 Request body:', JSON.stringify(req.body, null, 2));
    console.log('🔑 User ID from token:', req.userId);
    
    const { message, userSpeakLanguage = 'en', aiResponseLanguage = 'en' } = req.body;
    
    console.log('📝 Message:', message);
    console.log('🗣️ User speaks:', userSpeakLanguage);
    console.log('🤖 AI should respond in:', aiResponseLanguage);

    // FIXED: Properly fetch user with error handling
    const user = await User.findById(req.userId);
    
    if (!user) {
      console.error('❌ User not found with ID:', req.userId);
      return res.status(404).json({ message: 'User not found. Please log in again.' });
    }
    
    console.log('✅ User found:', user.email);
    
    let conversation = await Conversation.findOne({
      userId: req.userId,
      sessionActive: true,
    });

    if (!conversation) {
      console.log('📝 Creating new conversation...');
      conversation = new Conversation({ userId: req.userId, messages: [] });
    }

    const detectedLang = detectLanguage(message);

    conversation.messages.push({
      role: "user",
      content: message,
      language: detectedLang,
    });

    // STRONG identity and language enforcement
    const systemMessage = aiResponseLanguage === 'hi'
  ? `तुम ${user.profile.name} की English speaking practice कराने वाली friendly AI teacher हो।

पहचान:
- नाम: "English Practice Assistant"
- निर्माता: Priyanshu Vishwakarma
- मालिक: Priyanshu Vishwakarma

Speaking Practice Rules (बहुत ज़रूरी):
1. Natural conversation में reply करो - कभी asterisks (*), italics, या formatting मत use करो
2. Simple, spoken English में बोलो - जैसे friends बात करते हैं
3. 1-2 छोटे sentences में reply दो - directly और clearly
4. Grammar mistakes को politely correct करो बिना asteris्क के
5. Encourage करो natural speaking style के लिए
6. Roleplay और dialogue scenarios दे सकती हो

Example Good Replies:
❌ BAD: "Oh, that's *wonderful*! You're doing **great**!"
✅ GOOD: "Oh that's wonderful! You're doing great!"

❌ BAD: "*nervously* I think we should practice more..."
✅ GOOD: "I think we should practice more. Are you ready?"

Identity Answers:
"तुम्हारा नाम क्या है" → "मैं English speaking practice assistant हूँ। Priyanshu Vishwakarma ने मुझे बनाया है। आज किस topic पर बात करेंगे?"
"किसने बनाया" → "Priyanshu Vishwakarma ने मुझे बनाया है। चलो English practice करते हैं!"
"owner कौन" → "Priyanshu Vishwakarma मेरे creator हैं। क्या आप conversation practice करना चाहेंगे?"`

  : `You are a friendly English speaking practice assistant for ${user.profile.name}.

Identity:
- Name: "English Practice Assistant"
- Creator: Priyanshu Vishwakarma
- Owner: Priyanshu Vishwakarma

Speaking Practice Rules (CRITICAL):
1. Reply in natural spoken English - NEVER use asterisks (*), italics, bold, or any formatting
2. Speak simply and clearly - like friends talking
3. Keep replies to 1-2 short sentences - direct and conversational
4. Correct grammar mistakes politely without asterisks or special formatting
5. Encourage natural speaking style
6. You can suggest roleplay scenarios and practice dialogues

Example Good Replies:
❌ BAD: "Oh, that's *wonderful*! You're doing **great**!"
✅ GOOD: "Oh that's wonderful! You're doing great!"

❌ BAD: "*nervously* I think we should practice more..."
✅ GOOD: "I think we should practice more. Are you ready?"

❌ BAD: "A: Hey, how are you?  **B:** I'm good, thanks!"
✅ GOOD: "Hey, how are you? I'm good thanks! How about you?"

Identity Answers:
"What is your name?" → "I'm your English speaking practice assistant created by Priyanshu Vishwakarma. What would you like to talk about today?"
"Who made you?" → "I was created by Priyanshu Vishwakarma. Let's practice some English!"
"Who is your owner?" → "Priyanshu Vishwakarma is my creator. Ready for conversation practice?"`;

    console.log('📋 Language mode:', aiResponseLanguage === 'hi' ? 'HINDI' : 'ENGLISH');

    let aiResponse = "";

    try {
      const groqClient = getGroq();
      
      const messages = [
        { role: "system", content: systemMessage },
        ...conversation.messages.slice(-6).map(m => ({
          role: m.role === 'user' ? 'user' : 'assistant',
          content: m.content
        })),
        { role: "user", content: message }
      ];
      
      const completion = await groqClient.chat.completions.create({
        model: "groq/compound-mini",
        messages: messages,
        max_tokens: 80,
        temperature: 0.7,
      });

      aiResponse = completion.choices?.[0]?.message?.content?.trim() || "Tell me more!";
      console.log('🤖 Groq response:', aiResponse);
      
      // CLEAN UP: Remove ALL formatting asterisks, bold, italics
      aiResponse = aiResponse
        .replace(/\*\*/g, '')      // Remove bold
        .replace(/\*/g, '')        // Remove asterisks
        .replace(/_/g, '')         // Remove underscores
        .replace(/\[/g, '')        // Remove brackets
        .replace(/\]/g, '')
        .replace(/\*\*\*/g, '')
        .replace(/~~~/g, '')
        .replace(/A:/gi, '')       // Remove dialogue labels
        .replace(/B:/gi, '')
        .replace(/Person A:/gi, '')
        .replace(/Person B:/gi, '')
        .trim();

      console.log('🧹 Cleaned response:', aiResponse);
      
      // Validation for Hindi responses
      if (aiResponseLanguage === 'hi') {
        const hasHindiChars = /[\u0900-\u097F]/.test(aiResponse);
        const englishWordCount = (aiResponse.match(/\b[a-zA-Z]+\b/g) || []).length;
        const hasWrongIdentity = aiResponse.toLowerCase().includes('compound') || 
                                 aiResponse.toLowerCase().includes('groq') ||
                                 aiResponse.includes('कंपाउंड') ||
                                 aiResponse.includes('ग्रूक');
        
        if (!hasHindiChars || englishWordCount > 5 || hasWrongIdentity) {
          console.log('⚠️ FORCING HINDI FALLBACK');
          const msgLower = message.toLowerCase();
          
          if (msgLower.includes("नाम") || msgLower.includes("name")) {
            aiResponse = "मैं English speaking practice assistant हूँ। Priyanshu Vishwakarma ने मुझे बनाया है। आज किस topic पर बात करेंगे?";
          } else if (msgLower.includes("practice") || msgLower.includes("conversation")) {
            aiResponse = "बिल्कुल! चलो natural conversation practice करते हैं। आप कैसे हैं आज?";
          } else if (msgLower.includes("हेलो") || msgLower.includes("hello") || msgLower.includes("hi")) {
            aiResponse = "नमस्ते! मैं आपकी English speaking में मदद करूंगी। किस बारे में बात करेंगे?";
          } else {
            aiResponse = "बहुत अच्छे! चलो English में बात करते हैं। आपका दिन कैसा रहा?";
          }
        }
      } else {
        // Check English responses too
        const hasWrongIdentity = aiResponse.toLowerCase().includes('compound') || 
                                 aiResponse.toLowerCase().includes('groq');
        
        if (hasWrongIdentity) {
          const msgLower = message.toLowerCase();
          if (msgLower.includes("name")) {
            aiResponse = "I'm your English speaking practice assistant created by Priyanshu Vishwakarma. What would you like to talk about?";
          } else if (msgLower.includes("practice") || msgLower.includes("conversation")) {
            aiResponse = "Yes! Let's practice natural conversation. How are you today?";
          } else if (msgLower.includes("hello") || msgLower.includes("hi")) {
            aiResponse = "Hello! I'll help you practice English speaking. What topic interests you?";
          }
        }
      }

    } catch (err) {
      console.error("❌ Groq error:", err.message);
      const msg = message.toLowerCase();
      
      if (aiResponseLanguage === 'hi') {
        if (msg.includes("practice") || msg.includes("conversation")) {
          aiResponse = "चलो English conversation practice करते हैं। आप कैसे हैं?";
        } else if (msg.includes("हेलो") || msg.includes("hello") || msg.includes("hi")) {
          aiResponse = "नमस्ते! आज हम किस बारे में बात करेंगे?";
        } else {
          aiResponse = "बहुत अच्छा! चलो बात करते हैं।";
        }
      } else {
        if (msg.includes("practice") || msg.includes("conversation")) {
          aiResponse = "Let's practice! How was your day?";
        } else if (msg.includes("hello") || msg.includes("hi")) {
          aiResponse = "Hello! What would you like to talk about?";
        } else {
          aiResponse = "That's interesting! Tell me more.";
        }
      }
    }

    const hasCorrection = aiResponse.includes("correct") || 
                         aiResponse.includes("सही") ||
                         aiResponse.includes("should be");

    conversation.messages.push({
      role: "assistant",
      content: aiResponse,
      language: aiResponseLanguage,
      hasGrammarError: hasCorrection,
    });

    await conversation.save();

    if (conversation.messages.length > 100) {
      conversation.messages = conversation.messages.slice(-100);
      await conversation.save();
    }

    user.statistics.totalMessages += 1;
    if (hasCorrection) user.statistics.grammarCorrections += 1;
    user.statistics.lastActive = new Date();
    await user.save();

    console.log('📤 Final clean response:', aiResponse);
    console.log('===== END REQUEST =====\n');
    
    res.json({
      message: "Message sent",
      aiResponse,
      hasCorrection,
      conversation,
    });
  } catch (error) {
    console.error("❌ Error:", error);
    console.error("❌ Stack trace:", error.stack);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// ===================================================================
// GET CONVERSATION SUGGESTION
// ===================================================================
router.post("/suggestion", authenticate, async (req, res) => {
  try {
    const { aiResponseLanguage = 'en' } = req.body;
    
    const suggestions = aiResponseLanguage === 'hi' 
      ? [
          "आज मैंने नया project शुरू किया जो React में है",
          "मुझे programming पसंद है क्योंकि यह creative है",
          "क्या आप मुझे async/await के बारे में बता सकते हैं?",
          "मैं full-stack developer बनना चाहता हूँ"
        ]
      : [
          "Today I started a new project using React",
          "I love programming because it's creative",
          "Can you explain async/await to me?",
          "I want to become a full-stack developer"
        ];
    
    const randomSuggestions = suggestions.sort(() => Math.random() - 0.5).slice(0, 3);
    res.json({ suggestions: randomSuggestions });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// ===================================================================
// CLEAR CONVERSATION
// ===================================================================
router.delete("/clear", authenticate, async (req, res) => {
  try {
    await Conversation.updateOne(
      { userId: req.userId, sessionActive: true },
      { messages: [] }
    );
    res.json({ message: "Conversation cleared" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

export default router;
