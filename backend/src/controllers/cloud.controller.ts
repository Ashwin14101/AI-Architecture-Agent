import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';

const CLOUD_CATALOG = {
  aws: {
    compute: [
      { id: 'aws-ecs-fargate', name: 'AWS ECS Fargate', category: 'compute', tier: 'serverless-containers', use: 'Containerized microservices without managing servers' },
      { id: 'aws-lambda', name: 'AWS Lambda', category: 'compute', tier: 'serverless', use: 'Event-driven functions, short-lived tasks' },
      { id: 'aws-ec2', name: 'AWS EC2', category: 'compute', tier: 'vms', use: 'General-purpose VMs with full OS control' },
    ],
    database: [
      { id: 'aws-rds-postgres', name: 'AWS RDS PostgreSQL', category: 'database', tier: 'relational', use: 'ACID-compliant relational data' },
      { id: 'aws-dynamodb', name: 'AWS DynamoDB', category: 'database', tier: 'nosql', use: 'Key-value / document store, massive scale' },
      { id: 'aws-elasticache-redis', name: 'AWS ElastiCache Redis', category: 'database', tier: 'cache', use: 'Session cache, pub/sub, leaderboards' },
    ],
    networking: [
      { id: 'aws-api-gateway', name: 'AWS API Gateway', category: 'networking', tier: 'api-management', use: 'HTTP/WebSocket API routing and throttling' },
      { id: 'aws-alb', name: 'AWS ALB', category: 'networking', tier: 'load-balancing', use: 'Layer 7 load balancing for containers' },
      { id: 'aws-cloudfront', name: 'AWS CloudFront', category: 'networking', tier: 'cdn', use: 'Global content delivery, DDoS protection' },
    ],
    storage: [
      { id: 'aws-s3', name: 'AWS S3', category: 'storage', tier: 'object', use: 'Blob/file storage, static assets, backups' },
    ],
    security: [
      { id: 'aws-secrets-manager', name: 'AWS Secrets Manager', category: 'security', tier: 'secrets', use: 'API key and credential management' },
      { id: 'aws-waf', name: 'AWS WAF', category: 'security', tier: 'firewall', use: 'Web application firewall, rate limiting' },
    ],
    observability: [
      { id: 'aws-cloudwatch', name: 'AWS CloudWatch', category: 'observability', tier: 'monitoring', use: 'Metrics, logs, alarms' },
      { id: 'aws-xray', name: 'AWS X-Ray', category: 'observability', tier: 'tracing', use: 'Distributed request tracing' },
    ],
  },
  azure: {
    compute: [
      { id: 'azure-aks', name: 'Azure Kubernetes Service', category: 'compute', tier: 'orchestration', use: 'Managed Kubernetes clusters' },
      { id: 'azure-functions', name: 'Azure Functions', category: 'compute', tier: 'serverless', use: 'Event-driven serverless execution' },
    ],
    database: [
      { id: 'azure-cosmos', name: 'Azure Cosmos DB', category: 'database', tier: 'nosql', use: 'Multi-model global distribution' },
      { id: 'azure-postgres', name: 'Azure Database for PostgreSQL', category: 'database', tier: 'relational', use: 'Managed PostgreSQL' },
    ],
  },
  gcp: {
    compute: [
      { id: 'gcp-cloud-run', name: 'GCP Cloud Run', category: 'compute', tier: 'serverless-containers', use: 'Serverless containers with auto-scaling' },
      { id: 'gcp-gke', name: 'GCP GKE', category: 'compute', tier: 'orchestration', use: 'Managed Kubernetes' },
    ],
    database: [
      { id: 'gcp-spanner', name: 'GCP Cloud Spanner', category: 'database', tier: 'relational', use: 'Globally distributed relational database' },
      { id: 'gcp-firestore', name: 'GCP Firestore', category: 'database', tier: 'nosql', use: 'Real-time NoSQL database' },
    ],
  },
};

export const cloudController = {
  async getCatalog(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { provider, category } = req.query as { provider?: string; category?: string };

      let catalog: Record<string, unknown> = CLOUD_CATALOG;

      if (provider) {
        const prov = provider.toLowerCase();
        if (!(prov in CLOUD_CATALOG)) {
          res.status(404).json({ error: `Provider '${provider}' not found. Available: aws, azure, gcp` });
          return;
        }
        const providerData = (CLOUD_CATALOG as Record<string, Record<string, unknown>>)[prov];
        if (category) {
          const catData = providerData[category.toLowerCase()];
          if (!catData) {
            res.status(404).json({ error: `Category '${category}' not found for provider '${provider}'` });
            return;
          }
          res.status(200).json({ provider, category, services: catData });
          return;
        }
        res.status(200).json({ provider, catalog: providerData });
        return;
      }

      res.status(200).json({
        providers: Object.keys(CLOUD_CATALOG),
        catalog,
        totalServices: Object.values(CLOUD_CATALOG).reduce((sum, p) =>
          sum + Object.values(p).reduce((s2, cat) => s2 + (cat as any[]).length, 0), 0),
      });
    } catch (err) { next(err); }
  },
};
