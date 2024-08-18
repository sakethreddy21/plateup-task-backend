import { Request, Response } from 'express';

const pool = require('../config/db');


// Setup Speaker Profile Controller
export const setupSpeakerProfile = async (req: Request, res: Response) => {
    const { expertise, pricePerSession } = req.body;
    const userId = req.body.user.userId; // Assuming the userId is available in req.body.user after auth middleware

    try {
        // Check if the user already has a speaker profile
        const existingProfile = await pool.query('SELECT * FROM speakers WHERE user_id = $1', [userId]);
        if (existingProfile.rows.length) {
            return res.status(400).json({ error: 'Speaker profile already exists.' });
        }

        // Insert new speaker profile
        const newProfile = await pool.query(
            'INSERT INTO speakers (user_id, expertise, price_per_session) VALUES ($1, $2, $3) RETURNING *',
            [userId, expertise, pricePerSession]
        );

        res.status(201).json({ message: 'Speaker profile created successfully.', profile: newProfile.rows[0] });
    } catch (err: any) {
        console.error(err.message);
        res.status(500).json({ error: 'Server error.' });
    }
};


// List Speakers Controller
export const listSpeakers = async (req: Request, res: Response) => {
    try {
                // Get all speakers with their user details
        const speakers = await pool.query(`
        
            SELECT u.first_name, u.last_name, s.expertise, s.price_per_session
            FROM speakers s
            JOIN combined_users u ON s.user_id = u.id
        `);

        res.status(200).json({ speakers: speakers.rows });
    } catch (err: any) {
        console.error(err.message);
        res.status(500).json({ error: 'Server error.' });
    }
};


