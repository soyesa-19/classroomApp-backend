import { Request, Response } from "express";
import { z } from "zod";
import AuthService from "../services/authService.js";

export const Login = async (req: Request, res: Response) => {
  try {
    const result = await AuthService.login(req.body);
    res.status(200).json({ message: "Login successfull", ...result });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ errors: error.errors });
    }
    res.status(400).json({
      message: error instanceof Error ? error.message : "Login failed",
    });
  }
};

export const Register = async (req: Request, res: Response) => {
  try {
    const user = await AuthService.register(req.body);
    res.status(201).json(user);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ errors: error.errors });
    }
    res.status(400).json({
      message: error instanceof Error ? error.message : "Registration failed",
    });
  }
};

export const Validate = async (req: Request, res: Response) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return res.status(400).json({ message: "No token found!" });
    }

    const { valid, data } = await AuthService.validateToken(token);

    res.status(200).json({
      valid,
      payload: data,
    });
  } catch (error) {
    res.status(500).json({
      message: error instanceof Error ? error.message : "Something went wrong!",
    });
  }
};
