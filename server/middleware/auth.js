import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const authenticate = async (req, res, next) => {
  try {
    const header = req.header("Authorization") || "";
    const token = header.startsWith("Bearer ") ? header.slice(7).trim() : header.trim();
    if (!token) return res.status(401).json({ message: "Please log in to continue." });

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.id);
    if (!user || !user.isActive) {
      return res.status(401).json({ message: "This account is unavailable. Please contact the project administrator." });
    }
    req.user = user;
    next();
  } catch (_error) {
    return res.status(401).json({ message: "Your session is invalid or has expired. Please log in again." });
  }
};

export const requireRole = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({ message: "You do not have permission to perform this action." });
  }
  next();
};
