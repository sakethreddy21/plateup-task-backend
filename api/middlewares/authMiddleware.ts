const jwt= require('jsonwebtoken');
import { request, response , NextFunction} from 'express'

 const authMiddleware = (req: typeof request, res: typeof response, next: NextFunction) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
        res.status(401).json({ error: 'Access denied. No token provided.' });
        return;
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET) ;
        req.body.user = decoded;
        next();
    } catch (err:any) {
        res.status(400).json({ error: 'Invalid token.' });
    }
};

 const roleMiddleware = (roles: Array<any>) => (req: typeof request, res: typeof response, next: NextFunction)=> {
    const user = req.body.user;

    if (!roles.includes(user.userType)) {
        res.status(403).json({ error: 'Access denied.' });
        return;
    }

    next();
};


module.exports = { authMiddleware, roleMiddleware };