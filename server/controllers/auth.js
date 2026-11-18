import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

const safeUser = (user) => {
  const value = user.toObject ? user.toObject() : { ...user };
  delete value.password;
  delete value.__v;
  if (!value.name) value.name = [value.firstName, value.lastName].filter(Boolean).join(" ") || value.email;
  if (!value.role) value.role = "volunteer";
  return value;
};

export const register = async (req, res) => {
  try {
    const { name, firstName, lastName, email, password, role } = req.body;
    const cleanName = String(name || `${firstName || ""} ${lastName || ""}`).trim();
    const cleanEmail = String(email || "").trim().toLowerCase();
    const accountRole = String(role || "volunteer").toLowerCase();

    if (cleanName.length < 2) return res.status(400).json({ message: "Please enter your name." });
    if (!/^\S+@\S+\.\S+$/.test(cleanEmail)) return res.status(400).json({ message: "Please enter a valid email address." });
    if (!password || String(password).length < 8) return res.status(400).json({ message: "Password must be at least 8 characters." });
    if (!["volunteer", "organization"].includes(accountRole)) {
      return res.status(400).json({ message: "Choose Volunteer or Organization as the account type." });
    }

    const existing = await User.findOne({ email: cleanEmail });
    if (existing) return res.status(409).json({ message: "An account with this email already exists." });

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
      name: cleanName,
      email: cleanEmail,
      password: passwordHash,
      role: accountRole,
    });
    return res.status(201).json({ message: "Account created successfully. You can now log in.", user: safeUser(user) });
  } catch (error) {
    console.error("REGISTER ERROR:", error);
    if (error.code === 11000) return res.status(409).json({ message: "An account with this email already exists." });
    return res.status(500).json({ message: "Could not create the account. Please try again." });
  }
};

export const login = async (req, res) => {
  try {
    const email = String(req.body.email || "").trim().toLowerCase();
    const password = String(req.body.password || "");
    if (!email || !password) return res.status(400).json({ message: "Email and password are required." });

    const user = await User.findOne({ email }).select("+password");
    if (!user) return res.status(400).json({ message: "Invalid email or password." });
    if (!user.isActive) return res.status(403).json({ message: "This account has been deactivated." });

    const matches = await bcrypt.compare(password, user.password);
    if (!matches) return res.status(400).json({ message: "Invalid email or password." });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });
    return res.status(200).json({ token, user: safeUser(user) });
  } catch (error) {
    console.error("LOGIN ERROR:", error);
    return res.status(500).json({ message: "Login failed because of a server error." });
  }
};

export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword || String(newPassword).length < 8) {
      return res.status(400).json({ message: "Enter your current password and a new password of at least 8 characters." });
    }
    const user = await User.findById(req.user._id).select("+password");
    const matches = await bcrypt.compare(currentPassword, user.password);
    if (!matches) return res.status(400).json({ message: "Your current password is incorrect." });
    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
    return res.json({ message: "Password changed successfully." });
  } catch (error) {
    console.error("CHANGE PASSWORD ERROR:", error);
    return res.status(500).json({ message: "Could not change the password." });
  }
};
