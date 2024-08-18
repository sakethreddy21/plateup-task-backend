import { Router } from 'express';
import { google } from 'googleapis';
import dotenv from 'dotenv';

dotenv.config();

export const googlerouter = Router();


const oauth2Client = new google.auth.OAuth2(
    process.env.CLIENT_ID,
    process.env.CLIENT_SECRET,
    process.env.REDIRECT_URI
);

const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
const SCOPES = ['https://www.googleapis.com/auth/calendar'];

// Route to start OAuth2 flow
googlerouter.get('/google', (req, res) => {
    const authUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES,
    });
    res.redirect(authUrl);
});

// Route for OAuth2 redirect
googlerouter.get('/google/redirect', async (req, res) => {
    try {
        const code = req.query.code as string;
        const { tokens } = await oauth2Client.getToken(code);
        oauth2Client.setCredentials(tokens);
        res.send({ message: 'Successfully connected to Google Calendar API.' });
    } catch (error) {
        console.error('Error during OAuth2 callback:', error);
        res.status(500).send({ error: 'Failed to authenticate with Google.' });
    }
});

// Route to schedule an event
export const createGoogleCalendarEvent = async (summary: string, location: string, description: string, startTime: Date, endTime: Date, attendees: string[]) => {
    const event = {
        summary,
        location,
        description,
        start: {
            dateTime: startTime.toISOString(),
            timeZone: 'Asia/Kolkata',
        },
        end: {
            dateTime: endTime.toISOString(),
            timeZone: 'Asia/Kolkata',
        },
        attendees: attendees.map(email => ({ email })),
        reminders: {
            useDefault: false,
            overrides: [
                { method: 'email', minutes: 24 * 60 }, // 24 hours before
                { method: 'popup', minutes: 10 }, // 10 minutes before
            ],
        },
    };

    const response = await calendar.events.insert({
        calendarId: 'primary',
        auth: oauth2Client,
        requestBody: event,
    });

    return response.data;
};