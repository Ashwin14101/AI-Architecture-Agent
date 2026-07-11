import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service';
import { auditService } from '../services/audit.service';
import { AuthRequest } from '../middleware/auth.middleware';

export const authController = {
  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { username, email, password } = req.body;
      const { user, tokens } = await authService.register(username, email, password);
      await auditService.log(user.id, 'auth.register', 'User', user.id, { username }, req.ip, req.headers['user-agent']);
      res.status(201).json({
        message: 'User registered successfully',
        user: { id: user.id, username: user.username, email: user.email, role: user.role },
        ...tokens,
      });
    } catch (err) {
      next(err);
    }
  },

  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password } = req.body;
      const { user, tokens } = await authService.login(email, password);
      await auditService.log(user.id, 'auth.login', 'User', user.id, {}, req.ip, req.headers['user-agent']);
      res.status(200).json({
        message: 'Login successful',
        user: { id: user.id, username: user.username, email: user.email, role: user.role },
        ...tokens,
      });
    } catch (err) {
      next(err);
    }
  },

  async refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { refreshToken } = req.body;
      if (!refreshToken) {
        res.status(400).json({ error: 'refreshToken is required' });
        return;
      }
      const tokens = await authService.refresh(refreshToken);
      res.status(200).json({ message: 'Token refreshed', ...tokens });
    } catch (err) {
      next(err);
    }
  },

  async logout(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (req.user) {
        await authService.logout(req.user.userId);
        await auditService.log(req.user.userId, 'auth.logout', 'User', req.user.userId, {}, req.ip);
      }
      res.status(200).json({ message: 'Logged out successfully' });
    } catch (err) {
      next(err);
    }
  },

  async me(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { User } = await import('../models/user.model');
      const user = await User.findByPk(req.user!.userId, { attributes: ['id', 'username', 'email', 'role', 'createdAt'] });
      if (!user) { res.status(404).json({ error: 'User not found' }); return; }
      res.status(200).json({ user });
    } catch (err) {
      next(err);
    }
  },
};
