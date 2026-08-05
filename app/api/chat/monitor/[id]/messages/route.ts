import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { chatService } from "@/services/chatService";
import { canMonitorChats } from "@/utils/permissions";
import type { UserRole } from "@/types";

// GET /api/chat/monitor/[id]/messages - read-only view into a conversation
// for oversight purposes. Deliberately has no matching POST: monitoring is
// observe-only, it is not a backdoor to post as someone else's chat.
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (session.user as any).role as UserRole;
  if (!canMonitorChats(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const allowed = await chatService.canMonitorConversation(id, role);
  if (!allowed) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const before = new URL(req.url).searchParams.get("before") ?? undefined;
  const items = await chatService.listMessages(id, { before });

  return NextResponse.json({ items });
}
