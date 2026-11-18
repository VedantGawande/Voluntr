import User from "../models/User.js";
import Opportunity from "../models/Opportunity.js";
import Application from "../models/Application.js";
import Notification from "../models/Notification.js";

export const getDashboard = async (req, res) => {
  try {
    const unreadNotifications = await Notification.countDocuments({ recipient: req.user._id, isRead: false });
    if (req.user.role === "volunteer") {
      const [totalApplications, pendingApplications, acceptedApplications, recentApplications, upcomingAcceptedApplications] = await Promise.all([
        Application.countDocuments({ volunteer: req.user._id }),
        Application.countDocuments({ volunteer: req.user._id, status: "pending" }),
        Application.countDocuments({ volunteer: req.user._id, status: "accepted" }),
        Application.find({ volunteer: req.user._id }).populate("opportunity", "title date location mode").sort({ createdAt: -1 }).limit(5),
        Application.find({ volunteer: req.user._id, status: "accepted" }).populate({ path: "opportunity", match: { date: { $gte: (() => {
          const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date());
          const day = Object.fromEntries(parts.map((part) => [part.type, part.value]));
          return new Date(`${day.year}-${day.month}-${day.day}T00:00:00+05:30`);
        })() } }, select: "title date location mode" }).sort({ createdAt: 1 }).limit(5),
      ]);
      const volunteerProfile = req.user.volunteerProfile || {};
      const profileFields = [req.user.name, volunteerProfile.phone, volunteerProfile.city, volunteerProfile.bio, (volunteerProfile.skills || []).length, (volunteerProfile.interests || []).length, volunteerProfile.availability];
      const completedProfileFields = profileFields.filter((value) => value !== undefined && value !== null && value !== "" && value !== 0).length;
      const profileCompletion = { completed: completedProfileFields, total: profileFields.length, percent: Math.round((completedProfileFields / profileFields.length) * 100) };
      return res.json({ role: "volunteer", unreadNotifications, totalApplications, pendingApplications, acceptedApplications, recentApplications, upcomingAcceptedApplications: upcomingAcceptedApplications.filter((item) => item.opportunity), profileCompletion });
    }
    if (req.user.role === "organization") {
      const ownOpportunities = await Opportunity.find({ organization: req.user._id }).select("title status date volunteerCount").sort({ createdAt: -1 });
      const [pendingApplications, acceptedApplications, rejectedApplications, recentApplications] = await Promise.all([
        Application.countDocuments({ organization: req.user._id, status: "pending" }),
        Application.countDocuments({ organization: req.user._id, status: "accepted" }),
        Application.countDocuments({ organization: req.user._id, status: "rejected" }),
        Application.find({ organization: req.user._id }).populate("volunteer", "name email").populate("opportunity", "title").sort({ createdAt: -1 }).limit(6),
      ]);
      return res.json({ role: "organization", unreadNotifications, ownOpportunities, pendingApplications, acceptedApplications, rejectedApplications, recentApplications });
    }
    const [volunteers, organizations, totalOpportunities, openOpportunities] = await Promise.all([
      User.countDocuments({ role: "volunteer" }),
      User.countDocuments({ role: "organization" }),
      Opportunity.countDocuments(),
      Opportunity.countDocuments({ status: "open" }),
    ]);
    return res.json({ role: "admin", unreadNotifications, volunteers, organizations, totalOpportunities, openOpportunities });
  } catch (error) {
    console.error("DASHBOARD ERROR:", error);
    return res.status(500).json({ message: "Could not load dashboard." });
  }
};
