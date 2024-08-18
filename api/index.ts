const express = require("express");
const app = express();
const dotenv = require('dotenv');
dotenv.config();
import authRoutes from './routes/authRoutes';
import speakerRoutes from './routes/speakerRoutes';
import { authMiddleware, roleMiddleware } from './middlewares/authMiddleware';
import userRoutes from './routes/userRoutes';
import { googlerouter } from './services/calenderEvent';
app.use(express.json());
// Routes

// Auth Routes
app.use('/api/auth', authRoutes);
//public route
app.get('/api/public', (req:any, res:any) => {
    res.json('This is a public route');
});
// User Routes
app.use('/api/user', userRoutes);
// Google Routes
app.use('/', googlerouter);
// Speaker Routes
app.use('/api/speaker' , speakerRoutes);
// Protected route example
app.get('/api/protected', authMiddleware, roleMiddleware(['user', 'speaker']), (req:any, res:any) => {
    res.json('This is a protected route');
});
app.get("/", (req:any, res:any) => res.json("Express on Vercel"));

app.listen(3000, () => console.log("Server ready on port 3000."));

module.exports = app;