
const google = require('googleapis').google;
const publicRoutes  = require('./routes/publicRoutes');
const speakerRoutes  = require('./routes/speakerRoutes');
const userRoutes = require('./routes/userRoutes');
const {googlerouter} = require("./services/calenderEvent");
const express = require("express");
const app = express();
const dotenv = require('dotenv');
dotenv.config();
const authRoutes = require('./routes/authRoutes');
const {authMiddleware,roleMiddleware}  = require('./middlewares/authMiddleware');
app.use(express.json());


app.use('/', googlerouter);


app.use('/api/auth', authRoutes);

// Protected route example
app.get('/api/protected', authMiddleware, roleMiddleware(['user', 'speaker']), (req:any, res:any) => {
    res.json('This is a protected route');
});



// Speaker Routes (Protected)
app.use('/api/speakers', speakerRoutes);


// User Routes (Protected)
app.use('/api/users', userRoutes);


const SCOPES = ['https://www.googleapis.com/auth/calendar'];
const oauth2Client = new google.auth.OAuth2(
    process.env.CLIENT_ID,
    process.env.CLIENT_SECRET,
    process.env.REDIRECT_URI
)


// Public Routes
app.use('/api', publicRoutes);
app.get("/", (req:any, res:any) => res.json("Express on Vercel"));

app.listen(3000, () => console.log("Server ready on port 3000."));

module.exports = app;