import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  userId?: string;
}

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    res.status(401).json({ message: 'No autenticado' });
    return;
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET!) as { sub?: string; userId?: string };
    req.userId = payload.sub ?? payload.userId;
    next();
  } catch {
    res.status(401).json({ message: 'Token inválido o expirado' });
  }
}