import express from "express";

import {
  createBooking,
  getMyBookings,
  cancelBooking,
  getAllBookings,
} from "../controllers/booking.controller.js";

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


// POST /bookings
router.post(
  "/",
  createBooking
);


// GET /bookings/me
router.get(
  "/me",
  getMyBookings
);


// DELETE /bookings/:id
router.delete(
  "/:id",
  cancelBooking
);


// GET /bookings
router.get(
  "/",
  requireAdmin,
  getAllBookings
);


export default router;