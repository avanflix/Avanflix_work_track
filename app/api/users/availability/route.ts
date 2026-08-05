import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { userService } from "@/services/userService";
import { updateAvailabilitySchema } from "@/lib/validations";

export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    // Only Admin and Super Admin can update employee availability
    if (
      session.user.role !== "ADMIN" &&
      session.user.role !== "SUPER_ADMIN"
    ) {
      return NextResponse.json(
        { message: "Forbidden" },
        { status: 403 }
      );
    }

    const body = await req.json();

    const parsed = updateAvailabilitySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        parsed.error.flatten(),
        { status: 400 }
      );
    }

    const user = await userService.updateAvailability({
      userId: parsed.data.userId,
      availabilityStatus: parsed.data.availabilityStatus,
      leaveFrom: parsed.data.leaveFrom,
      leaveTo: parsed.data.leaveTo,
      leaveReason: parsed.data.leaveReason,
      updatedBy: session.user.id,
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error("Update availability error:", error);

    return NextResponse.json(
      { message: "Failed to update availability" },
      { status: 500 }
    );
  }
}