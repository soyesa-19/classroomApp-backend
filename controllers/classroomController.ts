import { Request, Response } from "express";
import { AuthenticatedRequest } from "../types/auth.js";
import { ClassroomService } from "../services/classroomService.js";
import { Auth } from "firebase-admin/auth";

export const joinClassroom = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { classroomId } = req.body;
    const userId = req.user?.id;

    if (!classroomId || !userId) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const result = await ClassroomService.joinClassroom(classroomId, userId);

    return res.status(200).json(result);
  } catch (error: any) {
    console.error("Error creating session:", error);
    const statusCode = error.message === "Internal server error" ? 500 : 400;
    return res.status(statusCode).json({ error: error.message });
  }
};

export const leaveClassrooom = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { classroomId } = req.body;
    const userId = req.user?.id;

    if (!classroomId || !userId) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const result = await ClassroomService.joinClassroom(classroomId, userId);

    return res.status(200).json(result);
  } catch (error: any) {
    console.error("Error creating session:", error);
    const statusCode = error.message === "Internal server error" ? 500 : 400;
    return res.status(statusCode).json({ error: error.message });
  }
};
