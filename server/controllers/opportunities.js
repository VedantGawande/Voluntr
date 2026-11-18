import Opportunity from "../models/Opportunity.js";
import Application from "../models/Application.js";
import Notification from "../models/Notification.js";

const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const startOfIndiaDay = (value) => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(value));
  const dateParts = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return new Date(`${dateParts.year}-${dateParts.month}-${dateParts.day}T00:00:00+05:30`);
};

const organizationNameFor = (user) =>
  user.organizationProfile?.organizationName?.trim() || user.name;

const validateForPublishing = (data) => {
  const required = [
    ["title", "Title"],
    ["description", "Description"],
    ["category", "Category"],
    ["date", "Date"],
    ["location", "Location"],
    ["applicationDeadline", "Application deadline"],
  ];
  for (const [field, label] of required) {
    if (!data[field] || String(data[field]).trim() === "") return `${label} is required before publishing.`;
  }
  if (!data.startTime && !data.duration) return "Enter a start time or provide a duration.";
  if (data.startTime && !data.endTime && !data.duration) return "Enter an end time or provide a duration.";
  if (data.endTime && !data.startTime) return "Enter a start time.";
  if (!Number.isFinite(Number(data.volunteerCount)) || Number(data.volunteerCount) < 1) return "Number of volunteers must be at least 1.";
  const today = startOfIndiaDay(new Date());
  const deadlineDay = startOfIndiaDay(data.applicationDeadline);
  const opportunityDay = startOfIndiaDay(data.date);
  if (deadlineDay < today) return "The application deadline must be today or a future date.";
  if (opportunityDay < today) return "The opportunity date cannot be in the past.";
  if (deadlineDay > opportunityDay) return "The application deadline cannot be after the opportunity date.";
  return null;
};

const applyOpportunityFields = (target, body) => {
  if (body.title !== undefined && String(body.title).trim()) target.title = String(body.title).trim();
  const stringFields = ["description", "category", "startTime", "endTime", "duration", "location", "mode"];
  stringFields.forEach((field) => {
    if (body[field] !== undefined) target[field] = String(body[field]).trim();
  });
  if (body.requiredSkills !== undefined) {
    const skills = Array.isArray(body.requiredSkills) ? body.requiredSkills : String(body.requiredSkills).split(",");
    target.requiredSkills = skills.map((skill) => String(skill).trim()).filter(Boolean);
  }
  if (body.volunteerCount !== undefined) target.volunteerCount = Number(body.volunteerCount);
  if (body.date !== undefined) target.date = body.date ? new Date(body.date) : null;
  if (body.applicationDeadline !== undefined) target.applicationDeadline = body.applicationDeadline ? new Date(body.applicationDeadline) : null;
};

export const listOpportunities = async (req, res) => {
  try {
    const filter = {};
    const today = startOfIndiaDay(new Date());
    await Opportunity.updateMany(
      { status: "open", applicationDeadline: { $lt: today } },
      { status: "closed" }
    );
    if (req.user.role === "volunteer") {
      filter.status = "open";
      filter.applicationDeadline = { $gte: today };
    } else if (req.user.role === "organization") {
      filter.organization = req.user._id;
    }

    if (req.query.status && req.user.role !== "volunteer") filter.status = req.query.status;
    if (req.query.q) {
      const pattern = new RegExp(escapeRegex(req.query.q.trim()), "i");
      filter.$or = [{ title: pattern }, { description: pattern }, { category: pattern }, { organizationName: pattern }];
    }
    if (req.query.category) filter.category = new RegExp(escapeRegex(req.query.category), "i");
    if (req.query.location) filter.location = new RegExp(escapeRegex(req.query.location), "i");
    if (req.query.mode) filter.mode = req.query.mode;
    if (req.query.date) {
      const start = startOfIndiaDay(req.query.date);
      const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
      filter.date = { $gte: start, $lt: end };
    }
    if (req.query.skill) filter.requiredSkills = { $in: [new RegExp(escapeRegex(req.query.skill), "i")] };

    const opportunities = await Opportunity.find(filter).sort({ date: 1, createdAt: -1 }).lean();
    const ids = opportunities.map((item) => item._id);
    const acceptedCounts = ids.length ? await Application.aggregate([
      { $match: { opportunity: { $in: ids }, status: "accepted" } },
      { $group: { _id: "$opportunity", count: { $sum: 1 } } },
    ]) : [];
    const countByOpportunity = new Map(acceptedCounts.map((item) => [String(item._id), item.count]));
    return res.json(opportunities.map((item) => ({
      ...item,
      acceptedCount: countByOpportunity.get(String(item._id)) || 0,
      availableSlots: Math.max(0, item.volunteerCount - (countByOpportunity.get(String(item._id)) || 0)),
    })));
  } catch (error) {
    console.error("LIST OPPORTUNITIES ERROR:", error);
    return res.status(500).json({ message: "Could not load opportunities." });
  }
};

export const getOpportunity = async (req, res) => {
  try {
    const opportunity = await Opportunity.findById(req.params.id).populate("organization", "name organizationProfile");
    if (!opportunity) return res.status(404).json({ message: "Opportunity not found." });
    if (opportunity.status === "open" && opportunity.applicationDeadline && startOfIndiaDay(opportunity.applicationDeadline) < startOfIndiaDay(new Date())) {
      opportunity.status = "closed";
      await opportunity.save();
    }
    const opportunityData = opportunity.toObject();
    const acceptedCount = await Application.countDocuments({ opportunity: opportunity._id, status: "accepted" });
    opportunityData.acceptedCount = acceptedCount;
    opportunityData.availableSlots = Math.max(0, opportunity.volunteerCount - acceptedCount);
    const organizationId = opportunity.organization?._id || opportunity.organization;
    const isOwner = String(organizationId) === String(req.user._id);
    if (req.user.role === "volunteer" && opportunity.status !== "open") {
      const existingApplication = await Application.exists({ opportunity: opportunity._id, volunteer: req.user._id });
      if (!existingApplication) return res.status(404).json({ message: "This opportunity is not available." });
    }
    if (req.user.role === "organization" && !isOwner) {
      return res.status(403).json({ message: "You cannot view another organization's opportunity." });
    }
    if (req.user.role === "admin" || req.user.role === "volunteer" || isOwner) return res.json(opportunityData);
    return res.status(403).json({ message: "You do not have permission to view this opportunity." });
  } catch (error) {
    console.error("GET OPPORTUNITY ERROR:", error);
    return res.status(400).json({ message: "Invalid opportunity ID." });
  }
};

export const createOpportunity = async (req, res) => {
  try {
    const opportunity = new Opportunity({
      organization: req.user._id,
      organizationName: organizationNameFor(req.user),
      title: String(req.body.title || "Untitled draft").trim(),
    });
    applyOpportunityFields(opportunity, req.body);
    const shouldPublish = req.body.status === "open";
    if (shouldPublish) {
      const issue = validateForPublishing(opportunity);
      if (issue) return res.status(400).json({ message: issue });
      opportunity.status = "open";
    }
    await opportunity.save();
    return res.status(201).json(opportunity);
  } catch (error) {
    console.error("CREATE OPPORTUNITY ERROR:", error);
    return res.status(400).json({ message: "Could not save opportunity. Check the provided fields." });
  }
};

export const updateOpportunity = async (req, res) => {
  try {
    const opportunity = await Opportunity.findOne({ _id: req.params.id, organization: req.user._id });
    if (!opportunity) return res.status(404).json({ message: "Opportunity not found." });
    if (opportunity.status === "cancelled") return res.status(400).json({ message: "Cancelled opportunities cannot be edited." });
    const wasOpen = opportunity.status === "open";
    applyOpportunityFields(opportunity, req.body);
    opportunity.organizationName = organizationNameFor(req.user);
    if (req.body.status === "open" || wasOpen) {
      const issue = validateForPublishing(opportunity);
      if (issue) return res.status(400).json({ message: issue });
      opportunity.status = "open";
    }
    await opportunity.save();
    if (wasOpen) {
      const applicants = await Application.find({ opportunity: opportunity._id, status: { $in: ["pending", "accepted"] } }).select("volunteer");
      await Notification.insertMany(applicants.map((application) => ({
        recipient: application.volunteer,
        message: `The opportunity “${opportunity.title}” has been updated.`,
        type: "opportunity",
        relatedOpportunity: opportunity._id,
      })));
    }
    return res.json(opportunity);
  } catch (error) {
    console.error("UPDATE OPPORTUNITY ERROR:", error);
    return res.status(400).json({ message: "Could not update opportunity." });
  }
};

export const publishOpportunity = async (req, res) => {
  try {
    const opportunity = await Opportunity.findOne({ _id: req.params.id, organization: req.user._id });
    if (!opportunity) return res.status(404).json({ message: "Opportunity not found." });
    if (opportunity.status === "cancelled") return res.status(400).json({ message: "Cancelled opportunities cannot be published." });
    const issue = validateForPublishing(opportunity);
    if (issue) return res.status(400).json({ message: issue });
    opportunity.status = "open";
    await opportunity.save();
    return res.json(opportunity);
  } catch (error) {
    console.error("PUBLISH OPPORTUNITY ERROR:", error);
    return res.status(400).json({ message: "Could not publish opportunity." });
  }
};

export const closeOpportunity = async (req, res) => {
  try {
    const opportunity = await Opportunity.findOne({ _id: req.params.id, organization: req.user._id });
    if (!opportunity) return res.status(404).json({ message: "Opportunity not found." });
    if (opportunity.status === "cancelled") return res.status(400).json({ message: "This opportunity has been cancelled." });
    opportunity.status = "closed";
    await opportunity.save();
    const applicants = await Application.find({ opportunity: opportunity._id, status: { $in: ["pending", "accepted"] } }).select("volunteer");
    if (applicants.length) {
      await Notification.insertMany(applicants.map((application) => ({
        recipient: application.volunteer,
        message: `Applications for “${opportunity.title}” are now closed.`,
        type: "opportunity",
        relatedOpportunity: opportunity._id,
      })));
    }
    return res.json(opportunity);
  } catch (error) {
    console.error("CLOSE OPPORTUNITY ERROR:", error);
    return res.status(500).json({ message: "Could not close opportunity." });
  }
};

export const cancelOpportunity = async (req, res) => {
  try {
    const reason = String(req.body.reason || "").trim();
    if (!reason) return res.status(400).json({ message: "Please provide a cancellation reason." });
    const opportunity = await Opportunity.findOne({ _id: req.params.id, organization: req.user._id });
    if (!opportunity) return res.status(404).json({ message: "Opportunity not found." });
    opportunity.status = "cancelled";
    opportunity.cancellationReason = reason;
    await opportunity.save();

    const applicants = await Application.find({ opportunity: opportunity._id, status: { $in: ["pending", "accepted"] } }).select("volunteer");
    if (applicants.length) {
      await Notification.insertMany(applicants.map((application) => ({
        recipient: application.volunteer,
        message: `The opportunity “${opportunity.title}” was cancelled. Reason: ${reason}`,
        type: "opportunity",
        relatedOpportunity: opportunity._id,
      })));
    }
    return res.json(opportunity);
  } catch (error) {
    console.error("CANCEL OPPORTUNITY ERROR:", error);
    return res.status(500).json({ message: "Could not cancel opportunity." });
  }
};

export const adminDeleteOpportunity = async (req, res) => {
  try {
    const opportunity = await Opportunity.findByIdAndDelete(req.params.id);
    if (!opportunity) return res.status(404).json({ message: "Opportunity not found." });
    await Application.deleteMany({ opportunity: opportunity._id });
    await Notification.deleteMany({ relatedOpportunity: opportunity._id });
    return res.json({ message: "Opportunity and its applications were removed." });
  } catch (error) {
    console.error("ADMIN DELETE OPPORTUNITY ERROR:", error);
    return res.status(500).json({ message: "Could not remove opportunity." });
  }
};
