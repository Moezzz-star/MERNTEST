import { ObjectId } from "mongodb";

import {
  getCollections,
} from "../config/database.js";

import {
  validObjectId,
} from "../utils/validators.js";


// ======================================================
// GET SESSIONS FOR ONE EVENT
// Authenticated users
// Admin sees all sessions
// Normal users see only future available sessions
// ======================================================

export async function getEventSessions(
  req,
  res
) {
  try {
    const {
      id,
    } = req.params;


    // --------------------------------------------------
    // Validate event ID
    // --------------------------------------------------

    if (
      !validObjectId(id)
    ) {
      return res
        .status(400)
        .json({
          message:
            "Invalid event ID",
        });
    }


    const {
      events,
      sessions,
    } = getCollections();


    const eventId =
      new ObjectId(id);


    // --------------------------------------------------
    // Make sure event exists
    // --------------------------------------------------

    const event =
      await events.findOne({
        _id:
          eventId,
      });


    if (!event) {
      return res
        .status(404)
        .json({
          message:
            "Event not found",
        });
    }


    // --------------------------------------------------
    // Build query
    // --------------------------------------------------

    const filter = {
      eventId,
    };


    // Normal users see only:
    // - available sessions
    // - future sessions
    //
    // Admin can see everything
    if (
      req.user.role !==
      "admin"
    ) {
      filter.status =
        "available";

      filter.startAt = {
        $gt:
          new Date(),
      };
    }


    // --------------------------------------------------
    // Load sessions
    // --------------------------------------------------

    const result =
      await sessions
        .find(filter)
        .sort({
          startAt: 1,
        })
        .toArray();


    // --------------------------------------------------
    // Add remainingPlaces
    // --------------------------------------------------

    const response =
      result.map(
        (session) => ({
          ...session,

          remainingPlaces:
            Math.max(
              0,

              session.capacity -
                (
                  session.bookedCount ||
                  0
                )
            ),
        })
      );


    return res.json(
      response
    );

  } catch (error) {
    console.error(
      "GET SESSIONS ERROR:",
      error
    );


    return res
      .status(500)
      .json({
        message:
          "Could not load sessions",
      });
  }
}


// ======================================================
// CREATE SESSION
// Admin only
//
// POST /events/:id/sessions
// ======================================================

export async function createEventSession(
  req,
  res
) {
  try {
    const {
      id,
    } = req.params;


    const {
      startAt,
      endAt,
      capacity,
    } = req.body;


    // --------------------------------------------------
    // Validate event ID
    // --------------------------------------------------

    if (
      !validObjectId(id)
    ) {
      return res
        .status(400)
        .json({
          message:
            "Invalid event ID",
        });
    }


    // --------------------------------------------------
    // Validate required fields
    // --------------------------------------------------

    if (
      !startAt ||
      !endAt ||
      capacity === undefined
    ) {
      return res
        .status(400)
        .json({
          message:
            "startAt, endAt and capacity are required",
        });
    }


    // --------------------------------------------------
    // Parse dates
    // --------------------------------------------------

    const start =
      new Date(startAt);


    const end =
      new Date(endAt);


    if (
      Number.isNaN(
        start.getTime()
      ) ||
      Number.isNaN(
        end.getTime()
      )
    ) {
      return res
        .status(400)
        .json({
          message:
            "Invalid session date",
        });
    }


    // --------------------------------------------------
    // End must be after start
    // --------------------------------------------------

    if (
      end <= start
    ) {
      return res
        .status(400)
        .json({
          message:
            "Session end must be after its start",
        });
    }


    // --------------------------------------------------
    // Validate capacity
    // --------------------------------------------------

    const numericCapacity =
      Number(capacity);


    if (
      !Number.isInteger(
        numericCapacity
      ) ||
      numericCapacity < 1
    ) {
      return res
        .status(400)
        .json({
          message:
            "Capacity must be a positive integer",
        });
    }


    const {
      events,
      sessions,
    } = getCollections();


    const eventId =
      new ObjectId(id);


    // --------------------------------------------------
    // Check event exists
    // --------------------------------------------------

    const event =
      await events.findOne({
        _id:
          eventId,
      });


    if (!event) {
      return res
        .status(404)
        .json({
          message:
            "Event not found",
        });
    }


    // --------------------------------------------------
    // Create session
    // --------------------------------------------------

    const newSession = {
      eventId,

      startAt:
        start,

      endAt:
        end,

      capacity:
        numericCapacity,

      bookedCount:
        0,

      status:
        "available",

      createdAt:
        new Date(),

      updatedAt:
        new Date(),
    };


    const result =
      await sessions.insertOne(
        newSession
      );


    return res
      .status(201)
      .json({
        message:
          "Session created",

        session: {
          ...newSession,

          _id:
            result.insertedId,

          remainingPlaces:
            numericCapacity,
        },
      });

  } catch (error) {
    console.error(
      "CREATE SESSION ERROR:",
      error
    );


    return res
      .status(500)
      .json({
        message:
          "Could not create session",
      });
  }
}


// ======================================================
// UPDATE SESSION
// Admin only
//
// PUT /sessions/:id
// ======================================================

export async function updateSession(
  req,
  res
) {
  try {
    const {
      id,
    } = req.params;


    const {
      startAt,
      endAt,
      capacity,
      status,
    } = req.body;


    // --------------------------------------------------
    // Validate session ID
    // --------------------------------------------------

    if (
      !validObjectId(id)
    ) {
      return res
        .status(400)
        .json({
          message:
            "Invalid session ID",
        });
    }


    const {
      sessions,
    } = getCollections();


    const sessionId =
      new ObjectId(id);


    // --------------------------------------------------
    // Find existing session
    // --------------------------------------------------

    const existing =
      await sessions.findOne({
        _id:
          sessionId,
      });


    if (!existing) {
      return res
        .status(404)
        .json({
          message:
            "Session not found",
        });
    }


    // --------------------------------------------------
    // Validate required fields
    // --------------------------------------------------

    if (
      !startAt ||
      !endAt ||
      capacity === undefined
    ) {
      return res
        .status(400)
        .json({
          message:
            "startAt, endAt and capacity are required",
        });
    }


    // --------------------------------------------------
    // Parse dates
    // --------------------------------------------------

    const start =
      new Date(startAt);


    const end =
      new Date(endAt);


    if (
      Number.isNaN(
        start.getTime()
      ) ||
      Number.isNaN(
        end.getTime()
      )
    ) {
      return res
        .status(400)
        .json({
          message:
            "Invalid session date",
        });
    }


    if (
      end <= start
    ) {
      return res
        .status(400)
        .json({
          message:
            "Session end must be after start",
        });
    }


    // --------------------------------------------------
    // Validate capacity
    // --------------------------------------------------

    const numericCapacity =
      Number(capacity);


    if (
      !Number.isInteger(
        numericCapacity
      ) ||
      numericCapacity < 1
    ) {
      return res
        .status(400)
        .json({
          message:
            "Capacity must be a positive integer",
        });
    }


    // Can't reduce capacity below
    // already-booked seats
    if (
      numericCapacity <
      (
        existing.bookedCount ||
        0
      )
    ) {
      return res
        .status(409)
        .json({
          message:
            `Capacity cannot be lower than the current number of bookings (${existing.bookedCount || 0})`,
        });
    }


    // --------------------------------------------------
    // Validate status
    // --------------------------------------------------

    const allowedStatuses = [
      "available",
      "cancelled",
    ];


    if (
      status &&
      !allowedStatuses.includes(
        status
      )
    ) {
      return res
        .status(400)
        .json({
          message:
            "Invalid session status",
        });
    }


    // --------------------------------------------------
    // Update session
    // --------------------------------------------------

    await sessions.updateOne(
      {
        _id:
          sessionId,
      },

      {
        $set: {
          startAt:
            start,

          endAt:
            end,

          capacity:
            numericCapacity,

          status:
            status ||
            existing.status,

          updatedAt:
            new Date(),
        },
      }
    );


    const updatedSession =
      await sessions.findOne({
        _id:
          sessionId,
      });


    return res.json({
      message:
        "Session updated",

      session: {
        ...updatedSession,

        remainingPlaces:
          Math.max(
            0,

            updatedSession.capacity -
              (
                updatedSession.bookedCount ||
                0
              )
          ),
      },
    });

  } catch (error) {
    console.error(
      "UPDATE SESSION ERROR:",
      error
    );


    return res
      .status(500)
      .json({
        message:
          "Could not update session",
      });
  }
}


// ======================================================
// DELETE SESSION
// Admin only
//
// DELETE /sessions/:id
// ======================================================

export async function deleteSession(
  req,
  res
) {
  try {
    const {
      id,
    } = req.params;


    // --------------------------------------------------
    // Validate session ID
    // --------------------------------------------------

    if (
      !validObjectId(id)
    ) {
      return res
        .status(400)
        .json({
          message:
            "Invalid session ID",
        });
    }


    const {
      sessions,
      bookings,
    } = getCollections();


    const sessionId =
      new ObjectId(id);


    // --------------------------------------------------
    // Prevent deleting a session
    // that already has bookings
    // --------------------------------------------------

    const bookingCount =
      await bookings.countDocuments({
        sessionId,
      });


    if (
      bookingCount > 0
    ) {
      return res
        .status(409)
        .json({
          message:
            "This session has bookings and cannot be deleted",
        });
    }


    // --------------------------------------------------
    // Delete
    // --------------------------------------------------

    const result =
      await sessions.deleteOne({
        _id:
          sessionId,
      });


    if (
      result.deletedCount === 0
    ) {
      return res
        .status(404)
        .json({
          message:
            "Session not found",
        });
    }


    return res.json({
      message:
        "Session deleted successfully",
    });

  } catch (error) {
    console.error(
      "DELETE SESSION ERROR:",
      error
    );


    return res
      .status(500)
      .json({
        message:
          "Could not delete session",
      });
  }
}