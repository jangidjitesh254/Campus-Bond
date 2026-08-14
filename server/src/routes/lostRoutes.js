import { Router } from 'express';
import {
  createLostItem,
  getLostItems,
  getLostItemById,
  updateLostStatus,
  deleteLostItem,
  myLostItems,
} from '../controllers/lostController.js';
import { protect } from '../middleware/auth.js';
import { uploadImage } from '../middleware/upload.js';

const router = Router();

router.use(protect);

router.get('/me/posts', myLostItems);

router.route('/').get(getLostItems).post(uploadImage.single('image'), createLostItem);

router.route('/:id').get(getLostItemById).delete(deleteLostItem);
router.patch('/:id/status', updateLostStatus);

export default router;
