import { Deployment } from '../models/deployment.model';
import { ArchitectureVersion } from '../models/architecture-version.model';
import { notificationService } from './notification.service';
import { auditService } from './audit.service';
import logger from '../utils/logger';

const DEPLOY_STEPS = [
  'Initializing Terraform workspace...',
  'Running terraform init...',
  'Running terraform plan...',
  'Plan validated. Awaiting approval...',
  'Applying infrastructure changes...',
  'Creating VPC and networking resources...',
  'Provisioning ECS cluster...',
  'Creating RDS instance...',
  'Configuring load balancer...',
  'Deploying application containers...',
  'Running health checks...',
  'Deployment complete!',
];

async function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

export const deploymentService = {
  async createDeployment(projectId: string, userId: string, environment: 'staging' | 'production' = 'staging'): Promise<Deployment> {
    const version = await ArchitectureVersion.findOne({ where: { projectId, isCurrent: true } });
    if (!version) throw Object.assign(new Error('No architecture version available to deploy'), { status: 404 });

    const deployment = await Deployment.create({
      projectId,
      versionId: version.id,
      status: 'pending',
      environment,
    });

    await auditService.log(userId, 'deployment.created', 'Deployment', deployment.id, { projectId, environment });
    logger.info(`Deployment created: ${deployment.id} for project ${projectId}`);
    return deployment;
  },

  async approveDeployment(deploymentId: string, projectId: string, userId: string): Promise<Deployment> {
    const deployment = await Deployment.findOne({ where: { id: deploymentId, projectId } });
    if (!deployment) throw Object.assign(new Error('Deployment not found'), { status: 404 });
    if (deployment.status !== 'pending') throw Object.assign(new Error('Deployment is not in pending state'), { status: 400 });

    await deployment.update({ status: 'approved', approvedBy: userId });
    await auditService.log(userId, 'deployment.approved', 'Deployment', deploymentId, {});

    // Run deployment simulation
    setImmediate(async () => {
      try {
        await deployment.update({ status: 'deploying', logOutput: '' });
        notificationService.emitDeploymentStatus(projectId, deploymentId, 'deploying');

        let logs = '';
        for (const step of DEPLOY_STEPS) {
          logs += `\n[${new Date().toISOString()}] ${step}`;
          await deployment.update({ logOutput: logs });
          notificationService.emitDeploymentStatus(projectId, deploymentId, step);
          await sleep(600);
        }

        await deployment.update({ status: 'deployed', logOutput: logs });
        notificationService.emitDeploymentStatus(projectId, deploymentId, 'deployed');
        await auditService.log(userId, 'deployment.completed', 'Deployment', deploymentId, { environment: deployment.environment });
        logger.info(`Deployment ${deploymentId} completed successfully`);
      } catch (err) {
        await deployment.update({ status: 'failed', errorMessage: String(err) });
        notificationService.emitDeploymentStatus(projectId, deploymentId, 'failed');
        logger.error(`Deployment ${deploymentId} failed`, { err });
      }
    });

    return deployment;
  },

  async rollbackDeployment(deploymentId: string, projectId: string, userId: string): Promise<Deployment> {
    const deployment = await Deployment.findOne({ where: { id: deploymentId, projectId } });
    if (!deployment) throw Object.assign(new Error('Deployment not found'), { status: 404 });

    await deployment.update({ status: 'rolled-back' });
    notificationService.emitDeploymentStatus(projectId, deploymentId, 'rolled-back');
    await auditService.log(userId, 'deployment.rollback', 'Deployment', deploymentId, {});
    logger.info(`Deployment rolled back: ${deploymentId}`);
    return deployment;
  },

  async listDeployments(projectId: string): Promise<Deployment[]> {
    return Deployment.findAll({ where: { projectId }, order: [['createdAt', 'DESC']] });
  },

  async getDeployment(deploymentId: string, projectId: string): Promise<Deployment> {
    const dep = await Deployment.findOne({ where: { id: deploymentId, projectId } });
    if (!dep) throw Object.assign(new Error('Deployment not found'), { status: 404 });
    return dep;
  },
};
