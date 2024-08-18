const {Router} = require('express');
const {listSpeakers} = require('../controllers/speakerController');
const router = Router();

// Public Route to List All Speakers
router.get('/speakers', listSpeakers);



export default router;
