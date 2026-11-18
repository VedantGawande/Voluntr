import User from "../models/User.js";
import Opportunity from "../models/Opportunity.js";

export const getMyProfile = async (req, res) => res.json(req.user);

export const updateMyProfile = async (req, res) => {
  try {
    const user = req.user;
    let updatedOrganizationName = null;
    if (user.role === "volunteer") {
      user.volunteerProfile ||= {};
      const fields = ["phone", "city", "bio", "availability"];
      fields.forEach((field) => {
        if (req.body[field] !== undefined) user.volunteerProfile[field] = String(req.body[field]).trim();
      });
      ["skills", "interests"].forEach((field) => {
        if (req.body[field] !== undefined) {
          const value = Array.isArray(req.body[field]) ? req.body[field] : String(req.body[field]).split(",");
          user.volunteerProfile[field] = value.map((item) => String(item).trim()).filter(Boolean);
        }
      });
      if (req.body.name !== undefined) user.name = String(req.body.name).trim();
    } else if (user.role === "organization") {
      user.organizationProfile ||= {};
      const previousOrganizationName = user.organizationProfile.organizationName;
      const fields = ["organizationName", "description", "category", "contactPerson", "phone", "city", "website"];
      fields.forEach((field) => {
        if (req.body[field] !== undefined) user.organizationProfile[field] = String(req.body[field]).trim();
      });
      if (req.body.name !== undefined) user.name = String(req.body.name).trim();
      if (user.organizationProfile.organizationName && user.organizationProfile.organizationName !== previousOrganizationName) {
        updatedOrganizationName = user.organizationProfile.organizationName;
      }
    } else {
      if (req.body.name !== undefined) user.name = String(req.body.name).trim();
    }
    await user.save();
    if (updatedOrganizationName) {
      await Opportunity.updateMany({ organization: user._id }, { organizationName: updatedOrganizationName });
    }
    return res.json(user);
  } catch (error) {
    console.error("PROFILE UPDATE ERROR:", error);
    return res.status(400).json({ message: "Could not update profile. Check the information and try again." });
  }
};

export const deactivateMyAccount = async (req, res) => {
  try {
    if (req.user.role === "admin") return res.status(400).json({ message: "Admin accounts cannot be deactivated here." });
    req.user.isActive = false;
    await req.user.save();
    return res.json({ message: "Your account has been deactivated." });
  } catch (error) {
    console.error("ACCOUNT DEACTIVATION ERROR:", error);
    return res.status(500).json({ message: "Could not deactivate your account." });
  }
};
