
const Router = require('express');
const { bookingSession } = require('../controllers/userController');
const { authMiddleware, roleMiddleware } = require('../middlewares/authMiddleware')
const google = require('googleapis').google;
const router = Router();


const SCOPES = ['https://www.googleapis.com/auth/calendar'];
const oauth2Client = new google.auth.OAuth2(
    process.env.CLIENT_ID,
    process.env.CLIENT_SECRET,
    process.env.REDIRECT_URI
)
// Setup Speaker Profile Route (Protected Route)
router.post('/book-session', authMiddleware, roleMiddleware(['user']), bookingSession);



export default router;
