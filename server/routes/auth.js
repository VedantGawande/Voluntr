import express from "express";
import { login, register, changePassword } from "../controllers/auth.js";
import { authenticate } from "../middleware/auth.js";

const router = express.Router();
router.post("/register", register);
router.post("/login", login);
router.patch("/change-password", authenticate, changePassword);
export default router;
