import { Conversation } from '../models/conversation.model';
import { Message } from '../models/message.model';
import { ArchitectureVersion } from '../models/architecture-version.model';
import { notificationService } from './notification.service';
import logger from '../utils/logger';

// Mock AI architect persona responses
const AI_RESPONSES: Record<string, string> = {
  default: 'As your AI architect, I analyze your requirements and design scalable, secure architectures. What specific aspect would you like to explore?',
  scalability: 'For scalability, I recommend a microservices architecture with horizontal scaling via Kubernetes or ECS Fargate, combined with an event-driven design using message queues to decouple services and handle traffic spikes gracefully.',
  security: 'Security should be built in from the start. Key pillars: use JWT with short-lived tokens, enforce RBAC, encrypt data at rest and in transit, and adopt a zero-trust network model. Also consider AWS WAF for DDoS protection and Secrets Manager for credential management.',
  database: 'Database design depends on your access patterns. For relational data with ACID requirements, PostgreSQL with read replicas is ideal. For high-throughput key-value access, consider DynamoDB. Implement connection pooling (PgBouncer) and use database indexes carefully.',
  terraform: 'Your Terraform code follows infrastructure-as-code best practices. For production, I recommend adding remote state in S3 with state locking via DynamoDB, separating environments into workspaces, and using modules for reusable components.',
  cost: 'To optimize costs, use reserved instances for predictable workloads, Spot instances for batch jobs, and implement auto-scaling to avoid over-provisioning. AWS Cost Explorer can help identify unused resources.',
  monitoring: 'A comprehensive observability stack should include: metrics (CloudWatch/Prometheus), logs (CloudWatch Logs/ELK), traces (AWS X-Ray/Jaeger), and alerts (PagerDuty/Opsgenie). Implement the RED method: Rate, Errors, Duration.',
};

function generateAIResponse(userMessage: string, hasArchitecture: boolean): string {
  const lower = userMessage.toLowerCase();

  if (lower.includes('scalab') || lower.includes('scale') || lower.includes('load')) return AI_RESPONSES.scalability;
  if (lower.includes('security') || lower.includes('auth') || lower.includes('encrypt')) return AI_RESPONSES.security;
  if (lower.includes('database') || lower.includes('db') || lower.includes('sql')) return AI_RESPONSES.database;
  if (lower.includes('terraform') || lower.includes('infrastructure') || lower.includes('iac')) return AI_RESPONSES.terraform;
  if (lower.includes('cost') || lower.includes('price') || lower.includes('budget')) return AI_RESPONSES.cost;
  if (lower.includes('monitor') || lower.includes('observ') || lower.includes('log')) return AI_RESPONSES.monitoring;

  if (hasArchitecture) {
    return `Based on the generated architecture for your project, ${AI_RESPONSES.default} The current design includes microservices, event-driven patterns, and cloud-native services. What would you like to refine?`;
  }
  return AI_RESPONSES.default;
}

export const chatService = {
  async createConversation(projectId: string, userId: string, title?: string): Promise<Conversation> {
    const conversation = await Conversation.create({
      projectId,
      userId,
      title: title || 'Architecture Discussion',
    });
    logger.info(`Conversation created: ${conversation.id} in project ${projectId}`);
    return conversation;
  },

  async sendMessage(conversationId: string, projectId: string, userId: string, content: string): Promise<{ userMessage: Message; aiMessage: Message }> {
    const conversation = await Conversation.findOne({ where: { id: conversationId, projectId } });
    if (!conversation) throw Object.assign(new Error('Conversation not found'), { status: 404 });

    const userMessage = await Message.create({
      conversationId,
      sender: 'user',
      content,
    });

    // Check if project has architecture
    const hasArchitecture = !!(await ArchitectureVersion.findOne({ where: { projectId, isCurrent: true } }));

    // Simulate AI thinking delay
    await new Promise((r) => setTimeout(r, 500));

    const aiContent = generateAIResponse(content, hasArchitecture);
    const aiMessage = await Message.create({
      conversationId,
      sender: 'ai',
      content: aiContent,
      metadata: { model: 'ArchitectAI-v1', hasArchitectureContext: hasArchitecture },
    });

    // Notify via WebSocket
    notificationService.emitNewMessage(projectId, conversationId, aiContent, 'ai');

    logger.debug(`Chat message processed in conversation ${conversationId}`);
    return { userMessage, aiMessage };
  },

  async getMessages(conversationId: string, projectId: string): Promise<Message[]> {
    const conversation = await Conversation.findOne({ where: { id: conversationId, projectId } });
    if (!conversation) throw Object.assign(new Error('Conversation not found'), { status: 404 });

    return Message.findAll({
      where: { conversationId },
      order: [['createdAt', 'ASC']],
    });
  },

  async listConversations(projectId: string): Promise<Conversation[]> {
    return Conversation.findAll({ where: { projectId }, order: [['createdAt', 'DESC']] });
  },
};
