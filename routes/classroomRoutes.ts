import { Router } from "express";
import {
  getClassrooms,
  joinClassroom,
} from "../controllers/classroomController.js";
import { authorizeRequest } from "../middlewares/auth.js";

const router = Router();

router.use(authorizeRequest);
router.get("/", getClassrooms);
router.post("/join", joinClassroom);

export default router;
