const jwt = require('jsonwebtoken');
import { Request, Response, NextFunction } from 'express';

const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
        return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET as string);
        req.body.user = decoded;
        next();
    } catch (err: any) {
        return res.status(400).json({ error: 'Invalid token.' });
    }
};

const roleMiddleware = (roles: Array<string>) => (req: Request, res: Response, next: NextFunction) => {
    const user = req.body.user;

    if (!roles.includes(user.userType)) {
        return res.status(403).json({ error: 'Access denied.' });
    }

    next();
};

module.exports = { authMiddleware, roleMiddleware };
