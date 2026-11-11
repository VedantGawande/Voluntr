import express from "express";
import { login } from "../controllers/auth.js";
import { forgot, reset } from "../controllers/auth.js";

const router = express.Router();

router.post("/login", login);

router.post("/forgot", forgot);


router.post("/reset/:token", reset);

export default router;
