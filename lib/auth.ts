import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import type { UserRole } from "@/types";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt", maxAge: 8 * 60 * 60 }, // 8h sessions
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      name: "Email",
      credentials: {
        email: { label: "Company Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(raw) {
        const parsed = credentialsSchema.safeParse(raw);
        if (!parsed.success) return null;
        const { email, password } = parsed.data;

        await connectDB();
        const user = await User.findOne({ email: email.toLowerCase() }).select("+passwordHash");
        if (!user) return null;

        if (!user.isActive) {
          // Signals a specific reason the client can surface.
          throw new Error("ACCOUNT_DISABLED");
        }

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) return null;

        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role as UserRole,
          isActive: user.isActive,
          availabilityStatus: user.availabilityStatus,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.role = (user as any).role;
        token.isActive = (user as any).isActive;
        token.availabilityStatus = (user as any).availabilityStatus;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        (session.user as any).role = token.role;
        (session.user as any).isActive = token.isActive;
        (session.user as any).availabilityStatus = token.availabilityStatus;
      }

      return session;
    },
  },
});
