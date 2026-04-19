import NextAuth, { DefaultSession, DefaultUser } from "next-auth";
import { JWT } from "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: 'owner' | 'employee';
      status: 'pending_approval' | 'active' | 'suspended' | 'rejected';
      designation?: string;
      agencyId?: string;
    } & DefaultSession["user"];
  }

  interface DefaultUser {
    id: string;
    role: 'owner' | 'employee';
    status: 'pending_approval' | 'active' | 'suspended' | 'rejected';
    designation?: string;
    agencyId?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: 'owner' | 'employee';
    status: 'pending_approval' | 'active' | 'suspended' | 'rejected';
    designation?: string;
    agencyId?: string;
    passwordChangedAt?: number;
    lastStatusCheck?: number;
  }
}
