import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { chatService } from '../services/chat.service';

const p = (v: string | string[]): string => (Array.isArray(v) ? v[0] : v);

export const chatController = {
  async createConversation(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const conversation = await chatService.createConversation(p(req.params['id']), req.user!.userId, req.body.title);
      res.status(201).json(conversation);
    } catch (err) { next(err); }
  },

  async listConversations(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const conversations = await chatService.listConversations(p(req.params['id']));
      res.status(200).json({ conversations, count: conversations.length });
    } catch (err) { next(err); }
  },

  async sendMessage(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { content } = req.body;
      if (!content?.trim()) { res.status(400).json({ error: 'Message content is required' }); return; }
      const { userMessage, aiMessage } = await chatService.sendMessage(
        p(req.params['cId']), p(req.params['id']), req.user!.userId, content
      );
      res.status(201).json({ userMessage, aiMessage });
    } catch (err) { next(err); }
  },

  async getMessages(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const messages = await chatService.getMessages(p(req.params['cId']), p(req.params['id']));
      res.status(200).json({ messages, count: messages.length });
    } catch (err) { next(err); }
  },
};
