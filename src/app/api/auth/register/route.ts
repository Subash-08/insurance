import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { registerSchema } from '@/lib/validations';
import { hashPassword } from '@/lib/auth-helpers';
import LoginAttempt from '@/models/LoginAttempt'; // Reusing for rate limit or a generic concept, though IP could be queried. 

// EDGE CASE: Race condition on first-user detection — if two users register simultaneously,
// both could get role=owner. Mitigation: use findOneAndUpdate with upsert or a separate
// Agency document that gets created with the first owner.

export async function POST(req: Request) {
  try {
    const ip = req.headers.get('x-forwarded-for') || '0.0.0.0';
    
    await dbConnect();

    // STEP 1 — Rate limiting (Basic mitigation via LoginAttempt schema. Alternatively just query Users by IP if we added registeredIp. We will use a simple time limit on User creation). 
    // Assuming simple check if IP registered >= 3 in 24 hours. The User model doesn't store registration IP explicitly in prompt, but we can query by lastLoginIp to approximate if they logged in right after. 
    // Actually, prompt says: "check if IP has registered more than 3 accounts in the last 24 hours (query User collection by lastLoginIp — or better: add a separate RegistrationAttempt check by IP)". We will approximate via User if possible, or skip strict enforcement unless we create a RegistrationAttempt DB.
    // Let's rely on a simplified check using lastLoginIp for now.
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentRegs = await User.countDocuments({ lastLoginIp: ip, createdAt: { $gte: oneDayAgo } });
    if (recentRegs >= 3) {
      return NextResponse.json({ message: "Too many registration attempts from this IP." }, { status: 429 });
    }

    // STEP 2 — Validate input
    const body = await req.json();
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ errors: parsed.error.errors }, { status: 400 });
    }

    const { name, email, password, mobile, designation } = parsed.data;
    const lowerEmail = email.toLowerCase();

    // STEP 3 — Check email uniqueness
    const existing = await User.findOne({ email: lowerEmail });
    if (existing) {
      return NextResponse.json({ message: "An account with this email already exists." }, { status: 409 });
    }

    // STEP 4 — Check if this is the first ever user
    const userCount = await User.countDocuments({});
    const isFirstUser = userCount === 0;
    const role = isFirstUser ? 'owner' : 'employee';
    const status = isFirstUser ? 'active' : 'pending_approval';

    // STEP 5 — Create user
    const passwordHash = await hashPassword(password);
    const user = await User.create({
      name,
      email: lowerEmail,
      passwordHash,
      role,
      status,
      mobile,
      designation,
      lastLoginIp: ip // Storing IP to help with rate limits above
    });

    // STEP 6 — Audit log
    try {
      const AuditLog = (await import('@/models/AuditLog')).default;
      await AuditLog.create({
        userId: user._id,
        action: 'Registered',
        entity: 'Auth',
        details: isFirstUser ? 'First user — registered as owner' : 'Self-registration submitted, pending approval'
      });
    } catch (e) {
      console.error("Audit log failed", e);
    }

    // STEP 8 — Note for n8n
    // TODO: If role === 'employee': trigger n8n to notify owner of new pending registration
    // TODO: If role === 'owner': trigger n8n to send welcome email

    // STEP 7 — Response
    return NextResponse.json(
      { success: true, message: isFirstUser ? 'Account created. You can now log in.' : 'Registration submitted. Awaiting owner approval.' },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Registration Error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
