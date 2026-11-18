import mongoose from "mongoose";

const opportunitySchema = new mongoose.Schema(
  {
    organization: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    organizationName: { type: String, required: true, trim: true },
    title: { type: String, trim: true, maxlength: 120, required: true },
    description: { type: String, trim: true, maxlength: 5000, default: "" },
    category: { type: String, trim: true, default: "" },
    requiredSkills: { type: [String], default: [] },
    volunteerCount: { type: Number, min: 1, default: 1 },
    date: { type: Date, default: null },
    startTime: { type: String, default: "" },
    endTime: { type: String, default: "" },
    duration: { type: String, default: "" },
    location: { type: String, trim: true, default: "" },
    mode: { type: String, enum: ["On-site", "Remote", "Hybrid"], default: "On-site" },
    applicationDeadline: { type: Date, default: null },
    status: { type: String, enum: ["draft", "open", "closed", "cancelled"], default: "draft", index: true },
    cancellationReason: { type: String, default: "" },
  },
  { timestamps: true }
);

const Opportunity = mongoose.models.Opportunity || mongoose.model("Opportunity", opportunitySchema);
export default Opportunity;
