import mongoose from "mongoose";

const applicationSchema = new mongoose.Schema(
  {
    opportunity: { type: mongoose.Schema.Types.ObjectId, ref: "Opportunity", required: true, index: true },
    volunteer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    organization: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    introduction: { type: String, trim: true, maxlength: 1000, default: "" },
    status: { type: String, enum: ["pending", "accepted", "rejected", "withdrawn"], default: "pending", index: true },
  },
  { timestamps: true }
);

applicationSchema.index({ opportunity: 1, volunteer: 1 }, { unique: true });
const Application = mongoose.models.Application || mongoose.model("Application", applicationSchema);
export default Application;
