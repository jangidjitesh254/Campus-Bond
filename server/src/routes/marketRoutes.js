import { Router } from 'express';
import {
  createItem,
  getItems,
  getItemById,
  updateStatus,
  deleteItem,
  myListings,
} from '../controllers/marketController.js';
import { protect, optionalProtect } from '../middleware/auth.js';
import { uploadImage } from '../middleware/upload.js';

const router = Router();

// My listings requires authentication
router.get('/me/listings', protect, myListings);

// Browse all items is public (or attaches user if logged in), creating requires auth
router.route('/')
  .get(optionalProtect, getItems)
  .post(protect, uploadImage.single('image'), createItem);

// Viewing single item detail is public, deleting requires auth
router.route('/:id')
  .get(optionalProtect, getItemById)
  .delete(protect, deleteItem);

// Updating status requires auth
router.patch('/:id/status', protect, updateStatus);

export default router;

