import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any)?.role !== 'owner') {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const statusFilter = searchParams.get('status');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    const query: any = { role: 'employee' };
    
    if (statusFilter && statusFilter !== 'all') {
      query.status = statusFilter;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    await dbConnect();

    // We can use $facet to get stats and data concurrently
    const aggregateQuery = [
      { $match: query },
      { $sort: { createdAt: -1 as const } },
      { $skip: (page - 1) * limit },
      { $limit: limit },
      { $project: { passwordHash: 0, rememberDevices: 0 } }
    ];

    const employees = await User.aggregate(aggregateQuery);
    
    // Stats Pipeline - separate from the filtered list to always show exact counts
    const statsResult = await User.aggregate([
      { $match: { role: 'employee' } },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 }
        }
      }
    ]);

    const stats = {
      total: 0,
      active: 0,
      pending_approval: 0,
      suspended: 0,
      rejected: 0,
    };

    statsResult.forEach(s => {
      if (s._id in stats) {
        (stats as any)[s._id] = s.count;
      }
      stats.total += s.count;
    });

    const totalFiltered = await User.countDocuments(query);

    return NextResponse.json({
      employees,
      stats,
      pagination: {
        total: totalFiltered,
        page,
        limit,
        pages: Math.ceil(totalFiltered / limit)
      }
    });

  } catch (error: any) {
    console.error('Fetch Employees Error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
