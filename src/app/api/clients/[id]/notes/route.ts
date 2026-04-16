import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Client from "@/models/Client";
import mongoose from "mongoose";

type Params = { params: { id: string } };

// ─── POST /api/clients/[id]/notes ─────────────────────────────────────────────
// APPEND-ONLY — PUT and DELETE are explicitly blocked
export async function POST(req: Request, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }
  const user = session.user as any;

  if (!mongoose.isValidObjectId(params.id)) {
    return NextResponse.json({ success: false, message: "Invalid ID" }, { status: 400 });
  }

  const body = await req.json();
  const { text } = body;

  if (!text?.trim()) {
    return NextResponse.json(
      { success: false, message: "Note text is required", field: "text" },
      { status: 400 }
    );
  }

  await dbConnect();
  const client = await Client.findOne({ _id: params.id, isActive: true });
  if (!client) {
    return NextResponse.json({ success: false, message: "Client not found" }, { status: 404 });
  }

  // Ownership check
  if (user.role === "employee" && client.agentId.toString() !== user.id) {
    return NextResponse.json({ success: false, message: "Access denied" }, { status: 403 });
  }

  const note = {
    text: text.trim(),
    addedBy: new mongoose.Types.ObjectId(user.id),
    addedAt: new Date(),
  };

  client.notes.push(note as any);
  await client.save();

  return NextResponse.json({ success: true, data: note }, { status: 201 });
}

// Block PUT and DELETE explicitly
export async function PUT() {
  return NextResponse.json(
    { success: false, message: "Notes cannot be edited. They are append-only." },
    { status: 405 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    { success: false, message: "Notes cannot be deleted." },
    { status: 405 }
  );
}
