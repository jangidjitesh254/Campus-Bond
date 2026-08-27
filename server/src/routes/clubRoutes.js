import { Router } from 'express';
import {
  createClub,
  getClubs,
  getClubById,
  requestJoin,
  reviewRequest,
  leaveClub,
  deleteClub,
  myClubs,
} from '../controllers/clubController.js';
import { protect } from '../middleware/auth.js';
import { uploadImage } from '../middleware/upload.js';

const router = Router();
router.use(protect);

router.get('/me/joined', myClubs);
router.route('/').get(getClubs).post(uploadImage.single('image'), createClub);
router.route('/:id').get(getClubById).delete(deleteClub);
router.post('/:id/request', requestJoin);
router.patch('/:id/requests/:userId', reviewRequest);
router.post('/:id/leave', leaveClub);

export default router;
