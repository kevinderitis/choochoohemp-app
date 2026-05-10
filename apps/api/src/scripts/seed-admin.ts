import bcrypt from "bcryptjs";
import { connectDb } from "../config/db.js";
import { env } from "../config/env.js";
import { User } from "../models/User.js";
import { getSettings } from "../services/settings.js";

async function main() {
  await connectDb();
  const passwordHash = await bcrypt.hash(env.ADMIN_PASSWORD, 10);
  const admin = await User.findOneAndUpdate(
    { email: env.ADMIN_EMAIL.toLowerCase() },
    {
      $set: {
        name: "Choo Choo Admin",
        email: env.ADMIN_EMAIL.toLowerCase(),
        passwordHash,
        role: "admin",
        phone: "",
        address: ""
      }
    },
    { new: true, upsert: true }
  );
  await getSettings();
  console.log(`Admin ready: ${admin.email}`);
  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
