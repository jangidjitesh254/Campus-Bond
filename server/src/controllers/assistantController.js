import { generateAIResponse } from '../services/aiService.js';

/**
 * Handle student query - pure direct AI assistant just like ChatGPT.
 * No unsolicited club/marketplace promotions or extra boilerplate.
 */
export const handleAssistantQuery = async (req, res) => {
  try {
    const { query, userName, history = [] } = req.body;
    if (!query || typeof query !== 'string' || !query.trim()) {
      return res.status(400).json({ message: 'Query text is required' });
    }

    const rawName = userName && userName !== 'Student' 
      ? userName 
      : (req.user?.name ? req.user.name.split(' ')[0] : 'Student');
    const studentName = rawName.trim();

    const aiResponse = await generateAIResponse({
      query: query.trim(),
      userName: studentName,
      history,
    });

    return res.json({
      answer: aiResponse.answer,
    });
  } catch (error) {
    console.error('Error in assistantController:', error);
    return res.status(500).json({
      message: 'Failed to process assistant query',
      error: error.message,
    });
  }
};
