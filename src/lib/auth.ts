import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import LoginAttempt from "@/models/LoginAttempt";
import { loginSchema } from "@/lib/validations";
import { checkIpRateLimit } from "@/lib/rate-limit";
import { verifyPassword, getDeviceHash, comparePassword, sanitizeUser } from "@/lib/auth-helpers";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        rememberDevice: { label: "Remember Device", type: "text" }
      },
      async authorize(credentials, req) {
        // STEP 1 - Input validation
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) {
          throw new Error("Invalid input");
        }
        const { email, password, rememberDevice } = parsed.data;

        // STEP 2 - IP-based rate limiting
        // We need to extract IP from req. NextAuth wraps it but headers could be accessed if explicitly passed. 
        // For standard NextAuth we can fallback to req.headers['x-forwarded-for'] if provided.
        const ip = (req?.headers?.['x-forwarded-for'] as string) || '0.0.0.0';
        const userAgent = (req?.headers?.['user-agent'] as string) || 'unknown';

        const rateLimit = await checkIpRateLimit(ip);
        if (rateLimit.limited) {
          throw new Error("Too many login attempts from this IP. Try again in 15 minutes.");
        }

        // STEP 3 - Find user
        await dbConnect();
        const user = await User.findByEmail(email);

        if (!user) {
          await LoginAttempt.create({ ip, email, success: false, userAgent });
          throw new Error("No account found with this email.");
        }

        // STEP 4 - Status checks
        if (user.status === 'rejected') throw new Error("Your registration was rejected. Contact the agency owner.");
        if (user.status === 'pending_approval') throw new Error("Your account is pending approval by the agency owner.");
        if (user.status === 'suspended') throw new Error("Your account has been suspended. Contact the agency owner.");
        if (user.status !== 'active') throw new Error("Account not active.");

        // STEP 5 - Lock check
        if (user.isLocked) {
          throw new Error("Account locked due to too many failed attempts. Try again in 30 minutes.");
        }

        // STEP 6 - Password verification
        const valid = await comparePassword(password, user.passwordHash);
        if (!valid) {
          await user.incrementLoginAttempts();
          await LoginAttempt.create({ ip, email, success: false, userAgent });
          const remaining = Math.max(0, 5 - (user.loginAttempts || 1));
          throw new Error(remaining > 0 ? `Incorrect password. ${remaining} attempt(s) remaining.` : "Account locked due to too many failed attempts.");
        }

        // STEP 7 - Successful login
        await user.resetLoginAttempts();
        user.lastLoginAt = new Date();
        user.lastLoginIp = ip;

        // STEP 8 - Remember device
        if (rememberDevice) {
          const deviceHash = getDeviceHash(userAgent, ip);
          await user.addRememberDevice(deviceHash);
        } else {
          await user.save(); // if addRememberDevice was called, it calls save()
        }

        await LoginAttempt.create({ ip, email, success: true, userAgent });

        return sanitizeUser(user) as any;
      }
    })
  ],
  session: {
    strategy: "jwt"
  },
  pages: {
    signIn: '/login',
    error: '/login'
  },
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user._id || (user as any).id;
        token.role = (user as any).role;
        token.status = (user as any).status;
        token.designation = (user as any).designation;
        token.passwordChangedAt = (user as any).passwordChangedAt ? new Date((user as any).passwordChangedAt).getTime() : undefined;
        token.lastStatusCheck = Date.now();
      }

      if (trigger === 'update' && session) {
        token = { ...token, ...session };
      }

      // Check DB for password change AND status if token check is older than 5 mins
      if (token.id) {
        const lastCheck = (token.lastStatusCheck as number) || (token.iat ? token.iat * 1000 : 0);
        const now = Date.now();
        if (now - lastCheck > 5 * 60 * 1000) {
          await dbConnect();
          const dbUser = await User.findById(token.id).select('passwordChangedAt status');
          if (dbUser) {
            // Check password change invalidation
            if (dbUser.passwordChangedAt) {
              const dbChangedAt = dbUser.passwordChangedAt.getTime();
              if (token.passwordChangedAt && dbChangedAt > token.passwordChangedAt) {
                return {} as any; // Invalidates token
              }
            }

            // Re-fetch status and update if it changed. If suspended or rejected, destroy token.
            if (dbUser.status !== 'active') {
              return {} as any; // Destroy session immediately if suspended
            }

            token.status = dbUser.status;
            token.lastStatusCheck = now;
          } else {
            return {} as any; // User deleted
          }
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (token && token.id) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.status = token.status;
        session.user.designation = token.designation;
      }
      return session;
    }
  },
  // We can inject audit logging here but the instructions mention doing it on events.
  events: {
    async signIn(message) {
      // Stub for audit log (AuditLog model should exist or be created elsewhere)
      if (message.user) {
        try {
          const AuditLog = (await import('@/models/AuditLog')).default; // Assuming it exists
          await AuditLog.create({
            userId: message.user.id || (message.user as any)._id,
            action: 'Login',
            module: 'Auth',
            details: 'Successful login'
          });
        } catch (e) { console.error('AuditLog error', e); }
      }
    },
    async signOut(message) {
      if (message.token) {
        try {
          const AuditLog = (await import('@/models/AuditLog')).default;
          await AuditLog.create({
            userId: message.token.id,
            action: 'Logout',
            module: 'Auth',
            details: 'User logged out'
          });
        } catch (e) { console.error('AuditLog error', e); }
      }
    }
  }
};
