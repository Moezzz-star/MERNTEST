import { ObjectId } from "mongodb";

import {
  getCollections,
} from "../config/database.js";

import {
  validObjectId,
} from "../utils/validators.js";


// ======================================================
// GET EVENTS
// ======================================================

export async function getEvents(
  req,
  res
) {
  try {
    const {
      events,
    } = getCollections();

    const result =
      await events
        .find({})
        .sort({
          createdAt: -1,
        })
        .toArray();

    return res.json(result);
  } catch (error) {
    console.error(
      "GET EVENTS ERROR:",
      error
    );

    return res
      .status(500)
      .json({
        message:
          "Could not load events",
      });
  }
}


// ======================================================
// GET EVENT
// ======================================================

export async function getEvent(
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
            "Invalid event ID",
        });
    }

    const {
      events,
    } = getCollections();

    const event =
      await events.findOne({
        _id:
          new ObjectId(id),
      });

    if (!event) {
      return res
        .status(404)
        .json({
          message:
            "Event not found",
        });
    }

    return res.json(event);
  } catch (error) {
    console.error(
      "GET EVENT ERROR:",
      error
    );

    return res
      .status(500)
      .json({
        message:
          "Could not load event",
      });
  }
}


// ======================================================
// CREATE EVENT
// ======================================================

export async function createEvent(
  req,
  res
) {
  try {
    const {
      title,
      description,
      location,
    } = req.body;

    if (!title) {
      return res
        .status(400)
        .json({
          message:
            "Event title is required",
        });
    }

    const {
      events,
    } = getCollections();

    const newEvent = {
      title:
        title.trim(),

      description:
        description?.trim() || "",

      location:
        location?.trim() || "",

      createdBy:
        new ObjectId(
          req.user.userId
        ),

      createdAt:
        new Date(),

      updatedAt:
        new Date(),
    };

    const result =
      await events.insertOne(
        newEvent
      );

    return res
      .status(201)
      .json({
        message:
          "Event created",

        event: {
          ...newEvent,
          _id:
            result.insertedId,
        },
      });
  } catch (error) {
    console.error(
      "CREATE EVENT ERROR:",
      error
    );

    return res
      .status(500)
      .json({
        message:
          "Could not create event",
      });
  }
}


// ======================================================
// UPDATE EVENT
// ======================================================

export async function updateEvent(
  req,
  res
) {
  try {
    const {
      id,
    } = req.params;

    const {
      title,
      description,
      location,
    } = req.body;

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

    if (!title) {
      return res
        .status(400)
        .json({
          message:
            "Event title is required",
        });
    }

    const {
      events,
    } = getCollections();

    const eventId =
      new ObjectId(id);

    const result =
      await events.updateOne(
        {
          _id:
            eventId,
        },
        {
          $set: {
            title:
              title.trim(),

            description:
              description?.trim() || "",

            location:
              location?.trim() || "",

            updatedAt:
              new Date(),
          },
        }
      );

    if (
      result.matchedCount === 0
    ) {
      return res
        .status(404)
        .json({
          message:
            "Event not found",
        });
    }

    const updatedEvent =
      await events.findOne({
        _id:
          eventId,
      });

    return res.json({
      message:
        "Event updated",

      event:
        updatedEvent,
    });
  } catch (error) {
    console.error(
      "UPDATE EVENT ERROR:",
      error
    );

    return res
      .status(500)
      .json({
        message:
          "Could not update event",
      });
  }
}


// ======================================================
// DELETE EVENT
// ======================================================

export async function deleteEvent(
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
            "Invalid event ID",
        });
    }

    const {
      events,
      sessions,
      bookings,
    } = getCollections();

    const eventId =
      new ObjectId(id);

    const existingEvent =
      await events.findOne({
        _id:
          eventId,
      });

    if (!existingEvent) {
      return res
        .status(404)
        .json({
          message:
            "Event not found",
        });
    }

    const eventSessions =
      await sessions
        .find(
          {
            eventId,
          },
          {
            projection: {
              _id: 1,
            },
          }
        )
        .toArray();

    const sessionIds =
      eventSessions.map(
        (session) =>
          session._id
      );

    if (
      sessionIds.length > 0
    ) {
      const bookingCount =
        await bookings.countDocuments({
          sessionId: {
            $in:
              sessionIds,
          },
        });

      if (
        bookingCount > 0
      ) {
        return res
          .status(409)
          .json({
            message:
              "This event has active bookings and cannot be deleted",
          });
      }

      await sessions.deleteMany({
        eventId,
      });
    }

    await events.deleteOne({
      _id:
        eventId,
    });

    return res.json({
      message:
        "Event deleted successfully",
    });
  } catch (error) {
    console.error(
      "DELETE EVENT ERROR:",
      error
    );

    return res
      .status(500)
      .json({
        message:
          "Could not delete event",
      });
  }
}