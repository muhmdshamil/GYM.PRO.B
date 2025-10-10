
import jwt from 'jsonwebtoken';
import dotenv from "dotenv";
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET as string;

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is not defined in environment variables");
}

export interface JwtPayload {
  id: string;
  name: string;
  role: 'USER' | 'OWNER' | 'TRAINER';
}

const tokenBlacklist = new Set<string>();

export const signToken = (payload: JwtPayload): string => {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: '2h', 
    algorithm: 'HS256',
  });
};

export const verifyToken = (token: string): JwtPayload => {
  if (tokenBlacklist.has(token)) {
    throw new Error('Token has been invalidated');
  }
  
  return jwt.verify(token, JWT_SECRET) as JwtPayload;
};

export const invalidateToken = (token: string): void => {
  tokenBlacklist.add(token);
};

export const isTokenBlacklisted = (token: string): boolean => {
  return tokenBlacklist.has(token);
};

export const cleanupBlacklist = (): void => {
  if (tokenBlacklist.size > 1000) {
    tokenBlacklist.clear();
  }
};
