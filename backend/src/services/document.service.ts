import path from 'path';
import fs from 'fs';
import { Document } from '../models/document.model';
import { Requirement } from '../models/requirement.model';
import logger from '../utils/logger';

const KEYWORDS_HIGH = ['must', 'shall', 'required', 'critical', 'mandatory'];
const KEYWORDS_MED = ['should', 'need', 'necessary', 'important'];
const CATEGORIES: Record<string, string> = {
  security: 'security',
  authentication: 'security',
  authorization: 'security',
  encrypt: 'security',
  performance: 'performance',
  scalab: 'performance',
  latency: 'performance',
  throughput: 'performance',
  database: 'technical',
  api: 'technical',
  integration: 'technical',
};

function detectCategory(text: string): 'functional' | 'non-functional' | 'technical' | 'security' | 'performance' {
  const lower = text.toLowerCase();
  for (const [keyword, cat] of Object.entries(CATEGORIES)) {
    if (lower.includes(keyword)) return cat as any;
  }
  if (/performance|scale|load|response time/.test(lower)) return 'performance';
  if (/user|login|register|display|view|create|delete/.test(lower)) return 'functional';
  return 'non-functional';
}

function detectPriority(text: string): 'high' | 'medium' | 'low' {
  const lower = text.toLowerCase();
  if (KEYWORDS_HIGH.some((k) => lower.includes(k))) return 'high';
  if (KEYWORDS_MED.some((k) => lower.includes(k))) return 'medium';
  return 'low';
}

export const documentService = {
  async saveDocument(projectId: string, file: Express.Multer.File): Promise<Document> {
    const doc = await Document.create({
      projectId,
      name: path.basename(file.filename || file.originalname),
      originalName: file.originalname,
      filePath: file.path,
      fileSize: file.size,
      mimeType: file.mimetype,
      status: 'uploaded',
    });

    // Process asynchronously
    this.processDocument(doc).catch((err) =>
      logger.error(`Failed to process document ${doc.id}`, { err })
    );

    return doc;
  },

  async processDocument(doc: Document): Promise<void> {
    try {
      await doc.update({ status: 'processing' });

      let text = '';
      const ext = path.extname(doc.originalName).toLowerCase();

      if (['.txt', '.md'].includes(ext)) {
        text = fs.readFileSync(doc.filePath, 'utf-8');
      } else {
        // For PDFs or other types, try to read as text or use placeholder
        try {
          text = fs.readFileSync(doc.filePath, 'utf-8');
        } catch {
          text = `Document: ${doc.originalName}\nContent extraction not available for this file type.`;
        }
      }

      await doc.update({ extractedText: text, status: 'processed' });

      // Extract requirements
      const sentences = text
        .split(/[.\n!?]+/)
        .map((s) => s.trim())
        .filter((s) => s.length > 20);

      for (const sentence of sentences.slice(0, 50)) {
        const lower = sentence.toLowerCase();
        if (KEYWORDS_HIGH.some((k) => lower.includes(k)) || KEYWORDS_MED.some((k) => lower.includes(k))) {
          await Requirement.create({
            projectId: doc.projectId,
            documentId: doc.id,
            title: sentence.slice(0, 100),
            description: sentence,
            category: detectCategory(sentence),
            priority: detectPriority(sentence),
          });
        }
      }

      logger.info(`Document processed: ${doc.id}, extracted requirements from ${sentences.length} sentences`);
    } catch (err) {
      await doc.update({ status: 'failed' });
      logger.error(`Document processing failed: ${doc.id}`, { err });
    }
  },

  async listDocuments(projectId: string): Promise<Document[]> {
    return Document.findAll({ where: { projectId }, order: [['createdAt', 'DESC']] });
  },

  async getDocument(id: string, projectId: string): Promise<Document> {
    const doc = await Document.findOne({ where: { id, projectId } });
    if (!doc) throw Object.assign(new Error('Document not found'), { status: 404 });
    return doc;
  },
};
