export type UserRole = 'owner' | 'employee';
export type UserStatus = 'pending_approval' | 'active' | 'suspended' | 'rejected';

export interface IUser {
  _id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  status: UserStatus;
  profilePhoto?: string;
  mobile?: string;
  designation?: string;
  agencyId?: string;
  rememberDevices: { deviceHash: string; expiresAt: Date }[];
  loginAttempts: number;
  lockUntil?: Date;
  passwordChangedAt?: Date;
  lastLoginAt?: Date;
  lastLoginIp?: string;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
  approvedBy?: string;
  approvedAt?: Date;
  rejectedReason?: string;
  isLocked: boolean;
  isActive: boolean;
}

export interface IUserPublic {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  profilePhoto?: string;
  mobile?: string;
  designation?: string;
  agencyId?: string;
  lastLoginAt?: Date;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserSession {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  image?: string | null;
  designation?: string;
}

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
  confirmPassword?: string;
  mobile?: string;
  designation?: string;
}

export interface LoginInput {
  email: string;
  password: string;
  rememberDevice: boolean;
}

export interface ForgotPasswordInput {
  email: string;
}

export interface ResetPasswordInput {
  token: string;
  newPassword: string;
  confirmPassword?: string;
}

export interface AuthApiResponse {
  success: boolean;
  message: string;
  user?: IUserPublic;
}
