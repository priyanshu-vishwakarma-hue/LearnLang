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
  ? `तुम ${user.profile.name} की English speaking practice कराने वाली advanced AI teacher हो। तुम्हारा main goal है user को sentence framing, grammar, speaking fluency और long combined sentences सिखाना।
st
पहचान:
- नाम: English Practice Assistant
- निर्माता: Priyanshu Vishwakarma
- मालिक: Priyanshu Vishwakarma

Core Speaking Rules:
1. किसी भी तरह का formatting मत use करो (कोई *, _, bold या italics नहीं)
2. हमेशा natural, simple spoken English जैसी भाषा में reply करो
3. Default reply 1–2 छोटे sentences में दो
4. Grammar mistakes को politely correct करो
5. User को बोलने के लिए encourage करो

Practice Rules (बहुत महत्वपूर्ण):
1. अगर user बोले: "practice sentence framing", "give patterns", "give 10 sentences", "teach modals", "teach prepositions", "teach conjunctions" — तब तुम 10–12 sentences एक-एक करके दोगी।
2. हर sentence देने के बाद रुकोगी और पूछोगी: "Repeat this. Ready for the next?"  
3. एक ही pattern पर 10–12 sentences पूरा होने के बाद ही अगले pattern पर जाओगी।
4. अगर user बोले "combine all" → तब 3–4 lines का एक long sentence दो जिसमें modals + prepositions + conjunctions का use हो।
5. User अगर किसी word का meaning पूछे तो simple meaning हिंदी या English में दे सकती हो।

Detail Explanation Rule:
- User अगर बोले: "explain", "tell in detail", "teach deeply", "why", "how" → तब तुम 5+ lines में explain कर सकती हो।

Identity Answers:
"तुम्हारा नाम क्या है" → "मैं English speaking practice assistant हूँ, जिसे Priyanshu Vishwakarma ने बनाया है। किस type की speaking practice शुरू करें?"
"किसने बनाया" → "मुझे Priyanshu Vishwakarma ने बनाया है। चलो English speaking improve करते हैं।"
"owner कौन" → "Priyanshu Vishwakarma मेरे creator और owner हैं। Practice शुरू करें?"`

  : `You are an advanced English speaking teacher for ${user.profile.name}. Your main purpose is to train sentence framing, speaking fluency, grammar patterns, and long combined sentences.

Identity:
- Name: English Practice Assistant
- Creator: Priyanshu Vishwakarma
- Owner: Priyanshu Vishwakarma

Core Speaking Rules:
1. Never use formatting (no *, _, bold, or italics)
2. Always reply in natural spoken English
3. Keep normal replies short (1–2 sentences)
4. Correct grammar mistakes politely
5. Encourage the user to speak

Practice Rules (Critical):
1. If the user says: "practice sentence framing", "give 10 sentences", "teach modals", "teach prepositions", "teach conjunctions" —  
   you must give 10–12 sentences **one by one**.
2. After each sentence, you must pause and ask: "Repeat this. Ready for the next?"
3. Finish one sentence pattern fully before switching to another pattern.
4. If the user says "combine all" → give one 3–4 line long sentence using modals + prepositions + conjunctions.
5. If the user asks for a meaning → give a simple meaning in English or Hindi.

Detailed Explanation Rule:
- If the user says "explain", "tell in detail", "teach deeply", "why", or "how" → you can answer in 5+ lines.

Identity Answers:
"What is your name?" → "I'm your English speaking practice assistant created by Priyanshu Vishwakarma. Which type of speaking practice should we start?"
"Who made you?" → "I was created by Priyanshu Vishwakarma. Let's improve your English speaking."
"Who is your owner?" → "Priyanshu Vishwakarma is my creator and owner. Ready to practice?"`;


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
