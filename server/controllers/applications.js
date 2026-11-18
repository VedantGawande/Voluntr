import Application from "../models/Application.js";
import Opportunity from "../models/Opportunity.js";
import Notification from "../models/Notification.js";

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

export const applyToOpportunity = async (req, res) => {
  try {
    const opportunity = await Opportunity.findById(req.params.id);
    if (!opportunity) return res.status(404).json({ message: "Opportunity not found." });
    if (opportunity.status !== "open" || !opportunity.applicationDeadline || startOfIndiaDay(opportunity.applicationDeadline) < startOfIndiaDay(new Date())) {
      return res.status(400).json({ message: "Applications are closed for this opportunity." });
    }
    const acceptedCount = await Application.countDocuments({ opportunity: opportunity._id, status: "accepted" });
    if (acceptedCount >= opportunity.volunteerCount) {
      opportunity.status = "closed";
      await opportunity.save();
      return res.status(400).json({ message: "All volunteer places have been filled." });
    }

    const introduction = String(req.body.introduction || "").trim();
    if (introduction.length > 1000) return res.status(400).json({ message: "Introduction must be 1000 characters or fewer." });

    let application = await Application.findOne({ opportunity: opportunity._id, volunteer: req.user._id });
    if (application && ["pending", "accepted"].includes(application.status)) {
      return res.status(409).json({ message: "You already have an active application for this opportunity." });
    }
    if (application) {
      application.introduction = introduction;
      application.status = "pending";
      await application.save();
    } else {
      application = await Application.create({
        opportunity: opportunity._id,
        volunteer: req.user._id,
        organization: opportunity.organization,
        introduction,
      });
    }

    await Notification.create({
      recipient: opportunity.organization,
      message: `${req.user.name} applied for “${opportunity.title}”.`,
      type: "application",
      relatedOpportunity: opportunity._id,
      relatedApplication: application._id,
    });
    return res.status(201).json({ message: "Application submitted successfully.", application });
  } catch (error) {
    console.error("APPLY ERROR:", error);
    if (error.code === 11000) return res.status(409).json({ message: "You already applied to this opportunity." });
    return res.status(500).json({ message: "Could not submit your application." });
  }
};

export const getMyApplications = async (req, res) => {
  try {
    const applications = await Application.find({ volunteer: req.user._id })
      .populate("opportunity", "title date location mode status organizationName applicationDeadline")
      .sort({ createdAt: -1 });
    return res.json(applications);
  } catch (error) {
    console.error("MY APPLICATIONS ERROR:", error);
    return res.status(500).json({ message: "Could not load your applications." });
  }
};

export const withdrawApplication = async (req, res) => {
  try {
    const application = await Application.findOne({ _id: req.params.id, volunteer: req.user._id });
    if (!application) return res.status(404).json({ message: "Application not found." });
    if (application.status !== "pending") return res.status(400).json({ message: "Only pending applications can be withdrawn." });
    application.status = "withdrawn";
    await application.save();
    return res.json({ message: "Application withdrawn.", application });
  } catch (error) {
    console.error("WITHDRAW APPLICATION ERROR:", error);
    return res.status(500).json({ message: "Could not withdraw application." });
  }
};

export const getOpportunityApplications = async (req, res) => {
  try {
    const opportunity = await Opportunity.findById(req.params.id);
    if (!opportunity) return res.status(404).json({ message: "Opportunity not found." });
    if (String(opportunity.organization) !== String(req.user._id)) {
      return res.status(403).json({ message: "You can only view applicants for your own opportunities." });
    }
    const applications = await Application.find({ opportunity: opportunity._id })
      .populate("volunteer", "name email volunteerProfile")
      .sort({ createdAt: -1 });
    return res.json(applications);
  } catch (error) {
    console.error("OPPORTUNITY APPLICATIONS ERROR:", error);
    return res.status(500).json({ message: "Could not load applicants." });
  }
};

export const updateApplicationStatus = async (req, res) => {
  try {
    const status = String(req.body.status || "").toLowerCase();
    if (!["accepted", "rejected"].includes(status)) {
      return res.status(400).json({ message: "Choose Accepted or Rejected." });
    }
    const application = await Application.findById(req.params.id).populate("opportunity");
    if (!application) return res.status(404).json({ message: "Application not found." });
    if (String(application.organization) !== String(req.user._id)) {
      return res.status(403).json({ message: "You cannot manage this application." });
    }
    if (application.status !== "pending") {
      return res.status(400).json({ message: "Only pending applications can be reviewed." });
    }

    if (status === "accepted") {
      if (application.opportunity.status !== "open" || !application.opportunity.applicationDeadline || startOfIndiaDay(application.opportunity.applicationDeadline) < startOfIndiaDay(new Date())) {
        return res.status(400).json({ message: "This opportunity is no longer accepting applicants." });
      }
      const acceptedCount = await Application.countDocuments({ opportunity: application.opportunity._id, status: "accepted" });
      if (acceptedCount >= application.opportunity.volunteerCount) {
        return res.status(400).json({ message: "The volunteer capacity has already been reached." });
      }
    }

    application.status = status;
    await application.save();

    await Notification.create({
      recipient: application.volunteer,
      message: `Your application for “${application.opportunity.title}” was ${status}.`,
      type: "application_status",
      relatedOpportunity: application.opportunity._id,
      relatedApplication: application._id,
    });

    if (status === "accepted") {
      const newAcceptedCount = await Application.countDocuments({ opportunity: application.opportunity._id, status: "accepted" });
      if (newAcceptedCount >= application.opportunity.volunteerCount) {
        application.opportunity.status = "closed";
        await application.opportunity.save();
      }
    }
    return res.json({ message: `Application ${status}.`, application });
  } catch (error) {
    console.error("UPDATE APPLICATION STATUS ERROR:", error);
    return res.status(500).json({ message: "Could not update application status." });
  }
};
