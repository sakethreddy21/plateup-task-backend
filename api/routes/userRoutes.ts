
import express from 'express';
import { bookingSession } from '../controllers/usercontroller';
import { authMiddleware, roleMiddleware } from '../middlewares/authMiddleware';
import { google } from 'googleapis';
const router = express.Router();

const SCOPES = ['https://www.googleapis.com/auth/calendar'];
const oauth2Client = new google.auth.OAuth2(
    process.env.CLIENT_ID,
    process.env.CLIENT_SECRET,
    process.env.REDIRECT_URI
)
// Setup Speaker Profile Route (Protected Route)
router.post('/book-session', authMiddleware, roleMiddleware(['user']), bookingSession);



export default router;
