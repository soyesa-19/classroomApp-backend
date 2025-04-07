import { Request, Response } from "express";
import SessionService from "../services/sessionService.js";

export const createSession = async (req: Request, res: Response) => {
  try {
    const { classroomId, userId } = req.body;

    if (!classroomId || !userId) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const result = await SessionService.createSession(classroomId, userId);
    const statusCode = result.message === "New session created" ? 201 : 200;

    return res.status(statusCode).json(result);
  } catch (error: any) {
    console.error("Error creating session:", error);
    const statusCode = error.message === "Internal server error" ? 500 : 400;
    return res.status(statusCode).json({ error: error.message });
  }
};
