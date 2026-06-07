import jwt, { SignOptions } from 'jsonwebtoken';
import dotenv from 'dotenv';
import { AuthPayload } from '../types/index.js';

dotenv.config();

const SECRET = process.env.JWT_SECRET || 'your-secret-key';
const EXPIRATION = process.env.JWT_EXPIRATION || '24h';
const REFRESH_EXPIRATION = process.env.JWT_REFRESH_EXPIRATION || '7d';

export const generateTokens = (payload: AuthPayload) => {
  const accessOptions: SignOptions = {
    expiresIn: EXPIRATION as SignOptions['expiresIn'],
  };

  const accessToken = jwt.sign(payload, SECRET, {
    ...accessOptions,
  });

  const refreshOptions: SignOptions = {
    expiresIn: REFRESH_EXPIRATION as SignOptions['expiresIn'],
  };

  const refreshToken = jwt.sign(payload, SECRET, {
    ...refreshOptions,
  });

  return { accessToken, refreshToken };
};

export const verifyToken = (token: string): AuthPayload | null => {
  try {
    return jwt.verify(token, SECRET) as AuthPayload;
  } catch (error) {
    return null;
  }
};
