const express = require("express");
const app = express();
const dotenv = require('dotenv');
dotenv.config();
import authRoutes from './routes/authRoutes';
import speakerRoutes from './routes/speakerRoutes';
import { authMiddleware, roleMiddleware } from './middlewares/authMiddleware';

app.use(express.json());
// Routes
app.use('/api/auth', authRoutes);




app.use('/api/speaker' , speakerRoutes);
// Protected route example
app.get('/api/protected', authMiddleware, roleMiddleware(['user', 'speaker']), (req:any, res:any) => {
    res.json('This is a protected route');
});
app.get("/", (req:any, res:any) => res.json("Express on Vercel"));

app.listen(3000, () => console.log("Server ready on port 3000."));

module.exports = app;