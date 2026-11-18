import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    message: { type: String, required: true, trim: true, maxlength: 300 },
    type: { type: String, enum: ["application", "application_status", "opportunity"], default: "opportunity" },
    relatedOpportunity: { type: mongoose.Schema.Types.ObjectId, ref: "Opportunity", default: null },
    relatedApplication: { type: mongoose.Schema.Types.ObjectId, ref: "Application", default: null },
    isRead: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

const Notification = mongoose.models.Notification || mongoose.model("Notification", notificationSchema);
export default Notification;
