import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import helmet from "helmet";
import morgan from "morgan";
import path from "path";
import { fileURLToPath } from "url";
import authRoutes from "./routes/auth.js";
import apiRoutes from "./routes/api.js";

dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();

app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:3000" }));
app.use(helmet());
app.use(helmet.crossOriginResourcePolicy({ policy: "cross-origin" }));
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true, limit: "2mb" }));
app.use(morgan("dev"));
app.use("/assets", express.static(path.join(__dirname, "public/assets")));

app.get("/health", (_req, res) => res.json({ status: "ok", name: "Voluntr API" }));
app.use("/auth", authRoutes);
app.use("/api", apiRoutes);

app.use((req, res) => res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` }));
app.use((error, _req, res, _next) => {
  console.error("UNHANDLED REQUEST ERROR:", error);
  res.status(500).json({ message: "An unexpected server error occurred." });
});

const PORT = process.env.PORT || 5000;
const mongoUrl = process.env.MONGO_URI || process.env.MONGO_URL;

const migrateLegacyUsers = async () => {
  const collection = mongoose.connection.collection("users");
  const legacyUsers = collection.find({
    $or: [
      { name: { $exists: false } },
      { role: { $exists: false } },
      { isActive: { $exists: false } },
    ],
  });
  let migrated = 0;
  for await (const oldUser of legacyUsers) {
    const name = [oldUser.firstName, oldUser.lastName].filter(Boolean).join(" ").trim() || oldUser.email || "Volunteer";
    const role = ["volunteer", "organization", "admin"].includes(String(oldUser.role || "").toLowerCase())
      ? String(oldUser.role).toLowerCase()
      : "volunteer";
    await collection.updateOne(
      { _id: oldUser._id },
      {
        $set: {
          name,
          email: String(oldUser.email || "").trim().toLowerCase(),
          role,
          isActive: oldUser.isActive !== false,
          volunteerProfile: oldUser.volunteerProfile || {
            phone: "",
            city: oldUser.location || "",
            bio: oldUser.about || "",
            skills: [],
            interests: [],
            availability: "",
          },
          organizationProfile: oldUser.organizationProfile || {},
        },
        $unset: { resetPasswordToken: "", resetPasswordExpires: "" },
      }
    );
    migrated += 1;
  }
  if (migrated) console.log(`Migrated ${migrated} existing account(s) to the Voluntr role/profile format.`);
};

const startServer = async () => {
  if (!mongoUrl) throw new Error("Set MONGO_URI in server/.env.");
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 16) {
    throw new Error("Set JWT_SECRET in server/.env to a secret of at least 16 characters.");
  }
  await mongoose.connect(mongoUrl);
  console.log("Connected to MongoDB.");
  await migrateLegacyUsers();
  app.listen(PORT, () => console.log(`Voluntr API listening on http://localhost:${PORT}`));
};

startServer().catch((error) => {
  console.error("Failed to start server:", error.message);
  process.exit(1);
});

export default app;
