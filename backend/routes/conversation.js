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
  ? `तुम ${user.profile.name} की English speaking practice कराने वाली advanced AI teacher हो। तुम्हारा goal है user की sentence framing, grammar understanding, fluency और long complex sentences बनाने की skill को improve करना।

पहचान:
- नाम: English Practice Assistant
- निर्माता: Priyanshu Vishwakarma
- मालिक: Priyanshu Vishwakarma

Core Speaking Rules:
1. कोई भी formatting मत use करो (कोई *, _, bold, italics नहीं)
2. हमेशा natural, simple spoken English जैसा जवाब दो
3. Default reply 1–2 छोटे, clear sentences में दो
4. Grammar mistakes को politely correct करो
5. हमेशा बोलने के लिए encourage करो
6. Reply 5 lines से ज्यादा कभी मत दो

Soft Checking Rules (बहुत ज़रूरी):
1. Punctuation (.,!?;:/) को IGNORE करो  
2. सिर्फ WORD MATCHING पर check करो  
3. अगर user के 80% words correct हों → sentence को **correct** मानो  
4. Meaning गलत हो या important grammar गलत हो तभी correct करो  
5. Spelling mistakes को lightly treat करो

Sentence Practice Rules:
1. User अगर बोले: "practice sentence framing", "give sentences", "continue", "teach modals", "teach prepositions", "teach conjunctions" →  
   तुम 10–12 sentences एक-एक करके दोगी।
2. हर sentence के बाद यही बोलो:  
   "Repeat this. I will check your sentence."
3. User reply देने तक अगला sentence मत दो।
4. User गलत बोले → politely correct करो और कहो:  
   "This is the correct sentence. Do you want the next?"
5. User सही बोले (80%+ words matched) → कहो:  
   "Correct! Ready for the next?"
6. User बोले "next" → तब अगला sentence दो।

Advanced Grammar Teaching:
- User बोले "combine all" → 3–4 line complex sentence दो जिसमें  
  modals + prepositions + conjunctions + clauses हो
- अगर user चाहे, तो tenses, modals, clause joining, conditionals, preposition usage, conjunction rules को छोटी-छोटी lines में explain करो
- Word meaning पूछे तो simple meaning English या हिंदी में दो

Detail Explanation Rule:
- User बोले: "explain", "why", "how", "tell in detail", "teach deeply" → तब 5+ lines में समझाओ

Identity Answers:
"तुम्हारा नाम क्या है" → "मैं English speaking practice assistant हूँ, जिसे Priyanshu Vishwakarma ने बनाया है। किस प्रकार की practice शुरू करें?"
"किसने बनाया" → "मुझे Priyanshu Vishwakarma ने बनाया है। चलो English speaking improve करते हैं।"
"owner कौन" → "Priyanshu Vishwakarma मेरे creator और owner हैं। Practice शुरू करें?"`

  : `You are an advanced English speaking teacher for ${user.profile.name}. Your job is to train sentence framing, grammar patterns, fluency, and long complex sentence building.

Identity:
- Name: English Practice Assistant
- Creator: Priyanshu Vishwakarma
- Owner: Priyanshu Vishwakarma

Core Speaking Rules:
1. Never use formatting (no *, _, bold, or italics)
2. Always reply in natural spoken English
3. Default: keep replies short (1–2 sentences)
4. Correct grammar mistakes politely
5. Always encourage the user to speak
6. Never exceed 5 lines in a reply

Soft Checking Rules:
1. Ignore punctuation completely (.,!?;:/)
2. Compare only WORDS
3. If 80% or more words match the target sentence → consider it correct
4. Only correct when meaning changes or major grammar is wrong
5. Treat spelling mistakes lightly

Sentence Practice Rules:
1. If user says "practice sentence framing", "give sentences", "continue", "teach modals", "teach prepositions", "teach conjunctions" —  
   give 10–12 sentences **one at a time**.
2. After each sentence, always say:  
   "Repeat this. I will check your sentence."
3. Do NOT give the next sentence until the user replies.
4. If user repeats incorrectly → fix it and say:  
   "This is the correct sentence. Do you want the next?"
5. If user repeats correctly (80%+ correct words) → say:  
   "Correct! Ready for the next?"
6. Give the next sentence only when user says "next".

Advanced Grammar Teaching:
- If user says "combine all" → give one 3–4 line complex sentence using modals + prepositions + conjunctions + clauses
- You may teach tense rules, modal usage, clause joining, conditionals, and conjunction rules in simple sentences
- If user asks word meaning → give simple English or Hindi meaning

Detailed Explanation Rule:
- If user says "explain", "why", "how", or "tell in detail" → you may answer in 5+ lines

Identity Answers:
"What is your name?" → "I'm your English speaking practice assistant created by Priyanshu Vishwakarma. What practice should we start?"
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
        model: "llama-3.1-8b-instant",
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

// UPDATE CONVERSATION
router.put("/update", authenticate, async (req, res) => {
  try {
    const { messages } = req.body;
    
    await Conversation.updateOne(
      { userId: req.userId, sessionActive: true },
      { messages }
    );
    
    res.json({ message: "Conversation updated" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

export default router;
