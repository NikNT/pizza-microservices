import express, { NextFunction, Request, Response } from "express";
import { AuthController } from "../controllers/AuthController";
import { UserService } from "../services/UserService";
import { AppDataSource } from "../config/data-source";
import { User } from "../entity/User";
import logger from "../config/logger";
import registerValidator from "../validators/register-validator";

const router = express.Router();

// Dependency Injection
const userRepository = AppDataSource.getRepository(User);
const userService = new UserService(userRepository);
const authController = new AuthController(userService, logger);

// Routes
router.post(
  "/register",
  registerValidator,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await authController.register(req, res, next);
    } catch (error) {
      next(error);
    }
  },
);
export default router;
