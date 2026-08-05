import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { chatService } from "@/services/chatService";
import User from "@/models/User";
import { connectDB } from "@/lib/db";
import { z } from "zod";

// GET /api/chat/conversations - the current user's own conversations
// (their direct chats + the company-wide group), newest activity first.
export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session.user.id as string;
  const conversations = await chatService.listConversationsForUser(userId);

  await connectDB();
  const otherUserIds = Array.from(
    new Set(
      conversations
        .filter((c: any) => c.type === "DIRECT")
        .flatMap((c: any) => c.participants.map((p: any) => p.toString()))
        .filter((id: string) => id !== userId)
    )
  );
  const otherUsers = await User.find(
    { _id: { $in: otherUserIds } },
    "name role department isActive"
  ).lean();
  const userMap = new Map(otherUsers.map((u: any) => [u._id.toString(), u]));

  const unreadMap = await chatService.unreadCountsForUser(
    conversations.map((c: any) => c._id.toString()),
    userId
  );

  const items = conversations.map((c: any) => {
    const isDirect = c.type === "DIRECT";
    const otherId = isDirect
      ? c.participants.map((p: any) => p.toString()).find((id: string) => id !== userId)
      : undefined;
    const other = otherId ? userMap.get(otherId) : undefined;

    return {
      ...c,
      displayName: isDirect ? other?.name ?? "Unknown user" : c.name ?? "Company Group",
      otherParticipant: other
        ? { _id: other._id, name: other.name, role: other.role, department: other.department, isActive: other.isActive }
        : undefined,
      unreadCount: unreadMap[c._id.toString()] ?? 0,
    };
  });

  return NextResponse.json({ items });
}

const startConversationSchema = z.object({
  userId: z.string().min(1),
});

// POST /api/chat/conversations - start (or fetch existing) a 1:1 chat with
// another active user. Any role can message any other role.
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = startConversationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const convo = await chatService.getOrCreateDirectConversation(
      session.user.id as string,
      parsed.data.userId
    );
    return NextResponse.json(convo, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? "Could not start conversation" }, { status: 400 });
  }
}
