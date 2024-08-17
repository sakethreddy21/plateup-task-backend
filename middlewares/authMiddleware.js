const jwt= require('jsonwebtoken');


 const authMiddleware = (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
        res.status(401).json({ error: 'Access denied. No token provided.' });
        return;
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET) ;
        req.body.user = decoded;
        next();
    } catch (ex) {
        res.status(400).json({ error: 'Invalid token.' });
    }
};

 const roleMiddleware = (roles) => (req, res, next)=> {
    const user = req.body.user;

    if (!roles.includes(user.userType)) {
        res.status(403).json({ error: 'Access denied.' });
        return;
    }

    next();
};


module.exports = { authMiddleware, roleMiddleware };