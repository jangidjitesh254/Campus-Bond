import { Router } from 'express';
import {
  createResource,
  getResources,
  getResourceById,
  recordDownload,
  deleteResource,
  myUploads,
} from '../controllers/resourceController.js';
import { protect } from '../middleware/auth.js';
import { uploadDocument } from '../middleware/upload.js';

const router = Router();
router.use(protect);

router.get('/me/uploads', myUploads);
router.route('/').get(getResources).post(uploadDocument.single('file'), createResource);
router.route('/:id').get(getResourceById).delete(deleteResource);
router.post('/:id/download', recordDownload);

export default router;
