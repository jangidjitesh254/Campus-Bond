import { Router } from 'express';
import {
  getMatchedEvents,
  getMatchedTeammates,
  searchSkillMatches,
  extractSkillsFromText,
} from '../controllers/skillMatchController.js';
import { protect } from '../middleware/auth.js';

const router = Router();

// All skill matching routes require logged-in student authentication
router.use(protect);

router.get('/events', getMatchedEvents);
router.get('/teammates', getMatchedTeammates);
router.post('/query', searchSkillMatches);
router.post('/extract', extractSkillsFromText);

export default router;
