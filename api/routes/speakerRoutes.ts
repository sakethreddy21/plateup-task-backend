import { Router } from 'express';
import { setupSpeakerProfile } from '../controllers/speakerController';
import { authMiddleware, roleMiddleware } from '../middlewares/authMiddleware';
const router = Router();

// Setup Speaker Profile Route (Protected Route)
router.post('/setup-profile', authMiddleware, roleMiddleware(['speaker']), setupSpeakerProfile);

export default router;
