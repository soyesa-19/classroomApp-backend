import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { authRouter } from "./routes/auth-routes.js";
import sessionRouter from "./routes/sessionRoutes.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;

app.use("/api/auth", authRouter);
app.use("/api/session", sessionRouter);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;
