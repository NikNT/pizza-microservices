import { NextFunction, Response } from "express";
import { RegisterUserRequest } from "../types";
import { UserService } from "../services/UserService";
import { Logger } from "winston";
import { validationResult } from "express-validator";

import { AppDataSource } from "../config/data-source";
import { RefreshToken } from "../entity/RefreshToken";
import { isLeapYear } from "../utils";
import { TokenService } from "../services/TokenService";
import { JwtPayload } from "jsonwebtoken";
export class AuthController {
  constructor(
    private userService: UserService,
    private logger: Logger,
    private tokenService: TokenService,
  ) {}
  async register(req: RegisterUserRequest, res: Response, next: NextFunction) {
    const result = validationResult(req);

    if (!result.isEmpty()) {
      return res.status(400).json({ errors: result.array() });
    }

    const { firstName, lastName, email, password } = req.body;

    this.logger.debug("New request to register user", {
      firstName,
      lastName,
      email,
    });
    try {
      const user = await this.userService.create({
        firstName,
        lastName,
        email,
        password,
      });
      this.logger.info("User created successfully", {
        id: user.id,
      });

      const payload: JwtPayload = {
        sub: String(user.id),
        role: user.role,
      };
      const accessToken = this.tokenService.generateAccessToken(payload);

      // Persist the refresh token
      const currentYear: number = new Date().getFullYear();
      const isLeap: boolean = isLeapYear(currentYear);

      const MS_IN_A_YEAR = 1000 * 60 * 60 * 24 * (isLeap ? 366 : 365);
      const refreshTokenRepo = AppDataSource.getRepository(RefreshToken);
      const newRefreshToken = await refreshTokenRepo.save({
        user: user,
        expiresAt: new Date(Date.now() + MS_IN_A_YEAR),
      });

      const refreshToken = this.tokenService.generateRefreshToken({
        ...payload,
        id: String(newRefreshToken.id),
      });

      // const refreshToken = sign(payload, Config.REFRESH_TOKEN_SECRET!, {
      //   algorithm: "HS256",
      //   expiresIn: "1y",
      //   issuer: "auth-service",
      //   jwtid: String(newRefreshToken.id),
      // });

      res.cookie("accessToken", accessToken, {
        domain: "localhost",
        sameSite: "strict",
        maxAge: 1000 * 60 * 60, // 1 hour
        httpOnly: true, // very important
      });

      res.cookie("refreshToken", refreshToken, {
        domain: "localhost",
        sameSite: "strict",
        maxAge: 1000 * 60 * 60 * 24 * 365, // 1 year
        httpOnly: true, // very important
      });

      res.status(201).json({
        id: user.id,
      });
    } catch (error) {
      next(error);
      return;
    }
  }
}
