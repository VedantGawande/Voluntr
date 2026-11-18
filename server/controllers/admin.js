import User from "../models/User.js";
import Opportunity from "../models/Opportunity.js";
import Application from "../models/Application.js";

export const getAdminOverview = async (_req, res) => {
  try {
    const [volunteers, organizations, totalOpportunities, openOpportunities, applications] = await Promise.all([
      User.countDocuments({ role: "volunteer" }),
      User.countDocuments({ role: "organization" }),
      Opportunity.countDocuments(),
      Opportunity.countDocuments({ status: "open" }),
      Application.countDocuments(),
    ]);
    return res.json({ volunteers, organizations, totalOpportunities, openOpportunities, applications });
  } catch (error) {
    console.error("ADMIN OVERVIEW ERROR:", error);
    return res.status(500).json({ message: "Could not load admin overview." });
  }
};

export const listUsers = async (_req, res) => {
  try {
    const users = await User.find().select("name email role isActive createdAt").sort({ createdAt: -1 });
    return res.json(users);
  } catch (error) {
    console.error("ADMIN USERS ERROR:", error);
    return res.status(500).json({ message: "Could not load users." });
  }
};

export const setUserActive = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found." });
    if (String(user._id) === String(req.user._id)) return res.status(400).json({ message: "You cannot deactivate your own admin account." });
    if (user.role === "admin") return res.status(400).json({ message: "This action is not available for admin accounts." });
    user.isActive = Boolean(req.body.isActive);
    await user.save();
    return res.json({ message: `Account ${user.isActive ? "reactivated" : "deactivated"}.`, user: { _id: user._id, name: user.name, isActive: user.isActive } });
  } catch (error) {
    console.error("ADMIN UPDATE USER ERROR:", error);
    return res.status(500).json({ message: "Could not update account." });
  }
};
