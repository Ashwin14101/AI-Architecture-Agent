import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { terraformService } from '../services/terraform.service';

const p = (v: string | string[]): string => (Array.isArray(v) ? v[0] : v);

export const terraformController = {
  async getTerraform(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await terraformService.getTerraformCode(p(req.params['id']));
      if (!result) { res.status(404).json({ error: 'No Terraform code available' }); return; }
      res.status(200).json({ terraformCode: result.code, versionId: result.versionId });
    } catch (err) { next(err); }
  },

  async downloadTerraform(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const zipBuffer = await terraformService.downloadTerraformZip(p(req.params['id']));
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', `attachment; filename="terraform-${p(req.params['id'])}.zip"`);
      res.status(200).send(zipBuffer);
    } catch (err) { next(err); }
  },

  async validateTerraform(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await terraformService.validateTerraform(p(req.params['id']));
      res.status(result.valid ? 200 : 422).json(result);
    } catch (err) { next(err); }
  },

  async getCloudMapping(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const mapping = await terraformService.getCloudMapping(p(req.params['id']));
      if (!mapping) { res.status(404).json({ error: 'No cloud mapping available' }); return; }
      res.status(200).json({ cloudMapping: mapping });
    } catch (err) { next(err); }
  },
};
