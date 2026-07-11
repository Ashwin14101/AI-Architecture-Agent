import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { User } from '../models/user.model';
import logger from '../utils/logger';

const SALT_ROUNDS = 12;

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export const authService = {
  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, SALT_ROUNDS);
  },

  async comparePassword(plain: string, hash: string): Promise<boolean> {
    return bcrypt.compare(plain, hash);
  },

  generateAccessToken(userId: string, role: string): string {
    const secret = process.env.JWT_ACCESS_SECRET!;
    const expiresIn = process.env.JWT_ACCESS_EXPIRES_IN || '15m';
    return jwt.sign({ userId, role }, secret, { expiresIn } as jwt.SignOptions);
  },

  generateRefreshToken(userId: string): string {
    const secret = process.env.JWT_REFRESH_SECRET!;
    const expiresIn = process.env.JWT_REFRESH_EXPIRES_IN || '7d';
    return jwt.sign({ userId }, secret, { expiresIn } as jwt.SignOptions);
  },

  verifyAccessToken(token: string): { userId: string; role: string } {
    return jwt.verify(token, process.env.JWT_ACCESS_SECRET!) as { userId: string; role: string };
  },

  verifyRefreshToken(token: string): { userId: string } {
    return jwt.verify(token, process.env.JWT_REFRESH_SECRET!) as { userId: string };
  },

  async register(username: string, email: string, password: string): Promise<{ user: User; tokens: TokenPair }> {
    const existing = await User.findOne({ where: { email } });
    if (existing) throw Object.assign(new Error('Email already registered'), { status: 409 });

    const existingUsername = await User.findOne({ where: { username } });
    if (existingUsername) throw Object.assign(new Error('Username already taken'), { status: 409 });

    const passwordHash = await this.hashPassword(password);
    const user = await User.create({ username, email, passwordHash });

    const tokens = await this.issueTokens(user);
    logger.info(`User registered: ${username}`);
    return { user, tokens };
  },

  async login(email: string, password: string): Promise<{ user: User; tokens: TokenPair }> {
    const user = await User.findOne({ where: { email } });
    if (!user) throw Object.assign(new Error('Invalid credentials'), { status: 401 });

    const valid = await this.comparePassword(password, user.passwordHash);
    if (!valid) throw Object.assign(new Error('Invalid credentials'), { status: 401 });

    const tokens = await this.issueTokens(user);
    logger.info(`User logged in: ${user.username}`);
    return { user, tokens };
  },

  async issueTokens(user: User): Promise<TokenPair> {
    const accessToken = this.generateAccessToken(user.id, user.role);
    const refreshToken = this.generateRefreshToken(user.id);
    await user.update({ refreshToken });
    return { accessToken, refreshToken };
  },

  async refresh(token: string): Promise<TokenPair> {
    let payload: { userId: string };
    try {
      payload = this.verifyRefreshToken(token);
    } catch {
      throw Object.assign(new Error('Invalid or expired refresh token'), { status: 401 });
    }

    const user = await User.findByPk(payload.userId);
    if (!user || user.refreshToken !== token) {
      throw Object.assign(new Error('Refresh token not recognized'), { status: 401 });
    }

    return this.issueTokens(user);
  },

  async logout(userId: string): Promise<void> {
    await User.update({ refreshToken: null }, { where: { id: userId } });
    logger.info(`User logged out: ${userId}`);
  },
};
