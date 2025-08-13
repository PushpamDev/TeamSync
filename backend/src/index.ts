import "dotenv/config";
import express, { NextFunction, Request, Response } from "express";
import cors from "cors";
import session from "cookie-session";
import { config } from "./config/app.config";
import connectDatabase from "./config/database.config";
import { errorHandler } from "./middlewares/errorHandler.middleware";
import { HTTPSTATUS } from "./config/http.config";
import { asyncHandler } from "./middlewares/asyncHandler.middleware";

import "./config/passport.config";
import passport from "passport";
import authRoutes from "./routes/auth.route";
import userRoutes from "./routes/user.route";
import isAuthenticated from "./middlewares/isAuthenticated.middleware";
import workspaceRoutes from "./routes/workspace.route";
import memberRoutes from "./routes/member.route";
import projectRoutes from "./routes/project.route";
import taskRoutes from "./routes/task.route";

import path from "path";

const app = express();
const BASE_PATH = config.BASE_PATH;

// Middleware for parsing requests
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session config
app.use(
  session({
    name: "session",
    keys: [config.SESSION_SECRET],
    maxAge: 24 * 60 * 60 * 1000,
    secure: config.NODE_ENV === "production",
    httpOnly: true,
    sameSite: config.NODE_ENV === "production" ? "none" : "lax",
  })
);

// Passport auth setup
app.use(passport.initialize());
app.use(passport.session());

// CORS setup
app.use(
  cors({
    origin: config.FRONTEND_ORIGIN, // allow all origins for now, restrict in production
    credentials: true,
  })
);

// Public route for sanity check
// app.get(
//   "/",
//   asyncHandler(async (req: Request, res: Response) => {
//     return res.status(HTTPSTATUS.OK).json({
//       message: "Welcome to TeamSync API 🚀",
//     });
//   })
// );

// API routes
app.use(`${BASE_PATH}/auth`, authRoutes);
app.use(`${BASE_PATH}/user`, isAuthenticated, userRoutes);
app.use(`${BASE_PATH}/workspace`, isAuthenticated, workspaceRoutes);
app.use(`${BASE_PATH}/member`, isAuthenticated, memberRoutes);
app.use(`${BASE_PATH}/project`, isAuthenticated, projectRoutes);
app.use(`${BASE_PATH}/task`, isAuthenticated, taskRoutes);

// Serve frontend (static files from dist/public)
const clientDistPath = path.join(__dirname, "public");
app.use(express.static(clientDistPath));

// SPA fallback for all non-API routes
app.get("*", (req, res) => {
  res.sendFile(path.join(clientDistPath, "index.html"));
});

// Error handler
app.use(errorHandler);

// Start server
app.listen(config.PORT, async () => {
  console.log(`Server listening on port ${config.PORT} in ${config.NODE_ENV}`);
  await connectDatabase();
});
