import { Router } from 'express';
import {
  openConversation,
  getConversations,
  getMessages,
  sendMessage,
} from '../controllers/chatController.js';
import { protect } from '../middleware/auth.js';

const router = Router();
router.use(protect);

router.post('/open', openConversation);
router.get('/conversations', getConversations);
router.get('/conversations/:id/messages', getMessages);
router.post('/conversations/:id/messages', sendMessage);

export default router;
