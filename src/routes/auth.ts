import express, { NextFunction, Request, Response } from "express";
import { AuthController } from "../controllers/AuthController";
import { UserService } from "../services/UserService";
import { AppDataSource } from "../config/data-source";
import { User } from "../entity/User";
import logger from "../config/logger";
import registerValidator from "../validators/register-validator";
import loginValidator from "../validators/login-validator";
import { TokenService } from "../services/TokenService";
import { RefreshToken } from "../entity/RefreshToken";
import { CredentialService } from "../services/CredentialService";
import authenticate from "../middlewares/authenticate";
import { AuthRequest } from "../types";

const router = express.Router();

// Dependency Injection
const userRepository = AppDataSource.getRepository(User);
const tokenRepository = AppDataSource.getRepository(RefreshToken);
const userService = new UserService(userRepository);
const tokenService = new TokenService(tokenRepository);
const credentialService = new CredentialService();
const authController = new AuthController(
  userService,
  logger,
  tokenService,
  credentialService,
);

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

router.post(
  "/login",
  loginValidator,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await authController.login(req, res, next);
    } catch (error) {
      next(error);
    }
  },

  router.get("/self", authenticate, async (req: Request, res: Response) => {
    try {
      await authController.self(req as AuthRequest, res);
    } catch (error) {
      console.log(error);
    }
  }),

  router.post("/refresh", (req: Request, res: Response) => {
    authController.refresh(req, res);
  }),
);
export default router;
