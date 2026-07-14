import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/database.js';
import { ApiError } from '../utils/ApiError.js';

import { ENV } from '../config/env.js';

const JWT_SECRET = ENV.JWT_SECRET;
const JWT_REFRESH_SECRET = ENV.JWT_REFRESH_SECRET;

export class AuthService {
  static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 12);
  }

  static async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  static generateAccessToken(userId: string, email: string, role: string): string {
    return jwt.sign({ userId, email, role }, JWT_SECRET, { expiresIn: '15m' });
  }

  static generateRefreshToken(userId: string): string {
    return jwt.sign({ userId }, JWT_REFRESH_SECRET, { expiresIn: '7d' });
  }

  static async storeRefreshToken(userId: string, token: string): Promise<void> {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await prisma.refreshToken.create({
      data: {
        token,
        userId,
        expiresAt,
      },
    });
  }

  static async verifyRefreshToken(token: string): Promise<{ userId: string }> {
    try {
      const decoded = jwt.verify(token, JWT_REFRESH_SECRET) as { userId: string };

      const storedToken = await prisma.refreshToken.findUnique({
        where: { token },
      });

      if (!storedToken || storedToken.expiresAt < new Date()) {
        if (storedToken) {
          await prisma.refreshToken.delete({ where: { token } });
        }
        throw new ApiError(401, 'Refresh token expired or invalid');
      }

      return decoded;
    } catch {
      throw new ApiError(401, 'Invalid refresh token');
    }
  }

  static async revokeRefreshToken(token: string): Promise<void> {
    try {
      await prisma.refreshToken.delete({
        where: { token },
      });
    } catch {
      // Ignore if token not found or already deleted
    }
  }
}
