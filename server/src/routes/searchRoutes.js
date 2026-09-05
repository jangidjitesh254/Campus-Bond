import { Router } from 'express';
import { search } from '../controllers/searchController.js';
import { protect } from '../middleware/auth.js';

const router = Router();
router.get('/', protect, search);

export default router;
