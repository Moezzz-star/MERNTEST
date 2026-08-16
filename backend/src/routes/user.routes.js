import express from "express";

import {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
} from "../controllers/user.controller.js";

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

router.get(
  "/",
  getUsers
);

router.post(
  "/",
  createUser
);

router.put(
  "/:id",
  updateUser
);

router.delete(
  "/:id",
  deleteUser
);

export default router;