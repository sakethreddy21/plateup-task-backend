const express = require("express");
const app = express();
const dotenv = require('dotenv');
dotenv.config();
const authRoutes = require('../routes/authRoutes.js');
const {authMiddleware,roleMiddleware}  = require('../middlewares/authMiddleware.js');

app.use(express.json());
// Routes
app.use('/api/auth', authRoutes);

// Protected route example
app.get('/api/protected', authMiddleware, roleMiddleware(['user', 'speaker']), (req:any, res:any) => {
    res.send('This is a protected route');
});
app.get("/", (req:any, res:any) => res.send("Express on Vercel"));

app.listen(3000, () => console.log("Server ready on port 3000."));

module.exports = app;