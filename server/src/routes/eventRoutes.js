import { Router } from 'express';
import { body } from 'express-validator';
import {
  createEvent,
  getEvents,
  getEventById,
  applyToEvent,
  reviewApplicant,
  updateEventStatus,
  deleteEvent,
  myEvents,
  myApplications,
} from '../controllers/eventController.js';
import { protect } from '../middleware/auth.js';

const router = Router();

// Everything here requires a logged-in, verified student.
router.use(protect);

// "My" routes must come before "/:id" so they aren't captured as an id.
router.get('/me/created', myEvents);
router.get('/me/applications', myApplications);

router
  .route('/')
  .get(getEvents)
  .post(
    [
      body('title').trim().notEmpty().withMessage('Title is required.'),
      body('description').trim().notEmpty().withMessage('Description is required.'),
    ],
    createEvent
  );

router.route('/:id').get(getEventById).delete(deleteEvent);
router.post('/:id/apply', applyToEvent);
router.patch('/:id/status', updateEventStatus);
router.patch('/:id/applicants/:applicantId', reviewApplicant);

export default router;
