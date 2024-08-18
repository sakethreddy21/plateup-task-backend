

import { Request, Response } from 'express';

const bcrypt = require('bcrypt');

const { formatISO } = require('date-fns');
const pool = require('../config/db');
const generateOtp = require('../utils/generateOtp');
const jwt = require('jsonwebtoken');

const requests = {
    signup: async (req: Request, res: Response) => {
        const { firstName, lastName, email, password, userType } = req.body;

        try {
            const userExists = await pool.query('SELECT * FROM combined_users WHERE email = $1', [email]);
            if (userExists.rows.length) {
                return res.status(400).json({ error: 'Email already in use.' });
            }

            const hashedPassword = await bcrypt.hash(password, 10);

            const newUser = await pool.query(
                'INSERT INTO combined_users (first_name, last_name, email, password, user_type, is_verified) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
                [firstName, lastName, email, hashedPassword, userType, false]
            );

            const otp = generateOtp();

            const expiresAt = formatISO(new Date(Date.now() + 10 * 60 * 1000));

            await pool.query(
                'INSERT INTO otps (user_id, otp, expires_at) VALUES ($1, $2, $3)',
                [newUser.rows[0].id, otp, expiresAt]
            );

            return res.status(201).json({ message: `${userType} registered successfully. Please verify your OTP.`});
        } catch (err: any) {
            console.error(err.message);
            return res.status(500).json({ error: 'Server error.' });
        }
    },

    verifyOtp: async (req: Request, res: Response) => {
        console.log('verifyOtp route hit'); // Debug log

        const { email, otp } = req.body;

        try {
            const user = await pool.query('SELECT * FROM combined_users WHERE email = $1', [email]);
            if (!user.rows.length) {
                return res.status(400).json({ error: 'User not found.' });
            }

            const storedOtp = await pool.query('SELECT * FROM otps WHERE user_id = $1 AND otp = $2', [user.rows[0].id, otp]);
            if (!storedOtp.rows.length) {
                return res.status(400).json({ error: 'Invalid OTP.' });
            }

            const currentTime = new Date().toISOString();

            if (storedOtp.rows[0].expires_at < currentTime) {
                return res.status(400).json({ error: 'OTP has expired.' });
            }

            await pool.query('UPDATE combined_users SET is_verified = $1 WHERE id = $2', [true, user.rows[0].id]);

            await pool.query('DELETE FROM otps WHERE user_id = $1', [user.rows[0].id]);

            return res.status(200).json({ message: 'OTP verified successfully. Your account is now verified.' });
        } catch (err: any) {
            console.error(err.message);
            return res.status(500).json({ error: 'Server error.' });
        }
    },

    login: async (req: Request, res: Response) => {
        const { email, password } = req.body;

        try {
            const user = await pool.query('SELECT * FROM combined_users WHERE email = $1', [email]);
            if (!user.rows.length) {
                return res.status(400).json({ error: 'Invalid credentials.' });
            }

            const isMatch = await bcrypt.compare(password, user.rows[0].password);
            if (!isMatch) {
                return res.status(400).json({ error: 'Invalid credentials.' });
            }

            if (!user.rows[0].is_verified) {
                return res.status(400).json({ error: 'Account not verified.' });
            }

            const token = jwt.sign(
                { userId: user.rows[0].id, userType: user.rows[0].user_type },
                process.env.JWT_SECRET as string,
                { expiresIn: '1h' }
            );

            return res.status(200).json({ token });
        } catch (err: any) {
            console.error(err.message);
            return res.status(500).json({ error: 'Server error.' });
        }
    },

    getOtp: async (req: Request, res: Response) => {
        const { email } = req.query;

        try {
            const user = await pool.query('SELECT * FROM combined_users WHERE email = $1', [email]);
            if (!user.rows.length) {
                return res.status(400).json({ error: 'User not found.' });
            }

            const otpRecord = await pool.query('SELECT * FROM otps WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1', [user.rows[0].id]);
            if (!otpRecord.rows.length) {
                return res.status(404).json({ error: 'OTP not found.' });
            }

            return res.status(200).json({ otp: otpRecord.rows[0].otp });
        } catch (err: any) {
            console.error(err.message);
            return res.status(500).json({ error: 'Server error.' });
        }
    },

    getData: async (req: Request, res: Response) => {
        try {
            const data = await pool.query('SELECT * FROM combined_users');
            return res.status(200).json(data.rows);
        } catch (err: any) {
            console.error(err.message);
            return res.status(500).json({ error: 'Server error.' });
        }
    }
};

module.exports = requests;
