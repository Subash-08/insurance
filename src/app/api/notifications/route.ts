import { NextRequest, NextResponse } from "next/server";
import { withApiHandler } from "@/lib/api-handler";
import dbConnect from "@/lib/mongodb";
import Notification from "@/models/Notification";

async function handler(req: NextRequest, ctx: any, session: any) {
  await dbConnect();

  const userId = session.user.id;
  const url = new URL(req.url);

  // Mark specific notification as read: PUT /api/notifications?action=mark_read&id=XYZ
  if (req.method === "PUT") {
    const action = url.searchParams.get("action");
    
    if (action === "mark_all_read") {
      await Notification.updateMany(
        { userId, isRead: false },
        { $set: { isRead: true } }
      );
      return NextResponse.json({ success: true });
    }

    if (action === "mark_read") {
      const id = url.searchParams.get("id");
      if (!id) throw new Error("Notification ID is required");
      
      const notif = await Notification.findOneAndUpdate(
        { _id: id, userId },
        { $set: { isRead: true } },
        { new: true }
      );
      if (!notif) throw new Error("Notification not found");
      return NextResponse.json({ success: true, notification: notif });
    }

    throw new Error("Invalid action parameter");
  }

  if (req.method === "GET") {
    // 1. Fetch last 20 notifications (read or unread) for history
    const notifications = await Notification.find({ userId })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    // 2. Fetch total unread count for badge
    const unreadCount = await Notification.countDocuments({ userId, isRead: false });

    return NextResponse.json({
      success: true,
      notifications,
      unreadCount,
    });
  }

  throw new Error(`Method ${req.method} not allowed`);
}

export const GET = withApiHandler(handler, true);
export const PUT = withApiHandler(handler, true);
