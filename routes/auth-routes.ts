import express from "express";
import { Login, Register, Validate } from "../controllers/auth.js";

export const authRouter = express.Router();

authRouter.post("/login", Login);
authRouter.post("/register", Register);
authRouter.get("/validate", Validate);
