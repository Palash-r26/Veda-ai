import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
  };
}

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not configured');
  }

  return secret;
}

export const requireAuth = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization || req.headers.Authorization as string;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('[Auth] Missing token. Headers:', req.headers);
      return res.status(401).json({ success: false, error: 'Unauthorized: Missing token' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, getJwtSecret()) as { id: string; email: string };
    
    // Verify user still exists
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ success: false, error: 'Unauthorized: User not found' });
    }

    req.user = { id: user.id, email: user.email };
    next();
  } catch (error) {
    return res.status(401).json({ success: false, error: 'Unauthorized: Invalid token' });
  }
};
