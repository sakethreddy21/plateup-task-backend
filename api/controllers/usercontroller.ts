import { Request, Response } from 'express';
import pool from '../config/db';
import { createGoogleCalendarEvent } from '../services/calenderEvent';

export const bookingSession = async (req: Request, res: Response) => {
    const { speakerId, date, time } = req.body;
    const userId = req.body.user?.userId;

    try {
        // Check if the speaker exists
        const speakerCheck = await pool.query('SELECT * FROM combined_users WHERE id = $1 AND user_type = $2', [speakerId, 'speaker']);
        if (speakerCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Speaker not found' });
        }

        // Normalize and validate the time format
        const formattedTime = time.padStart(5, '0');
        const [hour, minute] = formattedTime.split(':').map(Number);

        if (isNaN(hour) || isNaN(minute)) {
            return res.status(400).json({ error: 'Invalid time value' });
        }

        if (hour < 9 || hour >= 16) {
            return res.status(400).json({ error: 'Time slot must be between 9 AM and 4 PM.' });
        }

        // Calculate the start and end times for the requested booking
        const startTime = new Date(`${date}T${formattedTime}:00+05:30`);
        const endTime = new Date(startTime.getTime() + 60 * 60 * 1000); // 1 hour later

        // Check for overlapping sessions (including partial overlaps)
        const overlappingSlots = await pool.query(
            `SELECT * FROM sessions 
             WHERE speaker_id = $1 
             AND date = $2 
             AND (
                 (time >= $3 AND time < $4)  -- Existing session starts during the requested session
                 OR
                 ($3 >= time AND $3 < (time + interval '1 hour'))  -- Requested session starts during an existing session
             )`,
            [speakerId, date, formattedTime, `${(hour + 1).toString().padStart(2, '0')}:${minute}`]
        );

        if (overlappingSlots.rows.length > 0) {
            return res.status(400).json({ error: 'This time slot overlaps with an existing session.' });
        }

        // Create Google Calendar event
        const speaker = speakerCheck.rows[0];
        const user = await pool.query('SELECT * FROM combined_users WHERE id = $1', [userId]);

        const event = await createGoogleCalendarEvent(
            'Session Booking',
            'Online Meeting',
            `Session booked with ${speaker.name}.`,
            startTime,
            endTime,
            [user.rows[0].email, speaker.email]
        );

        // Book the session only if the calendar event creation is successful
        if (event) {
            await pool.query(
                'INSERT INTO sessions (user_id, speaker_id, date, time) VALUES ($1, $2, $3, $4)',
                [userId, speakerId, date, formattedTime]
            );

            return res.send({ message: 'Session booked successfully', event });
        } else {
            return res.status(500).json({ error: 'Failed to create Google Calendar event.' });
        }
    } catch (err: any) {
        console.error(err.message);
        res.status(500).json({ error: 'Server error.' });
    }
}
