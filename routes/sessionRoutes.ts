import { Router } from "express";
import { createSession } from "../controllers/sessionController.js";

const router = Router();

router.post("/create", createSession);

export default router;
