import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { chatService } from "@/services/chatService";
import { canMonitorChats } from "@/utils/permissions";
import User from "@/models/User";
import { connectDB } from "@/lib/db";
import type { UserRole } from "@/types";

// GET /api/chat/monitor - oversight list.
//   SUPER_ADMIN sees every conversation (all Employee + Admin chats).
//   ADMIN sees every conversation that includes at least one Employee.
// Read-only: this endpoint never exposes a way to post into these threads
// unless the caller is also a participant (that goes through the normal
// /api/chat/conversations endpoints instead).
export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (session.user as any).role as UserRole;
  if (!canMonitorChats(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const conversations = await chatService.listMonitorConversations(role);

  await connectDB();
  const allUserIds = Array.from(
    new Set(conversations.flatMap((c: any) => c.participants.map((p: any) => p.toString())))
  );
  const users = await User.find({ _id: { $in: allUserIds } }, "name role department isActive").lean();
  const userMap = new Map(users.map((u: any) => [u._id.toString(), u]));

  const items = conversations.map((c: any) => {
    const participantDetails = c.participants
      .map((p: any) => userMap.get(p.toString()))
      .filter(Boolean);

    const isDirect = c.type === "DIRECT";
    const displayName = isDirect
      ? participantDetails.map((u: any) => u.name).join(" & ") || "Direct chat"
      : c.name ?? "Company Group";

    return { ...c, displayName, participantDetails };
  });

  return NextResponse.json({ items });
}
