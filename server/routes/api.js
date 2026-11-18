import express from "express";
import { authenticate, requireRole } from "../middleware/auth.js";
import { getMyProfile, updateMyProfile, deactivateMyAccount } from "../controllers/profile.js";
import { getDashboard } from "../controllers/dashboard.js";
import {
  listOpportunities,
  getOpportunity,
  createOpportunity,
  updateOpportunity,
  publishOpportunity,
  closeOpportunity,
  cancelOpportunity,
  adminDeleteOpportunity,
} from "../controllers/opportunities.js";
import {
  applyToOpportunity,
  getMyApplications,
  withdrawApplication,
  getOpportunityApplications,
  updateApplicationStatus,
} from "../controllers/applications.js";
import { getNotifications, markNotificationRead, markAllNotificationsRead } from "../controllers/notifications.js";
import { getAdminOverview, listUsers, setUserActive } from "../controllers/admin.js";

const router = express.Router();
router.use(authenticate);

router.get("/dashboard", getDashboard);
router.get("/profile", getMyProfile);
router.patch("/profile", updateMyProfile);
router.delete("/profile", requireRole("volunteer"), deactivateMyAccount);

router.get("/opportunities", listOpportunities);
router.post("/opportunities", requireRole("organization"), createOpportunity);
router.get("/opportunities/:id/applications", requireRole("organization"), getOpportunityApplications);
router.post("/opportunities/:id/applications", requireRole("volunteer"), applyToOpportunity);
router.get("/opportunities/:id", getOpportunity);
router.patch("/opportunities/:id", requireRole("organization"), updateOpportunity);
router.post("/opportunities/:id/publish", requireRole("organization"), publishOpportunity);
router.post("/opportunities/:id/close", requireRole("organization"), closeOpportunity);
router.post("/opportunities/:id/cancel", requireRole("organization"), cancelOpportunity);

router.get("/applications/mine", requireRole("volunteer"), getMyApplications);
router.patch("/applications/:id/withdraw", requireRole("volunteer"), withdrawApplication);
router.patch("/applications/:id/status", requireRole("organization"), updateApplicationStatus);

router.get("/notifications", getNotifications);
router.patch("/notifications/read-all", markAllNotificationsRead);
router.patch("/notifications/:id/read", markNotificationRead);

router.get("/admin/overview", requireRole("admin"), getAdminOverview);
router.get("/admin/users", requireRole("admin"), listUsers);
router.patch("/admin/users/:id/active", requireRole("admin"), setUserActive);
router.delete("/admin/opportunities/:id", requireRole("admin"), adminDeleteOpportunity);

export default router;
