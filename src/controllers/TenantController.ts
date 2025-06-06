import { NextFunction, Response } from "express";
import { TenantService } from "../services/TenantService";
import { CreateTenantRequest } from "../types";
import { Logger } from "winston";

export class TenantController {
  constructor(
    private tenantService: TenantService,
    private logger: Logger,
  ) {}
  async create(req: CreateTenantRequest, res: Response, next: NextFunction) {
    const { name, address } = req.body;
    try {
      const tenant = await this.tenantService.create({
        name,
        address,
      });
      this.logger.info("Tenant created", {
        id: tenant.id,
      });
      res.status(201).json({ id: tenant.id });
    } catch (err) {
      next(err);
    }
    res.status(201).json({});
  }
}
