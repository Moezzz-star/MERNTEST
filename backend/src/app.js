import express from "express";
import cors from "cors";

import {
  env,
} from "./config/env.js";

import authRoutes
  from "./routes/auth.routes.js";

import userRoutes
  from "./routes/user.routes.js";

import eventRoutes
  from "./routes/event.routes.js";

import sessionRoutes
  from "./routes/session.routes.js";

import bookingRoutes
  from "./routes/booking.routes.js";

const app =
  express();


// ======================================================
// CORS
// ======================================================

const allowedOrigins = [
  "http://localhost:5173",
  env.FRONTEND_URL,
].filter(Boolean);

app.use(
  cors({
    origin(
      origin,
      callback
    ) {
      // curl, PowerShell,
      // Postman, server-to-server, etc.
      if (!origin) {
        return callback(
          null,
          true
        );
      }

      if (
        allowedOrigins.includes(
          origin
        )
      ) {
        return callback(
          null,
          true
        );
      }

      return callback(
        new Error(
          `Origin ${origin} is not allowed by CORS`
        )
      );
    },
  })
);


// ======================================================
// JSON
// ======================================================

app.use(
  express.json()
);


// ======================================================
// HEALTH ROUTE
// ======================================================

app.get(
  "/",
  (req, res) => {
    return res.json({
      message:
        "Backend is working",

      authentication:
        true,

      bookingSystem:
        true,
    });
  }
);


// ======================================================
// APPLICATION ROUTES
// ======================================================

app.use(
  "/auth",
  authRoutes
);

app.use(
  "/users",
  userRoutes
);

app.use(
  "/events",
  eventRoutes
);

app.use(
  "/sessions",
  sessionRoutes
);

app.use(
  "/bookings",
  bookingRoutes
);


// ======================================================
// 404
// ======================================================

app.use(
  (req, res) => {
    return res
      .status(404)
      .json({
        message:
          "Route not found",
      });
  }
);


export default app;