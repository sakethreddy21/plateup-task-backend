import { Router } from 'express';
import { listSpeakers } from '../controllers/speakerController';

const      router = Router();

// Public Route to List All Speakers
router.get('/speakers', listSpeakers);



export default router;
