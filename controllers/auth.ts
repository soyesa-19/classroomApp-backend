import { Request, Response } from "express";
import { z } from "zod";
import AuthService from "../services/authService.js";

export const Login = async (req: Request, res: Response) => {
  try {
    const token = await AuthService.login(req.body);
    res.status(200).json({ message: "Login successfull", token: token });
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
