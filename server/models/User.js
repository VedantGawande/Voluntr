import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 80 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 120 },
    password: { type: String, required: true, select: false },
    role: { type: String, enum: ["volunteer", "organization", "admin"], required: true, default: "volunteer" },
    isActive: { type: Boolean, default: true },
    volunteerProfile: {
      phone: { type: String, default: "" },
      city: { type: String, default: "" },
      bio: { type: String, default: "" },
      skills: { type: [String], default: [] },
      interests: { type: [String], default: [] },
      availability: { type: String, default: "" },
    },
    organizationProfile: {
      organizationName: { type: String, default: "" },
      description: { type: String, default: "" },
      category: { type: String, default: "" },
      contactPerson: { type: String, default: "" },
      phone: { type: String, default: "" },
      city: { type: String, default: "" },
      website: { type: String, default: "" },
    },
  },
  { timestamps: true }
);

userSchema.set("toJSON", {
  transform(_doc, ret) {
    delete ret.password;
    delete ret.__v;
    return ret;
  },
});

const User = mongoose.models.User || mongoose.model("User", userSchema);
export default User;
