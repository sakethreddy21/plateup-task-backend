import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { formatISO } from 'date-fns';
import jwt from 'jsonwebtoken';
import generateOtp from '../utils/generateOtp';
import pool from '../config/db';
import dotenv from 'dotenv';
dotenv.config();

// Utility functions for validation (reuse these from the signup controller)
const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

const validatePassword = (password: string) => {
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/;
    return passwordRegex.test(password);
};

// Controllers
const requests = {
    signup: async (req: Request, res: Response) => {
        // (Implementation as described previously)
    },

    // OTP verification controller with basic checks
    verifyOtp: async (req: Request, res: Response) => {
        const { email, otp } = req.body;

        // Validate email
        if (!validateEmail(email)) {
            res.status(400).json({ error: 'Invalid email format.' });
            return;
        }

        // Validate OTP (ensure it's a 6-digit number, adjust as per your OTP length)
        if (!/^\d{6}$/.test(otp)) {
            res.status(400).json({ error: 'Invalid OTP format. OTP should be a 6-digit number.' });
            return;
        }

        try {
            const user = await pool.query('SELECT * FROM combined_users WHERE email = $1', [email]);
            if (!user.rows.length) {
                res.status(400).json({ error: 'User not found.' });
                return;
            }

            const storedOtp = await pool.query('SELECT * FROM otps WHERE user_id = $1 AND otp = $2', [user.rows[0].id, otp]);
            if (!storedOtp.rows.length) {
                res.status(400).json({ error: 'Invalid OTP.' });
                return;
            }

            const currentTime = new Date().toISOString();

            if (storedOtp.rows[0].expires_at < currentTime) {
                res.status(400).json({ error: 'OTP has expired.' });
                return;
            }

            await pool.query('UPDATE combined_users SET is_verified = $1 WHERE id = $2', [true, user.rows[0].id]);
            await pool.query('DELETE FROM otps WHERE user_id = $1', [user.rows[0].id]);

            res.status(200).json({ message: 'OTP verified successfully. Your account is now verified.' });
        } catch (err: any) {
            console.error(err.message);
            res.status(500).json({ error: 'Server error.' });
        }
    },

    // Login controller with basic checks
    login: async (req: Request, res: Response) => {
        const { email, password } = req.body;

        // Validate email
        if (!validateEmail(email)) {
            res.status(400).json({ error: 'Invalid email format.' });
            return;
        }

        // Validate password
        if (!validatePassword(password)) {
            res.status(400).json({ error: 'Password must be at least 8 characters long, include one uppercase letter, one lowercase letter, and one number.' });
            return;
        }

        try {
            const user = await pool.query('SELECT * FROM combined_users WHERE email = $1', [email]);
            if (!user.rows.length) {
                res.status(400).json({ error: 'Invalid credentials.' });
                return;
            }

            const isMatch = await bcrypt.compare(password, user.rows[0].password);
            if (!isMatch) {
                res.status(400).json({ error: 'Invalid credentials.' });
                return;
            }

            if (!user.rows[0].is_verified) {
                res.status(400).json({ error: 'Account not verified.' });
                return;
            }

            const token = jwt.sign(
                { userId: user.rows[0].id, userType: user.rows[0].user_type },
                process.env.JWT_SECRET || 'defaultSecret',
                { expiresIn: '1h' }
            );

            res.status(200).json({ token });
        } catch (err: any) {
            console.error(err.message);
            res.status(500).json({ error: 'Server error.' });
        }
    },

    // Get OTP controller with basic checks
    getOtp: async (req: Request, res: Response) => {
        const { email } = req.query;

        // Validate email
        if (!email || !validateEmail(email as string)) {
            res.status(400).json({ error: 'Invalid email format.' });
            return;
        }

        try {
            const user = await pool.query('SELECT * FROM combined_users WHERE email = $1', [email]);
            if (!user.rows.length) {
                res.status(400).json({ error: 'User not found.' });
                return;
            }

            const otpRecord = await pool.query('SELECT * FROM otps WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1', [user.rows[0].id]);
            if (!otpRecord.rows.length) {
                res.status(404).json({ error: 'OTP not found.' });
                return;
            }

            res.status(200).json({ otp: otpRecord.rows[0].otp });
        } catch (err: any) {
            console.error(err.message);
            res.status(500).json({ error: 'Server error.' });
        }
    },

    // Get Data controller (no specific checks needed here, but you can implement pagination or filtering if required)
    getData: async (req: Request, res: Response) => {
        try {
            const data = await pool.query('SELECT * FROM combined_users');
            res.status(200).json(data.rows);
        } catch (err: any) {
            console.error(err.message);
            res.status(500).json({ error: 'Server error.' });
        }
    }
}

export default requests;
