import { Router } from 'express';
import { myScore, userScore, leaderboard, rules } from '../controllers/scoreController.js';
import { protect } from '../middleware/auth.js';

const router = Router();
router.use(protect);

router.get('/me', myScore);
router.get('/leaderboard', leaderboard);
router.get('/rules', rules);
router.get('/user/:id', userScore);

export default router;
