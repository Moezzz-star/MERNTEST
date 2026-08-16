import express from "express";

import {
  getEvents,
  getEvent,
  createEvent,
  updateEvent,
  deleteEvent,
} from "../controllers/event.controller.js";

import {
  getEventSessions,
  createEventSession,
} from "../controllers/session.controller.js";

import {
  requireAuth,
} from "../middleware/auth.middleware.js";

import {
  requireAdmin,
} from "../middleware/admin.middleware.js";

const router =
  express.Router();

router.use(
  requireAuth
);


// GET /events
router.get(
  "/",
  getEvents
);


// POST /events
router.post(
  "/",
  requireAdmin,
  createEvent
);


// GET /events/:id/sessions
router.get(
  "/:id/sessions",
  getEventSessions
);


// POST /events/:id/sessions
router.post(
  "/:id/sessions",
  requireAdmin,
  createEventSession
);


// GET /events/:id
router.get(
  "/:id",
  getEvent
);


// PUT /events/:id
router.put(
  "/:id",
  requireAdmin,
  updateEvent
);


// DELETE /events/:id
router.delete(
  "/:id",
  requireAdmin,
  deleteEvent
);


export default router;