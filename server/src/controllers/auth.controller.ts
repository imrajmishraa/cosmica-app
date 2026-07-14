import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database.js';
import { AuthService } from '../services/auth.service.js';
import { registerSchema, loginSchema } from '../validations/auth.validation.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ENV } from '../config/env.js';

const COOKIE_NAME = 'refreshToken';

const getCookieOptions = () => ({
  httpOnly: true,
  secure: ENV.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
});

export class AuthController {
  static async signup(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsed = registerSchema.safeParse(req.body);
      if (!parsed.success) {
        return next(new ApiError(400, parsed.error.issues[0].message));
      }

      const { email, password } = parsed.data;

      // Check if user already exists
      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        return next(new ApiError(400, 'Email already registered'));
      }

      // Hash password and save user
      const hashedPassword = await AuthService.hashPassword(password);
      const user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
        },
      });

      // Generate tokens
      const accessToken = AuthService.generateAccessToken(user.id, user.email, user.role);
      const refreshToken = AuthService.generateRefreshToken(user.id);

      // Save refresh token to db
      await AuthService.storeRefreshToken(user.id, refreshToken);

      // Send cookies and tokens
      res.cookie(COOKIE_NAME, refreshToken, getCookieOptions());
      res.status(201).json(
        new ApiResponse(201, 'User registered successfully', {
          accessToken,
          user: {
            id: user.id,
            email: user.email,
            role: user.role,
          },
        })
      );
    } catch (error) {
      next(error);
    }
  }

  static async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsed = loginSchema.safeParse(req.body);
      if (!parsed.success) {
        return next(new ApiError(400, parsed.error.issues[0].message));
      }

      const { email, password } = parsed.data;

      // Check user
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user || !(await AuthService.comparePassword(password, user.password))) {
        return next(new ApiError(401, 'Invalid email or password'));
      }

      // Generate tokens
      const accessToken = AuthService.generateAccessToken(user.id, user.email, user.role);
      const refreshToken = AuthService.generateRefreshToken(user.id);

      // Save refresh token to db
      await AuthService.storeRefreshToken(user.id, refreshToken);

      // Send cookies and tokens
      res.cookie(COOKIE_NAME, refreshToken, getCookieOptions());
      res.status(200).json(
        new ApiResponse(200, 'User logged in successfully', {
          accessToken,
          user: {
            id: user.id,
            email: user.email,
            role: user.role,
          },
        })
      );
    } catch (error) {
      next(error);
    }
  }

  static async refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const refreshToken = req.cookies[COOKIE_NAME];
      if (!refreshToken) {
        return next(new ApiError(401, 'Unauthorized: Missing refresh token'));
      }

      // Verify and fetch decoded token details
      const decoded = await AuthService.verifyRefreshToken(refreshToken);
      const user = await prisma.user.findUnique({ where: { id: decoded.userId } });

      if (!user) {
        return next(new ApiError(404, 'User not found'));
      }

      // Generate new access token
      const accessToken = AuthService.generateAccessToken(user.id, user.email, user.role);

      res.status(200).json(
        new ApiResponse(200, 'Access token refreshed successfully', {
          accessToken,
          user: {
            id: user.id,
            email: user.email,
            role: user.role,
          },
        })
      );
    } catch (error) {
      next(error);
    }
  }

  static async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const refreshToken = req.cookies[COOKIE_NAME];
      if (refreshToken) {
        await AuthService.revokeRefreshToken(refreshToken);
      }

      res.clearCookie(COOKIE_NAME, {
        httpOnly: true,
        secure: ENV.NODE_ENV === 'production',
        sameSite: 'lax',
      });

      res.status(200).json(
        new ApiResponse(200, 'Successfully logged out', null)
      );
    } catch (error) {
      next(error);
    }
  }
}
