import { Review } from '../models/review.model';
import { ReviewFinding } from '../models/review-finding.model';
import { ArchitectureVersion } from '../models/architecture-version.model';
import { notificationService } from './notification.service';
import { auditService } from './audit.service';
import logger from '../utils/logger';

// Mock AI review rules
const REVIEW_RULES = [
  {
    ruleId: 'SEC-001',
    severity: 'high' as const,
    category: 'Security',
    title: 'No API rate limiting detected',
    description: 'The architecture does not include rate limiting on public API endpoints, which may lead to DoS vulnerabilities.',
    recommendation: 'Implement rate limiting at the API Gateway layer (e.g., AWS WAF or NGINX rate limit module).',
    affectedComponent: 'API Gateway',
  },
  {
    ruleId: 'PERF-001',
    severity: 'medium' as const,
    category: 'Performance',
    title: 'Missing caching layer for read-heavy endpoints',
    description: 'High-frequency read operations lack a caching layer, which may cause database overload under peak load.',
    recommendation: 'Add Redis or Memcached as a read-through cache for frequent query patterns.',
    affectedComponent: 'Application Service',
  },
  {
    ruleId: 'AVAIL-001',
    severity: 'high' as const,
    category: 'Availability',
    title: 'Single point of failure in database layer',
    description: 'The database is configured without multi-AZ failover, risking downtime on primary node failure.',
    recommendation: 'Enable Multi-AZ deployment on the RDS instance and configure automatic failover.',
    affectedComponent: 'Database',
  },
  {
    ruleId: 'COST-001',
    severity: 'low' as const,
    category: 'Cost Optimization',
    title: 'Over-provisioned compute resources',
    description: 'The ECS Fargate task definition allocates fixed CPU/memory without auto-scaling policies.',
    recommendation: 'Add ECS Auto Scaling based on CPU utilization and request count metrics.',
    affectedComponent: 'Application Service',
  },
  {
    ruleId: 'OBS-001',
    severity: 'medium' as const,
    category: 'Observability',
    title: 'No distributed tracing configured',
    description: 'The architecture lacks distributed tracing, making it difficult to debug cross-service latency issues.',
    recommendation: 'Integrate AWS X-Ray or OpenTelemetry for end-to-end request tracing.',
    affectedComponent: 'Application Service',
  },
  {
    ruleId: 'SEC-002',
    severity: 'critical' as const,
    category: 'Security',
    title: 'Database credentials exposed in environment variables',
    description: 'Storing database credentials as plain environment variables increases the risk of credential leakage.',
    recommendation: 'Use AWS Secrets Manager or Parameter Store and inject secrets at runtime.',
    affectedComponent: 'Database',
  },
  {
    ruleId: 'MAINT-001',
    severity: 'info' as const,
    category: 'Maintainability',
    title: 'No blue-green deployment strategy',
    description: 'The deployment configuration does not define a blue-green or canary strategy, increasing risk during updates.',
    recommendation: 'Configure CodeDeploy or ALB weighted target groups for zero-downtime deployments.',
    affectedComponent: 'API Gateway',
  },
];

export const reviewService = {
  async requestReview(projectId: string, userId: string): Promise<Review> {
    const version = await ArchitectureVersion.findOne({ where: { projectId, isCurrent: true } });
    if (!version) throw Object.assign(new Error('No architecture available to review'), { status: 404 });

    const review = await Review.create({ projectId, versionId: version.id, status: 'pending' });

    setImmediate(async () => {
      try {
        await review.update({ status: 'running' });
        await new Promise((r) => setTimeout(r, 2000)); // Simulate AI processing

        // Generate findings
        const selectedRules = REVIEW_RULES.slice(0, 4 + Math.floor(Math.random() * 3));
        for (const rule of selectedRules) {
          await ReviewFinding.create({ reviewId: review.id, ...rule });
        }

        const score = Math.round(70 + Math.random() * 25);
        const summary = `Architecture reviewed successfully. Found ${selectedRules.length} findings across Security, Performance, and Availability domains. Overall score: ${score}/100.`;
        await review.update({ status: 'completed', summary, score });

        notificationService.emitReviewReady(projectId, review.id, selectedRules.length);
        await auditService.log(userId, 'review.completed', 'Review', review.id, { findings: selectedRules.length, score });
        logger.info(`Review completed for project ${projectId}: ${selectedRules.length} findings`);
      } catch (err) {
        await review.update({ status: 'failed' });
        logger.error(`Review failed for project ${projectId}`, { err });
      }
    });

    return review;
  },

  async getReview(reviewId: string, projectId: string): Promise<{ review: Review; findings: ReviewFinding[] }> {
    const review = await Review.findOne({ where: { id: reviewId, projectId } });
    if (!review) throw Object.assign(new Error('Review not found'), { status: 404 });

    const findings = await ReviewFinding.findAll({ where: { reviewId }, order: [['severity', 'ASC']] });
    return { review, findings };
  },

  async updateFinding(reviewId: string, findingId: string, status: 'accepted' | 'rejected'): Promise<ReviewFinding> {
    const finding = await ReviewFinding.findOne({ where: { id: findingId, reviewId } });
    if (!finding) throw Object.assign(new Error('Finding not found'), { status: 404 });
    await finding.update({ status });
    return finding;
  },
};
