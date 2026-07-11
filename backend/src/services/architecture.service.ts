import { ArchitectureVersion } from '../models/architecture-version.model';
import { Project } from '../models/project.model';
import { AgentExecution } from '../models/agent-execution.model';
import { notificationService } from './notification.service';
import { auditService } from './audit.service';
import logger from '../utils/logger';

// ──────────────────────────────────────────────────────────
// Mock AI generation functions
// ──────────────────────────────────────────────────────────

function generateDatabaseSchema(projectName: string): object {
  return {
    dialect: 'PostgreSQL 16',
    tables: [
      {
        name: 'users',
        columns: [
          { name: 'id', type: 'UUID', primaryKey: true, default: 'gen_random_uuid()' },
          { name: 'email', type: 'VARCHAR(255)', nullable: false, unique: true },
          { name: 'password_hash', type: 'VARCHAR(255)', nullable: false },
          { name: 'role', type: 'VARCHAR(50)', nullable: false, default: "'user'" },
          { name: 'created_at', type: 'TIMESTAMP', default: 'NOW()' },
        ],
      },
      {
        name: `${projectName.toLowerCase().replace(/\s+/g, '_')}_records`,
        columns: [
          { name: 'id', type: 'UUID', primaryKey: true, default: 'gen_random_uuid()' },
          { name: 'user_id', type: 'UUID', foreignKey: 'users(id)' },
          { name: 'name', type: 'VARCHAR(255)', nullable: false },
          { name: 'data', type: 'JSONB', nullable: true },
          { name: 'status', type: 'VARCHAR(50)', default: "'active'" },
          { name: 'created_at', type: 'TIMESTAMP', default: 'NOW()' },
          { name: 'updated_at', type: 'TIMESTAMP', default: 'NOW()' },
        ],
      },
      {
        name: 'audit_logs',
        columns: [
          { name: 'id', type: 'UUID', primaryKey: true },
          { name: 'user_id', type: 'UUID', foreignKey: 'users(id)', nullable: true },
          { name: 'action', type: 'VARCHAR(200)', nullable: false },
          { name: 'details', type: 'JSONB', nullable: true },
          { name: 'created_at', type: 'TIMESTAMP', default: 'NOW()' },
        ],
      },
    ],
    indexes: [
      { table: 'users', column: 'email', type: 'btree' },
      { table: 'audit_logs', column: 'created_at', type: 'brin' },
    ],
  };
}

function generateApiSpec(projectName: string): object {
  return {
    openapi: '3.1.0',
    info: { title: `${projectName} API`, version: '1.0.0', description: `Auto-generated API spec for ${projectName}` },
    servers: [{ url: 'https://api.example.com/v1' }],
    paths: {
      '/auth/register': {
        post: {
          summary: 'Register new user',
          requestBody: { content: { 'application/json': { schema: { type: 'object', properties: { email: { type: 'string' }, password: { type: 'string' } } } } } },
          responses: { '201': { description: 'User created' }, '409': { description: 'Email taken' } },
        },
      },
      '/auth/login': {
        post: {
          summary: 'Authenticate user',
          responses: { '200': { description: 'Returns JWT tokens' }, '401': { description: 'Invalid credentials' } },
        },
      },
      '/resources': {
        get: { summary: 'List resources', security: [{ bearerAuth: [] }], responses: { '200': { description: 'Array of resources' } } },
        post: { summary: 'Create resource', security: [{ bearerAuth: [] }], responses: { '201': { description: 'Resource created' } } },
      },
      '/resources/{id}': {
        get: { summary: 'Get resource by ID', security: [{ bearerAuth: [] }], responses: { '200': { description: 'Resource details' }, '404': { description: 'Not found' } } },
        put: { summary: 'Update resource', security: [{ bearerAuth: [] }], responses: { '200': { description: 'Resource updated' } } },
        delete: { summary: 'Delete resource', security: [{ bearerAuth: [] }], responses: { '204': { description: 'Deleted' } } },
      },
    },
    components: { securitySchemes: { bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' } } },
  };
}

function generateCloudMapping(projectName: string): object {
  return {
    provider: 'AWS',
    region: 'us-east-1',
    components: [
      { name: 'API Gateway', service: 'AWS API Gateway', tier: 'networking', purpose: 'HTTP request routing' },
      { name: 'Application Server', service: 'AWS ECS Fargate', tier: 'compute', purpose: 'Node.js containerized service', scaling: 'auto-scaling group, min:1, max:10' },
      { name: 'Database', service: 'AWS RDS PostgreSQL', tier: 'data', purpose: 'Primary relational database', instanceType: 'db.t3.medium', multiAZ: true },
      { name: 'Cache', service: 'AWS ElastiCache Redis', tier: 'data', purpose: 'Session caching and rate limiting' },
      { name: 'Object Storage', service: 'AWS S3', tier: 'storage', purpose: 'Document and artifact storage' },
      { name: 'CDN', service: 'AWS CloudFront', tier: 'networking', purpose: 'Static asset delivery' },
      { name: 'Container Registry', service: 'AWS ECR', tier: 'devops', purpose: 'Docker image storage' },
      { name: 'Secrets', service: 'AWS Secrets Manager', tier: 'security', purpose: 'API keys and credentials' },
      { name: 'Monitoring', service: 'AWS CloudWatch', tier: 'observability', purpose: 'Logs, metrics, and alerts' },
    ],
    estimatedMonthlyCost: { min: 250, max: 800, currency: 'USD' },
  };
}

function generateTerraform(projectName: string, cloudMapping: object): string {
  const safeName = projectName.toLowerCase().replace(/[^a-z0-9]/g, '_');
  return `# Generated Terraform for ${projectName}
# Provider: AWS

terraform {
  required_version = ">= 1.5.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
  backend "s3" {
    bucket = "${safeName}-tfstate"
    key    = "prod/terraform.tfstate"
    region = "us-east-1"
  }
}

provider "aws" {
  region = var.aws_region
}

variable "aws_region" {
  default = "us-east-1"
}

variable "app_name" {
  default = "${safeName}"
}

# ── VPC ──────────────────────────────────────────────────
resource "aws_vpc" "${safeName}_vpc" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true
  tags = { Name = "\${var.app_name}-vpc" }
}

resource "aws_subnet" "public_a" {
  vpc_id            = aws_vpc.${safeName}_vpc.id
  cidr_block        = "10.0.1.0/24"
  availability_zone = "\${var.aws_region}a"
  map_public_ip_on_launch = true
  tags = { Name = "\${var.app_name}-public-a" }
}

resource "aws_subnet" "private_a" {
  vpc_id            = aws_vpc.${safeName}_vpc.id
  cidr_block        = "10.0.10.0/24"
  availability_zone = "\${var.aws_region}a"
  tags = { Name = "\${var.app_name}-private-a" }
}

resource "aws_internet_gateway" "igw" {
  vpc_id = aws_vpc.${safeName}_vpc.id
  tags   = { Name = "\${var.app_name}-igw" }
}

# ── Security Groups ───────────────────────────────────────
resource "aws_security_group" "alb_sg" {
  name   = "\${var.app_name}-alb-sg"
  vpc_id = aws_vpc.${safeName}_vpc.id
  ingress { from_port = 443 to_port = 443 protocol = "tcp" cidr_blocks = ["0.0.0.0/0"] }
  ingress { from_port = 80  to_port = 80  protocol = "tcp" cidr_blocks = ["0.0.0.0/0"] }
  egress  { from_port = 0   to_port = 0   protocol = "-1"  cidr_blocks = ["0.0.0.0/0"] }
}

resource "aws_security_group" "ecs_sg" {
  name   = "\${var.app_name}-ecs-sg"
  vpc_id = aws_vpc.${safeName}_vpc.id
  ingress { from_port = 3001 to_port = 3001 protocol = "tcp" security_groups = [aws_security_group.alb_sg.id] }
  egress  { from_port = 0    to_port = 0    protocol = "-1"  cidr_blocks = ["0.0.0.0/0"] }
}

# ── Application Load Balancer ─────────────────────────────
resource "aws_lb" "alb" {
  name               = "\${var.app_name}-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb_sg.id]
  subnets            = [aws_subnet.public_a.id]
  tags               = { Name = "\${var.app_name}-alb" }
}

resource "aws_lb_target_group" "app_tg" {
  name        = "\${var.app_name}-tg"
  port        = 3001
  protocol    = "HTTP"
  vpc_id      = aws_vpc.${safeName}_vpc.id
  target_type = "ip"
  health_check { path = "/api/health" interval = 30 }
}

# ── ECS Fargate ───────────────────────────────────────────
resource "aws_ecs_cluster" "app_cluster" {
  name = "\${var.app_name}-cluster"
}

resource "aws_ecs_task_definition" "app_task" {
  family                   = "\${var.app_name}-task"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = "512"
  memory                   = "1024"
  container_definitions = jsonencode([{
    name  = "\${var.app_name}-api"
    image = "\${aws_ecr_repository.app_repo.repository_url}:latest"
    portMappings = [{ containerPort = 3001 }]
    environment = [{ name = "NODE_ENV" value = "production" }]
    logConfiguration = {
      logDriver = "awslogs"
      options = {
        awslogs-group  = "/ecs/\${var.app_name}"
        awslogs-region = var.aws_region
      }
    }
  }])
}

# ── RDS PostgreSQL ────────────────────────────────────────
resource "aws_db_instance" "postgres" {
  identifier             = "\${var.app_name}-db"
  engine                 = "postgres"
  engine_version         = "16"
  instance_class         = "db.t3.medium"
  allocated_storage      = 20
  db_name                = "\${var.app_name}_db"
  username               = "dbadmin"
  password               = var.db_password
  skip_final_snapshot    = false
  multi_az               = true
  deletion_protection    = true
  vpc_security_group_ids = [aws_security_group.ecs_sg.id]
  db_subnet_group_name   = aws_db_subnet_group.main.name
  tags = { Name = "\${var.app_name}-db" }
}

variable "db_password" {
  type      = string
  sensitive = true
}

resource "aws_db_subnet_group" "main" {
  name       = "\${var.app_name}-db-subnet"
  subnet_ids = [aws_subnet.private_a.id]
}

# ── ECR Repository ────────────────────────────────────────
resource "aws_ecr_repository" "app_repo" {
  name                 = "\${var.app_name}-api"
  image_tag_mutability = "MUTABLE"
  image_scanning_configuration { scan_on_push = true }
}

# ── S3 Bucket ─────────────────────────────────────────────
resource "aws_s3_bucket" "documents" {
  bucket = "\${var.app_name}-documents-\${random_id.suffix.hex}"
}

resource "random_id" "suffix" {
  byte_length = 4
}

# ── Outputs ───────────────────────────────────────────────
output "alb_dns" {
  value = aws_lb.alb.dns_name
}

output "rds_endpoint" {
  value = aws_db_instance.postgres.endpoint
}

output "ecr_url" {
  value = aws_ecr_repository.app_repo.repository_url
}
`;
}

async function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

// ──────────────────────────────────────────────────────────
// Architecture Service
// ──────────────────────────────────────────────────────────
export const architectureService = {
  async startGeneration(projectId: string, userId: string): Promise<void> {
    const project = await Project.findByPk(projectId);
    if (!project) throw Object.assign(new Error('Project not found'), { status: 404 });

    await project.update({ status: 'generating' });

    const execution = await AgentExecution.create({
      projectId,
      agentName: 'ArchitectureGeneratorAgent',
      status: 'running',
    });

    const start = Date.now();

    // Run generation asynchronously
    setImmediate(async () => {
      try {
        const steps = [
          { name: 'analyzing-requirements', label: 'Analyzing requirements', progress: 10 },
          { name: 'modeling-components', label: 'Modeling system components', progress: 25 },
          { name: 'designing-database', label: 'Designing database schema', progress: 40 },
          { name: 'generating-apis', label: 'Generating API specification', progress: 55 },
          { name: 'mapping-cloud', label: 'Mapping to cloud services', progress: 70 },
          { name: 'generating-terraform', label: 'Generating Terraform IaC', progress: 85 },
          { name: 'finalizing', label: 'Finalizing architecture', progress: 95 },
        ];

        for (const step of steps) {
          notificationService.emitGenerationProgress(projectId, step.name, step.progress, step.label);
          await sleep(800);
        }

        // Build architecture artifacts
        const dbSchema = generateDatabaseSchema(project.name);
        const apiSpec = generateApiSpec(project.name);
        const cloudMapping = generateCloudMapping(project.name);
        const terraformCode = generateTerraform(project.name, cloudMapping);

        const architectureData = {
          name: project.name,
          generatedAt: new Date().toISOString(),
          components: [
            { id: 'comp-1', name: 'API Gateway', type: 'networking', description: 'Entry point for all HTTP traffic' },
            { id: 'comp-2', name: 'Application Service', type: 'compute', description: 'Core business logic container' },
            { id: 'comp-3', name: 'Database', type: 'data', description: 'Primary relational database' },
            { id: 'comp-4', name: 'Cache Layer', type: 'data', description: 'Redis cache for sessions and hot data' },
            { id: 'comp-5', name: 'Message Queue', type: 'async', description: 'Async job processing' },
            { id: 'comp-6', name: 'File Storage', type: 'storage', description: 'Object storage for documents and assets' },
          ],
          connections: [
            { from: 'comp-1', to: 'comp-2', protocol: 'HTTPS' },
            { from: 'comp-2', to: 'comp-3', protocol: 'TCP/5432' },
            { from: 'comp-2', to: 'comp-4', protocol: 'TCP/6379' },
            { from: 'comp-2', to: 'comp-5', protocol: 'AMQP' },
            { from: 'comp-2', to: 'comp-6', protocol: 'HTTPS/S3' },
          ],
          patterns: ['microservices', 'event-driven', 'CQRS', 'circuit-breaker'],
          qualityAttributes: {
            availability: '99.9%',
            scalability: 'horizontal',
            security: 'zero-trust',
            observability: 'distributed-tracing',
          },
        };

        // Get next version number
        const lastVersion = await ArchitectureVersion.findOne({
          where: { projectId },
          order: [['versionNumber', 'DESC']],
        });
        const versionNumber = (lastVersion?.versionNumber || 0) + 1;

        // Unset previous current
        await ArchitectureVersion.update({ isCurrent: false }, { where: { projectId } });

        const version = await ArchitectureVersion.create({
          projectId,
          versionNumber,
          label: `v${versionNumber} - Auto-generated`,
          architectureData,
          databaseSchema: dbSchema,
          apiSpec,
          cloudMapping,
          terraformCode,
          isCurrent: true,
        });

        await project.update({ status: 'ready' });
        await execution.update({
          status: 'completed',
          durationMs: Date.now() - start,
          output: { versionId: version.id, versionNumber },
        });

        notificationService.emitGenerationProgress(projectId, 'complete', 100, 'Architecture generated successfully');
        notificationService.emitGenerationComplete(projectId, version.id);

        await auditService.log(userId, 'architecture.generated', 'Project', projectId, { versionId: version.id });
        logger.info(`Architecture generated for project ${projectId}, version ${versionNumber}`);
      } catch (err) {
        await Project.update({ status: 'active' }, { where: { id: projectId } });
        await execution.update({ status: 'failed', logs: String(err) });
        logger.error(`Architecture generation failed for project ${projectId}`, { err });
      }
    });
  },

  async getCurrentVersion(projectId: string): Promise<ArchitectureVersion | null> {
    return ArchitectureVersion.findOne({ where: { projectId, isCurrent: true } });
  },

  async getWorkflowStatus(projectId: string): Promise<object> {
    const project = await Project.findByPk(projectId);
    const latestExecution = await AgentExecution.findOne({
      where: { projectId },
      order: [['createdAt', 'DESC']],
    });

    return {
      projectId,
      projectStatus: project?.status || 'unknown',
      lastExecution: latestExecution
        ? {
            agentName: latestExecution.agentName,
            status: latestExecution.status,
            durationMs: latestExecution.durationMs,
            startedAt: latestExecution.createdAt,
          }
        : null,
    };
  },
};
