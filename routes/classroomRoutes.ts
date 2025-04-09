import { Router } from "express";
import { joinClassroom } from "../controllers/classroomController.js";
import { authorizeRequest } from "../middlewares/auth.js";

const router = Router();

router.use(authorizeRequest);
router.post("/join", joinClassroom);

export default router;
