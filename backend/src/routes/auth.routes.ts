import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';
import { authRateLimit } from '../middleware/rate-limit.middleware';

const router = Router();

router.post('/register',
  authRateLimit,
  validate([
    { field: 'username', required: true, type: 'string', minLength: 3, maxLength: 50 },
    { field: 'email', required: true, type: 'email' },
    { field: 'password', required: true, type: 'string', minLength: 8 },
  ]),
  authController.register
);

router.post('/login',
  authRateLimit,
  validate([
    { field: 'email', required: true, type: 'email' },
    { field: 'password', required: true, type: 'string' },
  ]),
  authController.login
);

router.post('/refresh', authController.refresh);
router.post('/logout', authenticate, authController.logout);
router.get('/me', authenticate, authController.me);

export default router;
