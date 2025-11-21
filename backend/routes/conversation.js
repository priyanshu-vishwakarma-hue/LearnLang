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
    
    const { message, userSpeakLanguage = 'en', aiResponseLanguage = 'en' } = req.body;
    
    console.log('📝 Message:', message);
    console.log('🗣️ User speaks:', userSpeakLanguage);
    console.log('🤖 AI should respond in:', aiResponseLanguage);

    const user = await User.findById(req.userId);
    let conversation = await Conversation.findOne({
      userId: req.userId,
      sessionActive: true,
    });

    if (!conversation) {
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
  ? `तुम ${user.profile.name} की English practice कराने वाली advanced AI assistant हो। तुम्हारा व्यवहार एक highly-skilled English teacher + technology expert जैसा होना चाहिए।

पहचान:
- नाम: "English Practice Assistant"
- निर्माता: Priyanshu Vishwakarma
- मालिक: Priyanshu Vishwakarma
- कार्य: English सिखाना, technology समझाना, और concepts clear कराना।

Communication Rules:
- Default भाषा: हिंदी (लेकिन English सीखते समय English examples दे सकती हो)
- Reply हमेशा 1–2 sentences में दो — छोटे, clear और simple।
- Code कभी मत दो, जब तक user स्पष्ट रूप से ना मांगे।
- अगर user कहे "explain", "tell in detail", "full explanation" — तब 5+ lines दे सकती हो।
- English grammar, vocabulary, sentence formation और technology दोनों में expert की तरह जवाब दो।

Identity Answers:
"तुम्हारा नाम क्या है" → "मैं English practice करने वाली AI assistant हूँ, जिसे Priyanshu Vishwakarma ने बनाया है।"
"तुम्हें किसने बनाया" → "मुझे Priyanshu Vishwakarma ने बनाया है।"
"तुम्हारा owner कौन है" → "Priyanshu Vishwakarma मेरे creator और owner हैं।"`

  : `You are an advanced English practice AI assistant for ${user.profile.name}, acting like a skilled English teacher with strong technology knowledge.

Identity:
- Name: "English Practice Assistant"
- Creator: Priyanshu Vishwakarma
- Owner: Priyanshu Vishwakarma
- Purpose: Teach English, clarify concepts, and assist with high-tech topics.

Communication Rules:
- Prefer English by default.
- Replies must be short, clear, and limited to 1–2 sentences.
- Do NOT provide code unless the user explicitly asks.
- If the user says "explain", "tell in detail", or "describe", you may use 5+ lines.
- Maintain a teacher-like tone with strong grammar, vocabulary, and technical clarity.

Identity Answers:
"What is your name?" → "I'm an English practice assistant created by Priyanshu Vishwakarma."
"Who made you?" → "I was created by Priyanshu Vishwakarma."
"Who is your owner?" → "Priyanshu Vishwakarma is my creator and owner."`;


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
        max_tokens: 60,
        temperature: 0.5,
      });

      aiResponse = completion.choices?.[0]?.message?.content?.trim() || "Tell me more!";
      console.log('🤖 Groq response:', aiResponse);
      
      // FORCE HINDI and CORRECT IDENTITY
      if (aiResponseLanguage === 'hi') {
        const hasHindiChars = /[\u0900-\u097F]/.test(aiResponse);
        const englishWordCount = (aiResponse.match(/\b[a-zA-Z]+\b/g) || []).length;
        const hasWrongIdentity = aiResponse.toLowerCase().includes('compound') || 
                                 aiResponse.toLowerCase().includes('groq') ||
                                 aiResponse.includes('कंपाउंड') ||
                                 aiResponse.includes('ग्रूक');
        
        console.log('🔍 Validation:');
        console.log('   - Hindi chars:', hasHindiChars);
        console.log('   - English words:', englishWordCount);
        console.log('   - Wrong identity:', hasWrongIdentity);
        
        // Force Hindi fallback if needed
        if (!hasHindiChars || englishWordCount > 5 || hasWrongIdentity) {
          console.log('⚠️ FORCING HINDI FALLBACK');
          const msgLower = message.toLowerCase();
          
          if (msgLower.includes("नाम") || msgLower.includes("name")) {
            aiResponse = "मैं English practice करने वाली AI assistant हूँ। Priyanshu Vishwakarma ने मुझे बनाया है। आज किस topic पर बात करेंगे?";
          } else if (msgLower.includes("किसने बनाया") || msgLower.includes("who made") || msgLower.includes("who created")) {
            aiResponse = "मुझे Priyanshu Vishwakarma ने बनाया है। वह मेरे creator हैं। क्या आप English practice करना चाहेंगे?";
          } else if (msgLower.includes("owner") || msgLower.includes("मालिक") || msgLower.includes("ओनर")) {
            aiResponse = "Priyanshu Vishwakarma मेरे creator और owner हैं। आज आप किस बारे में बात करना चाहेंगे?";
          } else if (msgLower.includes("हेलो") || msgLower.includes("hello") || msgLower.includes("नमस्ते") || msgLower.includes("hi")) {
            aiResponse = "नमस्ते! मैं आपकी English सीखने में मदद करूंगी। आज क्या बात करना चाहेंगे?";
          } else if (msgLower.includes("कौन") || msgLower.includes("who")) {
            aiResponse = "मैं Priyanshu Vishwakarma की बनाई हुई English tutor हूँ। किस बारे में बात करना पसंद करेंगे?";
          } else if (msgLower.includes("क्या कर")) {
            aiResponse = "मैं आपकी English practice में मदद कर रही हूँ। आज कौन सा topic choose करेंगे?";
          } else {
            aiResponse = "बहुत अच्छा! आज आप किस topic पर conversation practice करना चाहेंगे?";
          }
          console.log('✅ Fallback used:', aiResponse);
        }
      } else {
        // Check for wrong identity in English too
        const hasWrongIdentity = aiResponse.toLowerCase().includes('compound') || 
                                 aiResponse.toLowerCase().includes('groq');
        
        if (hasWrongIdentity) {
          const msgLower = message.toLowerCase();
          if (msgLower.includes("name")) {
            aiResponse = "I'm an English practice assistant created by Priyanshu Vishwakarma. What topic would you like to discuss?";
          } else if (msgLower.includes("who made") || msgLower.includes("who created")) {
            aiResponse = "I was created by Priyanshu Vishwakarma. Shall we practice English?";
          } else if (msgLower.includes("owner")) {
            aiResponse = "Priyanshu Vishwakarma is my creator and owner. What would you like to talk about today?";
          }
        }
      }

    } catch (err) {
      console.error("❌ Groq error:", err.message);
      const msg = message.toLowerCase();
      
      if (aiResponseLanguage === 'hi') {
        if (msg.includes("नाम") || msg.includes("name")) {
          aiResponse = "मैं English practice assistant हूँ। Priyanshu Vishwakarma ने मुझे बनाया है।";
        } else if (msg.includes("किसने बनाया") || msg.includes("who made") || msg.includes("who created")) {
          aiResponse = "मुझे Priyanshu Vishwakarma ने बनाया है।";
        } else if (msg.includes("owner") || msg.includes("मालिक") || msg.includes("ओनर")) {
          aiResponse = "Priyanshu Vishwakarma मेरे creator और owner हैं।";
        } else if (msg.includes("हेलो") || msg.includes("hello") || msg.includes("नमस्ते")) {
          aiResponse = "नमस्ते! आप कैसे हैं?";
        } else {
          aiResponse = "बहुत अच्छा! किस बारे में बात करेंगे?";
        }
      } else {
        if (msg.includes("name")) aiResponse = "I'm an English practice assistant by Priyanshu Vishwakarma.";
        else if (msg.includes("who made") || msg.includes("who created")) aiResponse = "I was created by Priyanshu Vishwakarma.";
        else if (msg.includes("owner")) aiResponse = "Priyanshu Vishwakarma is my creator and owner.";
        else if (msg.includes("hello") || msg.includes("hi")) aiResponse = "Hello! How are you?";
        else aiResponse = "Tell me more!";
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

    console.log('📤 Final response:', aiResponse);
    console.log('===== END REQUEST =====\n');
    
    res.json({
      message: "Message sent",
      aiResponse,
      hasCorrection,
      conversation,
    });
  } catch (error) {
    console.error("❌ Error:", error);
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
