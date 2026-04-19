import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import PasswordResetToken from '@/models/PasswordResetToken';
import { resetPasswordSchema } from '@/lib/validations';
import { hashPassword, compareToken, comparePassword } from '@/lib/auth-helpers';

// EDGE CASE: Slow iteration over tokens could be a timing attack.
// Mitigation: bcrypt compare is already time-constant. Token list is small (max 1 per user).
// EDGE CASE: What if passwordChangedAt update fails mid-save? The token is already marked used
// but JWT still valid. Mitigation: mark token used AFTER password save, not before.

export async function POST(req: Request) {
  try {
    // STEP 1 — Validate input
    const body = await req.json();
    const parsed = resetPasswordSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'invalid', message: "Invalid input data" }, { status: 400 });
    }
    const { token, newPassword } = parsed.data;

    await dbConnect();

    // STEP 2 — Find token
    // Get all unexpired, unused tokens
    const validTokens = await PasswordResetToken.find({ 
      tokenType: 'password_reset', 
      expiresAt: { $gt: new Date() }, 
      usedAt: null 
    });

    let matchedTokenDoc = null;
    for (const t of validTokens) {
        if (await compareToken(token, t.token)) {
            matchedTokenDoc = t;
            break;
        }
    }

    if (!matchedTokenDoc) {
        // Also check if it was used already to provide better error
        const allTokens = await PasswordResetToken.find({ tokenType: 'password_reset' });
        for (const t of allTokens) {
            if (await compareToken(token, t.token)) {
                if (t.usedAt) {
                    return NextResponse.json({ error: 'used', message: 'This reset link has already been used.' }, { status: 400 });
                }
            }
        }
        return NextResponse.json({ error: 'expired', message: 'This reset link has expired or is invalid.' }, { status: 400 });
    }

    // Find User
    const user = await User.findById(matchedTokenDoc.userId).select('+passwordHash');
    if (!user) {
        return NextResponse.json({ error: 'invalid', message: 'User not found.' }, { status: 400 });
    }

    // STEP 3 — Validate new password !== current password
    if (await comparePassword(newPassword, user.passwordHash)) {
        return NextResponse.json({ error: 'invalid', message: 'New password must be different from current password.' }, { status: 400 });
    }

    // STEP 4 — Update password
    user.passwordHash = await hashPassword(newPassword);
    user.passwordChangedAt = new Date();
    user.loginAttempts = 0;
    user.lockUntil = undefined;
    
    // STEP 6 — Clear all remember-device entries
    user.rememberDevices = [];
    
    await user.save();

    // STEP 5 — Mark token as used
    matchedTokenDoc.usedAt = new Date();
    await matchedTokenDoc.save();

    // STEP 7 — AuditLog
    try {
      const AuditLog = (await import('@/models/AuditLog')).default;
      await AuditLog.create({
        userId: user._id,
        action: 'PasswordReset',
        entity: 'Auth',
        details: 'User reset password via token'
      });
    } catch (e) {
      console.error("Audit log failed", e);
    }

    // STEP 8 — Return 200
    return NextResponse.json(
      { success: true, message: "Password reset successfully. You can now log in." },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Reset Password Error:', error);
    return NextResponse.json({ error: 'server_error', message: 'Internal Server Error' }, { status: 500 });
  }
}
