import express from "express";

import {
  updateSession,
  deleteSession,
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
  requireAuth,
  requireAdmin
);


// PUT /sessions/:id
router.put(
  "/:id",
  updateSession
);


// DELETE /sessions/:id
router.delete(
  "/:id",
  deleteSession
);


export default router;