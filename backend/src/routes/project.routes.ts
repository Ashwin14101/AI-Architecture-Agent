import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { projectController } from '../controllers/project.controller';
import { documentController } from '../controllers/document.controller';
import { architectureController } from '../controllers/architecture.controller';
import { terraformController } from '../controllers/terraform.controller';
import { reviewController } from '../controllers/review.controller';
import { versionController } from '../controllers/version.controller';
import { deploymentController } from '../controllers/deployment.controller';
import { chatController } from '../controllers/chat.controller';
import { diagramController } from '../controllers/diagram.controller';
import { cloudController } from '../controllers/cloud.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';

const router = Router();

// Multer setup for document uploads
const uploadDir = path.resolve(process.env.UPLOAD_DIR || './uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE_MB || '20', 10) * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['.pdf', '.txt', '.md', '.docx', '.doc'];
    if (allowed.includes(path.extname(file.originalname).toLowerCase())) {
      cb(null, true);
    } else {
      cb(new Error(`File type not allowed. Supported: ${allowed.join(', ')}`));
    }
  },
});

// All project routes require authentication
router.use(authenticate);

// ── Projects ─────────────────────────────────────────────
router.post('/', validate([{ field: 'name', required: true, type: 'string', minLength: 1, maxLength: 200 }]), projectController.create);
router.get('/', projectController.list);
router.get('/:id', projectController.getById);
router.put('/:id', projectController.update);
router.delete('/:id', projectController.remove);

// ── Documents ─────────────────────────────────────────────
router.post('/:id/documents', upload.single('file'), documentController.upload);
router.get('/:id/documents', documentController.list);
router.get('/:id/documents/:docId', documentController.getById);

// ── Architecture Generation ───────────────────────────────
router.post('/:id/generate', architectureController.generate);
router.get('/:id/architecture', architectureController.getArchitecture);
router.get('/:id/architecture/database', architectureController.getDatabaseSchema);
router.get('/:id/architecture/apis', architectureController.getApiSpec);
router.get('/:id/workflow-status', architectureController.getWorkflowStatus);

// ── Cloud & Terraform ─────────────────────────────────────
router.get('/:id/cloud-mapping', terraformController.getCloudMapping);
router.get('/:id/terraform', terraformController.getTerraform);
router.get('/:id/terraform/download', terraformController.downloadTerraform);
router.post('/:id/terraform/validate', terraformController.validateTerraform);

// ── AI Reviews ────────────────────────────────────────────
router.post('/:id/reviews', reviewController.requestReview);
router.get('/:id/reviews/:rId', reviewController.getReview);
router.put('/:id/reviews/:rId/findings/:fId', reviewController.updateFinding);

// ── Versions ──────────────────────────────────────────────
router.get('/:id/versions', versionController.list);
router.get('/:id/versions/compare', versionController.compare);
router.post('/:id/versions/:vId/rollback', versionController.rollback);

// ── Deployments ───────────────────────────────────────────
router.post('/:id/deployments', deploymentController.create);
router.get('/:id/deployments', deploymentController.list);
router.get('/:id/deployments/:dId', deploymentController.getById);
router.post('/:id/deployments/:dId/approve', deploymentController.approve);
router.post('/:id/deployments/:dId/rollback', deploymentController.rollback);

// ── Chat ──────────────────────────────────────────────────
router.post('/:id/conversations', chatController.createConversation);
router.get('/:id/conversations', chatController.listConversations);
router.post('/:id/conversations/:cId/messages', chatController.sendMessage);
router.get('/:id/conversations/:cId/messages', chatController.getMessages);

// ── Diagrams ──────────────────────────────────────────────
router.get('/:id/diagrams/:type', diagramController.getDiagram);

export default router;
