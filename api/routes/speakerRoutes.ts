
const { authMiddleware, roleMiddleware } = require('../middlewares/authMiddleware')
const { Router } = require('express');
const { setupSpeakerProfile } = require('../controllers/speakerController');
const router = Router();

// Setup Speaker Profile Route (Protected Route)
router.post('/setup-profile', authMiddleware, roleMiddleware(['speaker']), setupSpeakerProfile);

export default router;
