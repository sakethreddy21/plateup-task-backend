import { Request, Response } from 'express';
import pool from '../config/db';
import { createGoogleCalendarEvent } from '../services/calenderEvent';

export const bookingSession = async (req: Request, res: Response) => {
    const { speakerId, date, time } = req.body;
    const userId = req.body.user.userId;

    try {
        // Normalize time format (e.g., '9:00' to '09:00')
        const formattedTime = time.padStart(5, '0');

        // Validate and parse the time value
        const [hour, minute] = formattedTime.split(':').map(Number);

        if (isNaN(hour) || isNaN(minute)) {
            return res.status(400).json({ error: 'Invalid time value' });
        }

        if (hour < 9 || hour >= 16) {
            return res.status(400).json({ error: 'Time slot must be between 9 AM and 4 PM.' });
        }

        // Check if the time slot is already booked
        const slot = await pool.query(
            'SELECT * FROM sessions WHERE speaker_id = $1 AND date = $2 AND time = $3',
            [speakerId, date, formattedTime]
        );

        if (slot.rows.length > 0) {
            return res.status(400).json({ error: 'This time slot is already booked.' });
        }

        // Book the session
        await pool.query(
            'INSERT INTO sessions (user_id, speaker_id, date, time) VALUES ($1, $2, $3, $4)',
            [userId, speakerId, date, formattedTime]
        );
        
        console.log('bookingSession route hit'); // Debug log
        
        const speaker = await pool.query('SELECT * FROM combined_users WHERE id = $1', [speakerId]);
        const user = await pool.query('SELECT * FROM combined_users WHERE id = $1', [userId]);
        const startTime = new Date(`${date}T${formattedTime}:00`);
        const endTime = new Date(startTime.getTime() + 60 * 60 * 1000); // Add 1 hour

        const event = await createGoogleCalendarEvent(
            'Session Booking',
            'Online Meeting',
            `Session booked with ${speaker.rows[0].name}.`,
            startTime,
            endTime,
            [user.rows[0].email, speaker.rows[0].email]
        );

        res.send({ message: 'Session booked successfully', event });
    } catch (err: any) {
        console.error(err.message);
        res.status(500).json({ error: 'Server error.' });
    }
}
