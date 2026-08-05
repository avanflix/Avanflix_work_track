import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { chatService } from "@/services/chatService";

// GET /api/chat/contacts - everyone active except me. Any role can message
// any other role, so this is intentionally not gated by VIEW_ALL_EMPLOYEES.
export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const contacts = await chatService.listContacts(session.user.id as string);
  return NextResponse.json({ items: contacts });
}
