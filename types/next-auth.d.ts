import { DefaultSession } from "next-auth";
import { UserRole } from "@/types";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: UserRole;
      isActive: boolean;
      availabilityStatus: "ACTIVE" | "ON_LEAVE" | "INACTIVE";
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    role: UserRole;
    isActive: boolean;
    availabilityStatus: "ACTIVE" | "ON_LEAVE" | "INACTIVE";
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: UserRole;
    isActive: boolean;
    availabilityStatus: "ACTIVE" | "ON_LEAVE" | "INACTIVE";
  }
}