

const Request = require('express').Request;
const Response = require('express').Response;
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db.js');
const dotenv = require('dotenv');
const generateOtp = require('../utils/generateOtp');

const { formatISO } = require("date-fns");

// Signup controller
const requests={
signup : async (req, res) => {
    const { firstName, lastName, email, password, userType } = req.body;

    try {
        const userExists = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (userExists.rows.length) {
            res.status(400).json({ error: 'Email already in use.' });
            return;
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = await pool.query(
            'INSERT INTO users (first_name, last_name, email, password, user_type, is_verified) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
            [firstName, lastName, email, hashedPassword, userType, false]
        );

        const otp = generateOtp();

        // Calculate the expiry time as a date-time string
        const expiresAt = formatISO(new Date(Date.now() + 10 * 60 * 1000)); // 10 minutes from now in ISO format

        await pool.query(
            'INSERT INTO otps (user_id, otp, expires_at) VALUES ($1, $2, $3)',
            [newUser.rows[0].id, otp, expiresAt]
        );

        res.status(201).json({ message: 'User registered successfully. Please verify your OTP.' });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Server error.' });
    }
},

// OTP verification controller
// OTP verification controller
  verifyOtp : async (req, res) => {
    console.log('verifyOtp route hit'); // Debug log

    const { email, otp } = req.body;

    try {
        const user = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
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

        await pool.query('UPDATE users SET is_verified = $1 WHERE id = $2', [true, user.rows[0].id]);

        await pool.query('DELETE FROM otps WHERE user_id = $1', [user.rows[0].id]);

        res.status(200).json({ message: 'OTP verified successfully. Your account is now verified.' });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Server error.' });
    }
},


// Login controller
  login : async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
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
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        res.status(200).json({ token });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Server error.' });
    }
},


  getOtp :async (req, res) => {
    const { email } = req.query;

    try {
        const user = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
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
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Server error.' });
    }
},


//create a request for getting data of all users
  getData : async (req, res) => {
    try {
        const data = await pool.query('SELECT * FROM users');
        res.status(200).json(data.rows);
        return data.rows;
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Server error.' });
        return [];
    }
}

}



module.exports = requests;