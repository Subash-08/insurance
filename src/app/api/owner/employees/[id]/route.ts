import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { z } from 'zod';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

const patchSchema = z.object({
  status: z.enum(['active', 'suspended', 'rejected']).optional(),
  designation: z.string().optional(),
  rejectedReason: z.string().optional()
});

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any)?.role !== 'owner') {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    await dbConnect();
    const user = await User.findById(params.id).select('-passwordHash -rememberDevices');

    if (!user) return NextResponse.json({ message: 'User not found' }, { status: 404 });

    // Fetch dependent counts for true metrics
    let clientsCount = 0;
    let policiesCount = 0;
    try {
      const Client = (await import('@/models/Client')).default;
      const Policy = (await import('@/models/Policy')).default;
      clientsCount = await Client.countDocuments({ agentId: user._id });
      policiesCount = await Policy.countDocuments({ agentId: user._id });
    } catch {
      // Ignore if models don't exist yet
    }

    return NextResponse.json({ ...user.toJSON(), clientsCount, policiesCount });
  } catch (error: any) {
    return NextResponse.json({ message: 'Error' }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any)?.role !== 'owner') {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }
    const ownerId = (session.user as any)?.id || '';

    const body = await req.json();
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ errors: parsed.error.errors }, { status: 400 });

    await dbConnect();
    const user = await User.findById(params.id);
    if (!user) return NextResponse.json({ message: 'User not found' }, { status: 404 });

    const currentStatus = user.status;
    const newStatus = parsed.data.status;

    // Validate transitions ONLY if status is changing
    if (newStatus && newStatus !== currentStatus) {
      const validTransitions: Record<string, string[]> = {
        'pending_approval': ['active', 'rejected'],
        'active': ['suspended'],
        'suspended': ['active', 'rejected'],
        'rejected': ['active']
      };

      if (!validTransitions[currentStatus]?.includes(newStatus)) {
        return NextResponse.json({ message: `Invalid status transition from \${currentStatus} to \${newStatus}` }, { status: 400 });
      }

      user.status = newStatus;
      
      if (newStatus === 'active' && currentStatus === 'pending_approval') {
        user.approvedBy = ownerId;
        user.approvedAt = new Date();
      }
    }

    if (parsed.data.designation !== undefined) {
      user.designation = parsed.data.designation;
    }
    
    if (parsed.data.rejectedReason !== undefined) {
      user.rejectedReason = parsed.data.rejectedReason;
    }

    await user.save();

    // AuditLog
    try {
      const AuditLog = (await import('@/models/AuditLog')).default;
      await AuditLog.create({
        userId: ownerId,
        action: 'StatusChanged',
        module: 'User',
        details: `Employee \${user.name} status changed from \${currentStatus} to \${user.status}`
      });
    } catch {}

    // TODO: trigger n8n webhook to notify employee of status change

    // Wipe specific sensitive keys before returning
    const safeUser = user.toJSON();
    delete safeUser.passwordHash;
    delete safeUser.rememberDevices;

    return NextResponse.json(safeUser);
  } catch (error: any) {
    return NextResponse.json({ message: 'Error' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any)?.role !== 'owner') {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }
    const ownerId = (session.user as any)?.id || '';

    await dbConnect();
    
    let clientsCount = 0;
    let policiesCount = 0;
    try {
      const Client = (await import('@/models/Client')).default;
      const Policy = (await import('@/models/Policy')).default;
      clientsCount = await Client.countDocuments({ agentId: params.id });
      policiesCount = await Policy.countDocuments({ agentId: params.id });
    } catch {}

    if (clientsCount > 0 || policiesCount > 0) {
      return NextResponse.json({ message: "Cannot delete employee with existing clients. Suspend the account instead." }, { status: 409 });
    }

    const user = await User.findById(params.id);
    if (!user) return NextResponse.json({ message: 'Not found' }, { status: 404 });

    user.status = 'rejected';
    user.email = `deleted_\${Date.now()}_\${user.email}`;
    await user.save();

    try {
      const AuditLog = (await import('@/models/AuditLog')).default;
      await AuditLog.create({
        userId: ownerId,
        action: 'EmployeeDeleted',
        module: 'User',
        details: `Employee \${user.name} soft-deleted.`
      });
    } catch {}

    return NextResponse.json({ success: true, message: 'Deleted successfully' });
  } catch (error: any) {
    return NextResponse.json({ message: 'Error' }, { status: 500 });
  }
}
