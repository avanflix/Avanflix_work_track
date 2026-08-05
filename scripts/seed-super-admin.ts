/**
 * Bootstraps the single Super Admin account.
 * Run once against a fresh database:
 *
 * npm run seed:super-admin
 */

import { config } from "dotenv";

// Explicitly load .env.local
config({ path: ".env.local" });

import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User from "../models/User";

async function main() {
  const uri = process.env.MONGODB_URI;
  const email = process.env.SUPER_ADMIN_EMAIL;
  const password = process.env.SUPER_ADMIN_PASSWORD;

  // Debug (remove after confirming it works)
  console.log("MONGODB_URI:", uri);
  console.log("SUPER_ADMIN_EMAIL:", email);

  if (!uri || !email || !password) {
    throw new Error(
      "MONGODB_URI, SUPER_ADMIN_EMAIL, and SUPER_ADMIN_PASSWORD must be set in .env.local"
    );
  }

  await mongoose.connect(uri);

  const existing = await User.findOne({
    email: email.toLowerCase(),
  });

  if (existing) {
    console.log(`✅ Super Admin "${email}" already exists.`);
    await mongoose.disconnect();
    process.exit(0);
  }

  const passwordHash = await bcrypt.hash(password, 10);

  await User.create({
    name: "Super Admin",
    email: email.toLowerCase(),
    passwordHash,
    role: "SUPER_ADMIN",
    isActive: true,
  });

  console.log(`✅ Super Admin created successfully!`);
  console.log(`Email: ${email}`);
  console.log(`Password: ${password}`);

  await mongoose.disconnect();
  process.exit(0);
}

main().catch(async (error) => {
  console.error("❌ Error creating Super Admin:");
  console.error(error);

  try {
    await mongoose.disconnect();
  } catch {}

  process.exit(1);
});