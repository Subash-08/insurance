import dbConnect from './mongodb';
import LoginAttempt from '@/models/LoginAttempt';
import PasswordResetToken from '@/models/PasswordResetToken';
import User from '@/models/User';

export async function checkIpRateLimit(ip: string): Promise<{ limited: boolean; attemptsLeft: number; resetInMinutes: number }> {
  await dbConnect();
  
  const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
  
  const count = await LoginAttempt.countDocuments({
    ip,
    success: false,
    createdAt: { $gte: fifteenMinutesAgo }
  });

  if (count >= 10) {
    return { limited: true, attemptsLeft: 0, resetInMinutes: 15 };
  }

  return { limited: false, attemptsLeft: 10 - count, resetInMinutes: 0 };
}

export async function checkEmailRateLimit(email: string): Promise<{ limited: boolean }> {
  await dbConnect();
  
  const user = await User.findOne({ email: email.toLowerCase().trim() }).select('_id');
  if (!user) {
    return { limited: false };
  }

  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  
  const count = await PasswordResetToken.countDocuments({
    userId: user._id,
    tokenType: 'password_reset',
    createdAt: { $gte: oneHourAgo }
  });

  return { limited: count >= 3 };
}
