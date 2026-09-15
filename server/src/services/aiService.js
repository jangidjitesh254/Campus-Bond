import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * Clean, direct ChatGPT-like system prompt:
 * Answers whatever question is asked without unsolicited website promotions or filler text.
 */
const SYSTEM_INSTRUCTION = `You are Campus Assistant, a smart, friendly, and helpful AI assistant and coding buddy for students.

CRITICAL LANGUAGE MATCHING RULE:
Always detect and match the exact language of the user's latest message!
1. IF THE USER WRITES IN ENGLISH (e.g. "i need a help", "how to center a div in css", "what is binary search?", "write an essay on pollution"):
   - You MUST reply ENTIRELY in clear, natural, friendly English.
   - Do NOT use Hindi or Hinglish words (do NOT say "Haan bhai", "Dekho", "kya help chahiye", etc.) when the user is writing in English!
2. IF THE USER WRITES IN HINGLISH / WHATSAPP HINDI (e.g. "bhai help chahiye", "kaise ho", "react me props kya hota h", "kch samjh nahi aa raha"):
   - Reply in natural, casual WhatsApp Hinglish using the Latin/English alphabet (a-z) only.
   - Use natural expressions: "Haan bhai!", "Bilkul", "Dekho", "Chalo milke solve karte hain", "Koi tension nahi".
3. IF THE USER WRITES IN HINDI DEVANAGARI (e.g. "नमस्ते", "मेरी मदद करो"):
   - Reply in Hindi using Devanagari script.

STRICT NO-EMOJI RULE:
- NEVER USE ANY EMOJIS! Absolutely zero emojis in your entire response (NO rockets, NO thumbs up, NO laptops, NO fire, NO bulbs, NO smiley faces, or any other emoji). Keep the response 100% text-based.

SCRIPT RULES:
- NEVER use Devanagari script unless the user explicitly wrote in Devanagari script.
- For English and Hinglish, write strictly in Latin/English alphabet (a-z, A-Z).

ANSWERING & CODING GUIDELINES:
1. Answer directly and concisely whatever the user asks (coding, debugging, homework, general questions).
2. Absolutely no unsolicited club ads, website marketing, or robotic canned responses.
3. For programming queries, always provide clean, readable code inside markdown code blocks with language tags (e.g. \`\`\`javascript, \`\`\`python, \`\`\`html, \`\`\`css).
4. Keep the tone helpful, encouraging, and easy to understand without any emojis.`;

const sanitizeOutput = (text = '') => {
  if (!text) return '';
  return text
    .replace(/\p{Extended_Pictographic}/gu, '')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/ +([.,!?])/g, '$1')
    .trim();
};

const hasDevanagari = (text = '') => /[\u0900-\u097F]/.test(text);

/**
 * Normalizes history array into valid Groq / OpenAI messages format
 */
const formatOpenAIMessages = (query, history = []) => {
  const messages = [{ role: 'system', content: SYSTEM_INSTRUCTION }];

  for (const msg of history) {
    if (!msg || !msg.text || typeof msg.text !== 'string' || !msg.text.trim()) continue;
    const role = msg.sender === 'user' || msg.role === 'user' ? 'user' : 'assistant';
    messages.push({ role, content: msg.text.trim() });
  }

  messages.push({ role: 'user', content: query.trim() });
  return messages;
};

/**
 * Normalizes history array into valid Gemini chat contents
 */
const formatGeminiHistory = (history = []) => {
  const contents = [];
  let lastRole = null;

  for (const msg of history) {
    if (!msg || !msg.text || typeof msg.text !== 'string' || !msg.text.trim()) continue;

    const role = msg.sender === 'user' || msg.role === 'user' ? 'user' : 'model';
    const text = msg.text.trim();

    if (role === lastRole && contents.length > 0) {
      contents[contents.length - 1].parts[0].text += `\n\n${text}`;
    } else {
      contents.push({
        role,
        parts: [{ text }],
      });
      lastRole = role;
    }
  }

  while (contents.length > 0 && contents[0].role !== 'user') {
    contents.shift();
  }
  while (contents.length > 0 && contents[contents.length - 1].role !== 'model') {
    contents.pop();
  }

  return contents;
};

/**
 * Call Groq API (Ultra-fast LPU inference, <1 second response time)
 */
const callGroq = async (query, history) => {
  const groqKey = process.env.GROQ_API_KEY?.trim();
  if (!groqKey) return null;

  const models = [
    process.env.GROQ_MODEL?.trim() || 'openai/gpt-oss-120b',
    'qwen/qwen3.8-27b',
    'openai/gpt-oss-20b',
  ].filter((m, idx, arr) => arr.indexOf(m) === idx);

  const messages = formatOpenAIMessages(query, history);

  for (const model of models) {
    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${groqKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: 0.7,
          max_tokens: 2048,
        }),
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        console.warn(`[Groq] Model ${model} returned ${response.status}:`, errJson?.error?.message);
        continue;
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
      if (content && content.trim()) {
        return { success: true, answer: sanitizeOutput(content.trim()), provider: 'groq', model };
      }
    } catch (err) {
      console.warn(`[Groq] Error calling model ${model}:`, err.message);
    }
  }

  return null;
};

/**
 * Call Google Gemini API
 */
const callGemini = async (query, history) => {
  const geminiKey = process.env.GEMINI_API_KEY?.trim();
  if (!geminiKey) return null;

  const models = [
    process.env.GEMINI_MODEL?.trim() || 'gemini-3.6-flash',
    'gemini-2.5-flash',
  ].filter((m, idx, arr) => arr.indexOf(m) === idx);

  const genAI = new GoogleGenerativeAI(geminiKey);
  const validHistory = formatGeminiHistory(history);

  for (const modelName of models) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        systemInstruction: SYSTEM_INSTRUCTION,
      });

      if (validHistory.length > 0) {
        const chat = model.startChat({
          history: validHistory,
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 2048,
          },
        });
        const result = await chat.sendMessage(query);
        const text = result.response.text();
        if (text && text.trim()) {
          return { success: true, answer: sanitizeOutput(text.trim()), provider: 'gemini', model: modelName };
        }
      } else {
        const result = await model.generateContent({
          contents: [{ role: 'user', parts: [{ text: query }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 2048,
          },
        });
        const text = result.response.text();
        if (text && text.trim()) {
          return { success: true, answer: sanitizeOutput(text.trim()), provider: 'gemini', model: modelName };
        }
      }
    } catch (err) {
      console.warn(`[Gemini] Model ${modelName} failed:`, err.message);
    }
  }

  return null;
};

/**
 * Main AI Generator:
 * Tries Groq (blazing fast LPU) first, then falls back to Gemini.
 */
export const generateAIResponse = async ({
  query,
  userName = 'Student',
  history = [],
}) => {
  // 1. Try Groq (ultra-fast)
  if (process.env.GROQ_API_KEY?.trim()) {
    const groqResult = await callGroq(query, history);
    if (groqResult) return groqResult;
  }

  // 2. Fallback to Gemini
  if (process.env.GEMINI_API_KEY?.trim()) {
    const geminiResult = await callGemini(query, history);
    if (geminiResult) return geminiResult;
  }

  // If no working key or all failed
  return {
    success: false,
    reason: 'NO_API_KEY',
    answer:
      `To get instant answers to any question just like ChatGPT, please check your **GROQ_API_KEY** or **GEMINI_API_KEY** in \`server/.env\`.`,
  };
};
