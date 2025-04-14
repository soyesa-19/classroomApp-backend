import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createServer } from "http";
import { authRouter } from "./routes/authRoutes.js";
import classroomRouter from "./routes/classroomRoutes.js";
import { initializeWebSocketServer } from "./websocket/server.js";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Get the directory name in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve static files from the 'static' directory under '/public' path
app.use("/static", express.static(path.join(__dirname, "static")));

const PORT = process.env.PORT || 5000;

app.use("/api/auth", authRouter);
app.use("/api/classroom", classroomRouter);

// Create HTTP server
const httpServer = createServer(app);

// Initialize WebSocket server
initializeWebSocketServer(httpServer);

// Start the server
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;
