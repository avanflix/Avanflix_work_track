import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { notificationService } from "@/services/notificationService";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const unreadOnly = new URL(req.url).searchParams.get("unread") === "true";
  const items = await notificationService.listForUser(session.user.id as string, unreadOnly);
  return NextResponse.json({ items });
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  if (body.markAll) {
    await notificationService.markAllRead(session.user.id as string);
    return NextResponse.json({ success: true });
  }

  if (body.id) {
    const updated = await notificationService.markRead(body.id, session.user.id as string);
    return NextResponse.json(updated);
  }

  return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
}
