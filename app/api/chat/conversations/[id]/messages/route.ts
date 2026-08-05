import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { chatService } from "@/services/chatService";
import { rateLimit, getClientKey } from "@/lib/rateLimit";
import { z } from "zod";

// GET /api/chat/conversations/[id]/messages - only for conversations the
// caller is actually a member of. Marks the conversation as read as a
// side-effect (standard "opening a thread reads it" behavior).
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const userId = session.user.id as string;

  const member = await chatService.isParticipant(id, userId);
  if (!member) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const before = new URL(req.url).searchParams.get("before") ?? undefined;
  const items = await chatService.listMessages(id, { before });

  if (!before) {
    await chatService.markConversationRead(id, userId);
  }

  return NextResponse.json({ items });
}

const sendMessageSchema = z.object({
  content: z.string().min(1, "Message cannot be empty").max(4000),
});

// POST /api/chat/conversations/[id]/messages - send a message. Only
// members of the conversation may post to it.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!rateLimit(`send-message:${getClientKey(req)}:${session.user.id}`, 30, 60_000)) {
    return NextResponse.json({ error: "You're sending messages too fast, slow down." }, { status: 429 });
  }

  const { id } = await params;
  const userId = session.user.id as string;

  const member = await chatService.isParticipant(id, userId);
  if (!member) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const parsed = sendMessageSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const message = await chatService.sendMessage(id, userId, parsed.data.content);
    return NextResponse.json(message, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? "Could not send message" }, { status: 400 });
  }
}
