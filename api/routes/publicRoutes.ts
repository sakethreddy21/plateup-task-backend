import express from 'express';
import { listSpeakers } from '../controllers/speakerController';
const router = express.Router();
// Public Route to List All Speakers
router.get('/speakers', listSpeakers);



export default router;
