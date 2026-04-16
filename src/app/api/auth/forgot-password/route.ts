import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import PasswordResetToken from '@/models/PasswordResetToken';
import { forgotPasswordSchema } from '@/lib/validations';
import { checkEmailRateLimit } from '@/lib/rate-limit';
import { generateSecureToken, hashToken } from '@/lib/auth-helpers';

// EDGE CASE: Token brute force â€” tokens are hashed with bcrypt, so rainbow table attacks don't work.
// Rate limiting (3 requests/hour/email) prevents targeted brute force.
// EDGE CASE: User changes email after requesting reset â€” token is tied to userId not email,
// so old token still works. Acceptable â€” token expires in 1 hour anyway.

export async function POST(req: Request) {
  try {
    const ip = req.headers.get('x-forwarded-for') || '0.0.0.0';
    
    // STEP 1 â€” Validate input
    const body = await req.json();
    const parsed = forgotPasswordSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ message: "Invalid email" }, { status: 400 });
    }
    const { email } = parsed.data;

    // STEP 2 â€” Rate limiting
    const rateCheck = await checkEmailRateLimit(email);
    if (rateCheck.limited) {
      return NextResponse.json({ message: "Too many reset requests. Wait 1 hour before requesting again." }, { status: 429 });
    }

    await dbConnect();

    // STEP 3 â€” IMPORTANT â€” Never reveal email existence
    const user = await User.findOne({ email: email.toLowerCase() });
    
    // STEP 4 â€” If user exists
    if (user) {
      // a. Generate token
      const rawToken = generateSecureToken();
      // b. Hash it
      const hashedToken = await hashToken(rawToken);
      
      // c. Delete unused tokens
      await PasswordResetToken.deleteMany({ userId: user._id, usedAt: null });
      
      // d. Create new token
      await PasswordResetToken.create({ 
        userId: user._id, 
        token: hashedToken, 
        tokenType: 'password_reset', 
        expiresAt: new Date(Date.now() + 60 * 60 * 1000), 
        ipAddress: ip 
      });

      // e. Build reset URL
      const resetUrl = `\${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/reset-password?token=\${rawToken}`;
      
      // f. Log to console for dev
      console.log('[DEV] Password reset URL:', resetUrl);
      
      // g. Add TODO:
      // TODO: trigger n8n webhook to send password reset email. Payload: { email, name: user.name, resetUrl, expiresIn: '1 hour' }
    }

    // STEP 5 â€” Return 200 regardless
    return NextResponse.json(
      { message: "If an account with this email exists, a reset link has been sent." },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Forgot Password Error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
