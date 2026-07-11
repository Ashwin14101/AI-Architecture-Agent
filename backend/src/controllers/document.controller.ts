import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { documentService } from '../services/document.service';

const p = (v: string | string[]): string => (Array.isArray(v) ? v[0] : v);

export const documentController = {
  async upload(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.file) { res.status(400).json({ error: 'No file uploaded' }); return; }
      const doc = await documentService.saveDocument(p(req.params['id']), req.file);
      res.status(201).json({
        message: 'Document uploaded and queued for processing',
        document: {
          id: doc.id, name: doc.name, originalName: doc.originalName,
          fileSize: doc.fileSize, mimeType: doc.mimeType, status: doc.status, createdAt: doc.createdAt,
        },
      });
    } catch (err) { next(err); }
  },

  async list(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const docs = await documentService.listDocuments(p(req.params['id']));
      res.status(200).json({ documents: docs, count: docs.length });
    } catch (err) { next(err); }
  },

  async getById(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const doc = await documentService.getDocument(p(req.params['docId']), p(req.params['id']));
      res.status(200).json(doc);
    } catch (err) { next(err); }
  },
};
