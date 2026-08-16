import { ObjectId } from "mongodb";

import {
  getCollections,
} from "../config/database.js";

import {
  validObjectId,
} from "../utils/validators.js";


// ======================================================
// CREATE BOOKING
// ======================================================

export async function createBooking(
  req,
  res
) {
  try {
    const {
      sessionId,
    } = req.body;

    if (
      !sessionId ||
      !validObjectId(
        sessionId
      )
    ) {
      return res
        .status(400)
        .json({
          message:
            "Valid sessionId is required",
        });
    }

    const {
      sessions,
      bookings,
    } = getCollections();

    const userObjectId =
      new ObjectId(
        req.user.userId
      );

    const sessionObjectId =
      new ObjectId(
        sessionId
      );


    // ==================================================
    // DUPLICATE CHECK
    // ==================================================

    const existingBooking =
      await bookings.findOne({
        userId:
          userObjectId,

        sessionId:
          sessionObjectId,
      });

    if (existingBooking) {
      return res
        .status(409)
        .json({
          message:
            "You already booked this session",
        });
    }


    // ==================================================
    // SESSION CHECK
    // ==================================================

    const session =
      await sessions.findOne({
        _id:
          sessionObjectId,
      });

    if (!session) {
      return res
        .status(404)
        .json({
          message:
            "Session not found",
        });
    }

    if (
      session.status !==
      "available"
    ) {
      return res
        .status(409)
        .json({
          message:
            "This session is not available",
        });
    }

    if (
      session.startAt <=
      new Date()
    ) {
      return res
        .status(409)
        .json({
          message:
            "This session has already started",
        });
    }


    // ==================================================
    // ATOMIC SEAT RESERVATION
    // ==================================================

    const reserveResult =
      await sessions.updateOne(
        {
          _id:
            sessionObjectId,

          status:
            "available",

          startAt: {
            $gt:
              new Date(),
          },

          $expr: {
            $lt: [
              {
                $ifNull: [
                  "$bookedCount",
                  0,
                ],
              },

              "$capacity",
            ],
          },
        },

        {
          $inc: {
            bookedCount:
              1,
          },

          $set: {
            updatedAt:
              new Date(),
          },
        }
      );

    if (
      reserveResult.matchedCount ===
      0
    ) {
      return res
        .status(409)
        .json({
          message:
            "This session is full or unavailable",
        });
    }


    // ==================================================
    // CREATE BOOKING DOCUMENT
    // ==================================================

    const newBooking = {
      userId:
        userObjectId,

      sessionId:
        sessionObjectId,

      status:
        "confirmed",

      createdAt:
        new Date(),

      updatedAt:
        new Date(),
    };

    try {
      const result =
        await bookings.insertOne(
          newBooking
        );

      return res
        .status(201)
        .json({
          message:
            "Booking confirmed",

          booking: {
            ...newBooking,

            _id:
              result.insertedId,
          },
        });
    } catch (insertError) {
      // Booking insertion failed.
      // Return reserved seat.

      await sessions.updateOne(
        {
          _id:
            sessionObjectId,

          bookedCount: {
            $gt: 0,
          },
        },

        {
          $inc: {
            bookedCount:
              -1,
          },

          $set: {
            updatedAt:
              new Date(),
          },
        }
      );

      if (
        insertError.code ===
        11000
      ) {
        return res
          .status(409)
          .json({
            message:
              "You already booked this session",
          });
      }

      throw insertError;
    }
  } catch (error) {
    console.error(
      "CREATE BOOKING ERROR:",
      error
    );

    return res
      .status(500)
      .json({
        message:
          "Could not create booking",
      });
  }
}


// ======================================================
// MY BOOKINGS
// ======================================================

export async function getMyBookings(
  req,
  res
) {
  try {
    const {
      bookings,
    } = getCollections();

    const userId =
      new ObjectId(
        req.user.userId
      );

    const result =
      await bookings
        .aggregate([
          {
            $match: {
              userId,
            },
          },

          {
            $lookup: {
              from:
                "sessions",

              localField:
                "sessionId",

              foreignField:
                "_id",

              as:
                "session",
            },
          },

          {
            $unwind:
              "$session",
          },

          {
            $lookup: {
              from:
                "events",

              localField:
                "session.eventId",

              foreignField:
                "_id",

              as:
                "event",
            },
          },

          {
            $unwind:
              "$event",
          },

          {
            $sort: {
              "session.startAt":
                1,
            },
          },

          {
            $project: {
              _id: 1,
              status: 1,
              createdAt: 1,

              session: {
                _id:
                  "$session._id",

                startAt:
                  "$session.startAt",

                endAt:
                  "$session.endAt",

                status:
                  "$session.status",
              },

              event: {
                _id:
                  "$event._id",

                title:
                  "$event.title",

                description:
                  "$event.description",

                location:
                  "$event.location",
              },
            },
          },
        ])
        .toArray();

    return res.json(result);
  } catch (error) {
    console.error(
      "GET MY BOOKINGS ERROR:",
      error
    );

    return res
      .status(500)
      .json({
        message:
          "Could not load bookings",
      });
  }
}


// ======================================================
// CANCEL BOOKING
// ======================================================

export async function cancelBooking(
  req,
  res
) {
  try {
    const {
      id,
    } = req.params;

    if (
      !validObjectId(id)
    ) {
      return res
        .status(400)
        .json({
          message:
            "Invalid booking ID",
        });
    }

    const {
      bookings,
      sessions,
    } = getCollections();

    const bookingId =
      new ObjectId(id);

    const userId =
      new ObjectId(
        req.user.userId
      );

    const booking =
      await bookings.findOne({
        _id:
          bookingId,

        userId,
      });

    if (!booking) {
      return res
        .status(404)
        .json({
          message:
            "Booking not found",
        });
    }

    const deleteResult =
      await bookings.deleteOne({
        _id:
          bookingId,

        userId,
      });

    if (
      deleteResult.deletedCount ===
      0
    ) {
      return res
        .status(404)
        .json({
          message:
            "Booking not found",
        });
    }

    await sessions.updateOne(
      {
        _id:
          booking.sessionId,

        bookedCount: {
          $gt: 0,
        },
      },

      {
        $inc: {
          bookedCount:
            -1,
        },

        $set: {
          updatedAt:
            new Date(),
        },
      }
    );

    return res.json({
      message:
        "Booking cancelled successfully",
    });
  } catch (error) {
    console.error(
      "CANCEL BOOKING ERROR:",
      error
    );

    return res
      .status(500)
      .json({
        message:
          "Could not cancel booking",
      });
  }
}


// ======================================================
// ADMIN - GET ALL BOOKINGS
// ======================================================

export async function getAllBookings(
  req,
  res
) {
  try {
    const {
      bookings,
    } = getCollections();

    const result =
      await bookings
        .aggregate([
          {
            $lookup: {
              from:
                "users",

              localField:
                "userId",

              foreignField:
                "_id",

              as:
                "user",
            },
          },

          {
            $unwind:
              "$user",
          },

          {
            $lookup: {
              from:
                "sessions",

              localField:
                "sessionId",

              foreignField:
                "_id",

              as:
                "session",
            },
          },

          {
            $unwind:
              "$session",
          },

          {
            $lookup: {
              from:
                "events",

              localField:
                "session.eventId",

              foreignField:
                "_id",

              as:
                "event",
            },
          },

          {
            $unwind:
              "$event",
          },

          {
            $sort: {
              createdAt:
                -1,
            },
          },

          {
            $project: {
              _id: 1,
              status: 1,
              createdAt: 1,

              user: {
                _id:
                  "$user._id",

                name:
                  "$user.name",

                email:
                  "$user.email",
              },

              session: {
                _id:
                  "$session._id",

                startAt:
                  "$session.startAt",

                endAt:
                  "$session.endAt",
              },

              event: {
                _id:
                  "$event._id",

                title:
                  "$event.title",

                location:
                  "$event.location",
              },
            },
          },
        ])
        .toArray();

    return res.json(result);
  } catch (error) {
    console.error(
      "ADMIN GET BOOKINGS ERROR:",
      error
    );

    return res
      .status(500)
      .json({
        message:
          "Could not load bookings",
      });
  }
}