import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * Normalizes and categorizes common technical and creative skills
 * into canonical forms for consistent matching.
 */
const SKILL_SYNONYMS = {
  // Web & Frontend
  react: 'React',
  reactjs: 'React',
  'react.js': 'React',
  nextjs: 'Next.js',
  'next.js': 'Next.js',
  vue: 'Vue.js',
  vuejs: 'Vue.js',
  angular: 'Angular',
  tailwind: 'Tailwind CSS',
  tailwindcss: 'Tailwind CSS',
  html: 'HTML5',
  html5: 'HTML5',
  css: 'CSS3',
  css3: 'CSS3',
  javascript: 'JavaScript',
  js: 'JavaScript',
  typescript: 'TypeScript',
  ts: 'TypeScript',
  threejs: 'Three.js',
  'three.js': 'Three.js',
  webgl: 'WebGL',

  // Backend & Databases
  node: 'Node.js',
  nodejs: 'Node.js',
  'node.js': 'Node.js',
  express: 'Express',
  expressjs: 'Express',
  fastapi: 'FastAPI',
  flask: 'Flask',
  django: 'Django',
  python: 'Python',
  py: 'Python',
  java: 'Java',
  'c++': 'C++',
  cpp: 'C++',
  c: 'C',
  golang: 'Go',
  go: 'Go',
  rust: 'Rust',
  mongodb: 'MongoDB',
  mongo: 'MongoDB',
  sql: 'SQL',
  postgresql: 'PostgreSQL',
  postgres: 'PostgreSQL',
  mysql: 'MySQL',
  firebase: 'Firebase',

  // AI & Data Science
  ai: 'AI/ML',
  ml: 'AI/ML',
  'ai/ml': 'AI/ML',
  'machine learning': 'AI/ML',
  'deep learning': 'Deep Learning',
  pytorch: 'PyTorch',
  tensorflow: 'TensorFlow',
  tf: 'TensorFlow',
  opencv: 'Computer Vision',
  'computer vision': 'Computer Vision',
  nlp: 'NLP',
  langchain: 'LangChain',
  llm: 'LLMs',
  pandas: 'Data Science',
  numpy: 'Data Science',

  // Mobile
  flutter: 'Flutter',
  'react native': 'React Native',
  reactnative: 'React Native',
  android: 'Android Dev',
  swift: 'iOS / Swift',
  ios: 'iOS / Swift',

  // Design & Media
  figma: 'Figma',
  'ui/ux': 'UI/UX Design',
  ui: 'UI/UX Design',
  ux: 'UI/UX Design',
  'graphic design': 'Graphic Design',
  photoshop: 'Adobe Photoshop',
  illustrator: 'Adobe Illustrator',
  premiere: 'Video Editing',
  'video editing': 'Video Editing',
  davinci: 'Video Editing',
  photography: 'Photography',

  // Hardware, Robotics & Core Engineering
  arduino: 'Arduino',
  esp32: 'ESP32 / Embedded',
  iot: 'IoT',
  ros: 'ROS (Robotics)',
  robotics: 'Robotics',
  fusion360: 'Fusion 360',
  solidworks: 'SolidWorks',
  matlab: 'MATLAB',
  simulink: 'Simulink',
  altium: 'Altium PCB',
  pcb: 'PCB Design',
  'embedded systems': 'Embedded Systems',

  // Web3 & Security
  solidity: 'Solidity / Web3',
  web3: 'Web3',
  blockchain: 'Blockchain',
  cybersecurity: 'CyberSecurity',
  ctf: 'CTF / Security',
  cryptography: 'Cryptography',
};

/**
 * Standardizes a skill string to its canonical name
 */
export const normalizeSkill = (skill = '') => {
  if (!skill || typeof skill !== 'string') return '';
  const cleaned = skill.trim().toLowerCase().replace(/[-_.]+/g, ' ').replace(/\s+/g, ' ');
  const rawClean = skill.trim().toLowerCase();

  return (
    SKILL_SYNONYMS[rawClean] ||
    SKILL_SYNONYMS[cleaned] ||
    skill.trim().charAt(0).toUpperCase() + skill.trim().slice(1)
  );
};

/**
 * Check if two skill names match or are related
 */
export const isSkillMatch = (skillA = '', skillB = '') => {
  const normA = normalizeSkill(skillA).toLowerCase();
  const normB = normalizeSkill(skillB).toLowerCase();

  if (normA === normB) return true;
  if (normA.includes(normB) || normB.includes(normA)) return true;

  // Substring checks
  const wordsA = normA.split(/\s+/);
  const wordsB = normB.split(/\s+/);
  return wordsA.some((w) => w.length > 2 && wordsB.includes(w));
};

/**
 * Calculate deterministic match score & skill breakdown between a user and required skills.
 */
export const calculateMatchScore = (userSkills = [], targetSkills = []) => {
  if (!targetSkills || targetSkills.length === 0) {
    return {
      matchPercentage: 100,
      matchedSkills: userSkills,
      missingSkills: [],
      score: 1.0,
      fitLevel: 'high',
    };
  }

  const normalizedUser = (userSkills || []).map(normalizeSkill);
  const normalizedTarget = targetSkills.map(normalizeSkill);

  const matched = [];
  const missing = [];

  for (const req of normalizedTarget) {
    const isFound = normalizedUser.some((u) => isSkillMatch(u, req));
    if (isFound) {
      matched.push(req);
    } else {
      missing.push(req);
    }
  }

  const ratio = matched.length / normalizedTarget.length;
  const extraSkillsCount = Math.max(0, normalizedUser.length - matched.length);
  const bonus = Math.min(15, extraSkillsCount * 3);

  const matchPercentage = Math.min(
    100,
    Math.round(ratio * 85 + (matched.length > 0 ? 15 : 0) + bonus)
  );

  let fitLevel = 'low';
  if (matchPercentage >= 75) fitLevel = 'high';
  else if (matchPercentage >= 40) fitLevel = 'medium';

  return {
    matchPercentage,
    matchedSkills: matched,
    missingSkills: missing,
    score: matchPercentage / 100,
    fitLevel,
  };
};

/**
 * Call Groq / Gemini to enrich match with an intelligent AI explanation.
 */
export const generateMatchExplanation = async ({
  user,
  event,
  matchedSkills = [],
  missingSkills = [],
  matchPercentage = 80,
}) => {
  const prompt = `You are Campus Bond AI Matchmaker.
Student Name: ${user.name || 'Student'}
Branch: ${user.branch || 'Engineering'}, Semester: ${user.semester || 4}
Student Skills: ${(user.skills || []).join(', ') || 'General Engineering'}
Project Title: "${event.title}"
Project Description: "${event.description || ''}"
Required Skills: ${(event.skillsNeeded || []).join(', ')}
Matched Skills: ${matchedSkills.join(', ')}
Missing Skills: ${missingSkills.join(', ')}
Calculated Match: ${matchPercentage}%

Provide a concise 2-sentence explanation of why this student is a great fit for this project, and suggest their optimal team role.
Keep the tone encouraging, authentic, and collegiate. Do NOT use emojis.
Output strictly JSON:
{
  "explanation": "...",
  "suggestedRole": "..."
}`;

  try {
    const groqKey = process.env.GROQ_API_KEY?.trim();
    if (groqKey) {
      const resp = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${groqKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: process.env.GROQ_MODEL?.trim() || 'openai/gpt-oss-120b',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.4,
          max_tokens: 300,
          response_format: { type: 'json_object' },
        }),
      });

      if (resp.ok) {
        const data = await resp.json();
        const content = data.choices?.[0]?.message?.content;
        if (content) {
          const parsed = JSON.parse(content);
          return {
            explanation: parsed.explanation?.replace(/\p{Extended_Pictographic}/gu, '').trim(),
            suggestedRole: parsed.suggestedRole?.replace(/\p{Extended_Pictographic}/gu, '').trim(),
          };
        }
      }
    }

    const geminiKey = process.env.GEMINI_API_KEY?.trim();
    if (geminiKey) {
      const genAI = new GoogleGenerativeAI(geminiKey);
      const model = genAI.getGenerativeModel({
        model: process.env.GEMINI_MODEL?.trim() || 'gemini-3.6-flash',
      });
      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
      });
      const text = result.response.text();
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          explanation: parsed.explanation?.replace(/\p{Extended_Pictographic}/gu, '').trim(),
          suggestedRole: parsed.suggestedRole?.replace(/\p{Extended_Pictographic}/gu, '').trim(),
        };
      }
    }
  } catch (err) {
    // Silently fall back to heuristic generator
  }

  // Robust Heuristic Fallback
  let explanation = '';
  let suggestedRole = 'Core Contributor';

  if (matchedSkills.length > 0) {
    explanation = `Your proficiency in ${matchedSkills.slice(0, 3).join(' and ')} directly fulfills the key technical needs for this post. You can drive the technical deliverables while picking up ${missingSkills[0] || 'complementary team skills'}.`;
    suggestedRole = `${matchedSkills[0]} Specialist`;
  } else {
    explanation = `While your direct stack differs slightly, your background in ${user.branch || 'engineering'} provides strong problem-solving synergy to contribute towards this project.`;
    suggestedRole = 'Project Associate';
  }

  return { explanation, suggestedRole };
};

/**
 * AI Skill Extractor:
 * Analyzes arbitrary text (student resume snippet, bio, project history)
 * and returns standardized skill tags.
 */
export const extractSkillsFromTextWithAI = async (text = '') => {
  if (!text || !text.trim()) return [];

  const prompt = `You are a technical recruiter and skills analyzer for university students.
Extract all key technical, programming, design, and domain skills from the following text into a clean JSON array of strings.
Format each skill in title/canonical case (e.g. "React", "Python", "UI/UX Design", "Machine Learning", "Arduino", "Tailwind CSS", "Solidity").
Do not include generic fluff like "hardworking", "punctual", or emojis. Limit to top 15 most relevant skills.

Input text:
"""
${text.slice(0, 3000)}
"""

Output strictly JSON:
{
  "skills": ["Skill1", "Skill2", ...]
}`;

  try {
    const groqKey = process.env.GROQ_API_KEY?.trim();
    if (groqKey) {
      const resp = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${groqKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: process.env.GROQ_MODEL?.trim() || 'openai/gpt-oss-120b',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.2,
          max_tokens: 400,
          response_format: { type: 'json_object' },
        }),
      });

      if (resp.ok) {
        const data = await resp.json();
        const content = data.choices?.[0]?.message?.content;
        if (content) {
          const parsed = JSON.parse(content);
          if (Array.isArray(parsed.skills)) {
            return parsed.skills.map(normalizeSkill).filter(Boolean);
          }
        }
      }
    }

    const geminiKey = process.env.GEMINI_API_KEY?.trim();
    if (geminiKey) {
      const genAI = new GoogleGenerativeAI(geminiKey);
      const model = genAI.getGenerativeModel({
        model: process.env.GEMINI_MODEL?.trim() || 'gemini-3.6-flash',
      });
      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
      });
      const textResult = result.response.text();
      const jsonMatch = textResult.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (Array.isArray(parsed.skills)) {
          return parsed.skills.map(normalizeSkill).filter(Boolean);
        }
      }
    }
  } catch (err) {
    // Fall back to dictionary matching
  }

  // Dictionary keyword extraction fallback
  const found = new Set();
  const lower = text.toLowerCase();
  for (const [key, val] of Object.entries(SKILL_SYNONYMS)) {
    const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(^|[^a-zA-Z0-9])${escaped}([^a-zA-Z0-9]|$)`, 'i');
    if (regex.test(lower)) {
      found.add(val);
    }
  }

  return Array.from(found);
};

/**
 * Freeform Natural Language Query Parser:
 * e.g. "I need a 3rd year frontend dev who knows Three.js and Tailwind for NASA Space Apps"
 */
export const parseFreeformMatchQuery = async (query = '') => {
  if (!query || !query.trim()) {
    return { targetType: 'students', skills: [], intent: 'find_teammates' };
  }

  const prompt = `Analyze this college student collaboration request:
"${query}"

Extract:
1. "targetType": either "students" (if looking for teammates/collaborators) or "projects" (if student wants to find a project/hackathon to join).
2. "skills": array of technical/domain skills mentioned or strongly implied.
3. "intent": brief 1-sentence summary of what is needed.
4. "branchPreference": optional branch if mentioned (e.g. "CSE", "ECE", "Design", or null).
5. "category": one of ["hackathon", "cultural", "competition", "project", "all"].

Output strictly JSON:
{
  "targetType": "students",
  "skills": ["..."],
  "intent": "...",
  "branchPreference": null,
  "category": "all"
}`;

  try {
    const groqKey = process.env.GROQ_API_KEY?.trim();
    if (groqKey) {
      const resp = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${groqKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: process.env.GROQ_MODEL?.trim() || 'openai/gpt-oss-120b',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.2,
          max_tokens: 300,
          response_format: { type: 'json_object' },
        }),
      });

      if (resp.ok) {
        const data = await resp.json();
        const content = data.choices?.[0]?.message?.content;
        if (content) return JSON.parse(content);
      }
    }
  } catch (err) {
    // Fall back to rule-based parser
  }

  // Fallback parser
  const extractedSkills = await extractSkillsFromTextWithAI(query);
  const isLookingForProject =
    /join|participate|find project|find hackathon|looking for team/i.test(query) &&
    !/need|looking for developer|hire|seeking|teammate/i.test(query);

  return {
    targetType: isLookingForProject ? 'projects' : 'students',
    skills: extractedSkills,
    intent: query.trim(),
    branchPreference: null,
    category: 'all',
  };
};
