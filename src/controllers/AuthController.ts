import { NextFunction, Response } from "express";
import { AuthRequest, RegisterUserRequest } from "../types";
import { UserService } from "../services/UserService";
import { Logger } from "winston";
import { validationResult } from "express-validator";
import { TokenService } from "../services/TokenService";
import { JwtPayload } from "jsonwebtoken";
import createHttpError from "http-errors";
import { CredentialService } from "../services/CredentialService";
export class AuthController {
  constructor(
    private userService: UserService,
    private logger: Logger,
    private tokenService: TokenService,
    private credentialService: CredentialService,
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
      // generate access token
      const accessToken = this.tokenService.generateAccessToken(payload);

      // persist refresh token
      const newRefreshToken = await this.tokenService.persistRefreshToken(user);
      const refreshToken = this.tokenService.generateRefreshToken({
        ...payload,
        id: String(newRefreshToken.id),
      });

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

  async login(req: RegisterUserRequest, res: Response, next: NextFunction) {
    const result = validationResult(req);

    if (!result.isEmpty()) {
      return res.status(400).json({ errors: result.array() });
    }

    const { email, password } = req.body;

    this.logger.debug("New request to login a user", {
      email,
    });

    try {
      // check if user (email) exists in the database
      const user = await this.userService.findByEmail(email);

      if (!user) {
        const err = createHttpError(400, "Invalid credentials");
        next(err);
        return;
      }

      // compare the password with the hashed password in the database
      const passwordMatch = await this.credentialService.comparePassword(
        password,
        user.password,
      );

      if (!passwordMatch) {
        const err = createHttpError(400, "Invalid credentials");
        next(err);
        return;
      }

      const payload: JwtPayload = {
        sub: String(user.id),
        role: user.role,
      };

      // generate access token
      const accessToken = this.tokenService.generateAccessToken(payload);

      // persist refresh token
      const newRefreshToken = await this.tokenService.persistRefreshToken(user);
      const refreshToken = this.tokenService.generateRefreshToken({
        ...payload,
        id: String(newRefreshToken.id),
      });

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

      this.logger.info("User logged in successfully", {
        id: user.id,
      });
      res.status(200).json({
        id: user.id,
      });
    } catch (error) {
      next(error);
      return;
    }
  }

  async self(req: AuthRequest, res: Response) {
    const user = await this.userService.findbyId(Number(req.auth.sub));
    res.status(200).json(user);
  }
}
