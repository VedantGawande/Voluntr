import dotenv from "dotenv";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User from "../models/User.js";

dotenv.config();

const run = async () => {
  const mongoUrl = process.env.MONGO_URI || process.env.MONGO_URL;
  const name = process.env.ADMIN_NAME || "Voluntr Admin";
  const email = String(process.env.ADMIN_EMAIL || "").trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD || "";
  if (!mongoUrl || !email || password.length < 8) {
    throw new Error("Set MONGO_URI, ADMIN_EMAIL and ADMIN_PASSWORD (at least 8 characters) in server/.env first.");
  }
  await mongoose.connect(mongoUrl);
  const existing = await User.findOne({ email });
  if (existing) {
    existing.role = "admin";
    existing.isActive = true;
    existing.name = name;
    existing.password = await bcrypt.hash(password, 10);
    await existing.save();
    console.log(`Existing account ${email} has been assigned the admin role.`);
  } else {
    const hashedPassword = await bcrypt.hash(password, 10);
    await User.create({ name, email, password: hashedPassword, role: "admin" });
    console.log(`Admin account created: ${email}`);
  }
  await mongoose.disconnect();
};

run().catch(async (error) => {
  console.error("Could not create admin:", error.message);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
