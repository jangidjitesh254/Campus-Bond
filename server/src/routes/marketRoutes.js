import { Router } from 'express';
import {
  createItem,
  getItems,
  getItemById,
  updateStatus,
  deleteItem,
  myListings,
} from '../controllers/marketController.js';
import { protect } from '../middleware/auth.js';
import { uploadImage } from '../middleware/upload.js';

const router = Router();
router.use(protect);

router.get('/me/listings', myListings);
router.route('/').get(getItems).post(uploadImage.single('image'), createItem);
router.route('/:id').get(getItemById).delete(deleteItem);
router.patch('/:id/status', updateStatus);

export default router;
