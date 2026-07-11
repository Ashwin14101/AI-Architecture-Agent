import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { cloudController } from '../controllers/cloud.controller';

const router = Router();

// Cloud catalog is read-only but still requires auth
router.get('/catalog', authenticate, cloudController.getCatalog);

export default router;
