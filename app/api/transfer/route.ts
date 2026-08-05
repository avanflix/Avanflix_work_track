import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { transferService } from "@/services/transferService";
import { isAdminLike } from "@/utils/permissions";

// GET /api/transfer?scope=pending|mine
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (session.user as any).role;
  const { searchParams } = new URL(req.url);
  const scope = searchParams.get("scope") ?? (isAdminLike(role) ? "pending" : "mine");

  if (scope === "pending" && isAdminLike(role)) {
    const items = await transferService.listPendingForApprover(role);
    return NextResponse.json({ items });
  }

  const items = await transferService.listMine(session.user.id as string);
  return NextResponse.json({ items });
}
