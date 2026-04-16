import bcryptjs from 'bcryptjs';
import crypto from 'crypto';
import { IUserPublic } from '@/types/auth'; 

export async function hashPassword(password: string): Promise<string> {
  return bcryptjs.hash(password, 12);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcryptjs.compare(password, hash);
}

export function generateSecureToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export async function hashToken(token: string): Promise<string> {
  return bcryptjs.hash(token, 12); 
}

export async function compareToken(token: string, hash: string): Promise<boolean> {
  return bcryptjs.compare(token, hash);
}

export function sanitizeUser(user: any): IUserPublic {
  const u = user.toObject ? user.toObject() : { ...user };
  
  if (u._id) u._id = u._id.toString();
  if (u.agencyId) u.agencyId = u.agencyId.toString();

  delete u.passwordHash;
  delete u.rememberDevices;
  delete u.loginAttempts;
  delete u.lockUntil;
  delete u.passwordChangedAt;
  
  return u as IUserPublic;
}

export function getDeviceHash(userAgent: string, ip: string): string {
  return crypto.createHash('sha256').update(`${userAgent}-${ip}`).digest('hex');
}
