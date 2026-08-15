import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import {
  MongoClient,
  ServerApiVersion,
  ObjectId,
} from "mongodb";

dotenv.config();

const app = express();

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;
const JWT_SECRET = process.env.JWT_SECRET;
const FRONTEND_URL = process.env.FRONTEND_URL;


// ======================================================
// ENV CHECK
// ======================================================

if (!MONGO_URI) {
  console.error("❌ MONGO_URI is missing");
  process.exit(1);
}

if (!JWT_SECRET) {
  console.error("❌ JWT_SECRET is missing");
  process.exit(1);
}


// ======================================================
// CORS
// ======================================================

const allowedOrigins = [
  "http://localhost:5173",
  FRONTEND_URL,
].filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      // PowerShell, Postman, curl, etc.
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(
        new Error(`Origin ${origin} is not allowed by CORS`)
      );
    },
  })
);

app.use(express.json());


// ======================================================
// DATABASE
// ======================================================

const client = new MongoClient(MONGO_URI, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

let users;
let events;
let sessions;
let bookings;


// ======================================================
// HELPERS
// ======================================================

function publicUser(user) {
  if (!user) return null;

  return {
    _id: user._id,
    name: user.name,
    email: user.email,
    age: user.age ?? null,
    role: user.role || "user",
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}


function generateToken(user) {
  return jwt.sign(
    {
      userId: user._id.toString(),
      role: user.role || "user",
    },
    JWT_SECRET,
    {
      expiresIn: "7d",
    }
  );
}


function validObjectId(id) {
  return ObjectId.isValid(id);
}


// ======================================================
// AUTH MIDDLEWARE
// ======================================================

function requireAuth(req, res, next) {
  try {
    const authorization = req.headers.authorization;

    if (
      !authorization ||
      !authorization.startsWith("Bearer ")
    ) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    const token = authorization.split(" ")[1];

    const decoded = jwt.verify(
      token,
      JWT_SECRET
    );

    req.user = decoded;

    next();

  } catch (error) {
    return res.status(401).json({
      message: "Invalid or expired token",
    });
  }
}


// ======================================================
// ADMIN MIDDLEWARE
// ======================================================

function requireAdmin(req, res, next) {
  if (req.user.role !== "admin") {
    return res.status(403).json({
      message: "Admin access required",
    });
  }

  next();
}


// ======================================================
// ROOT
// ======================================================

app.get("/", (req, res) => {
  res.json({
    message: "Backend is working",
    authentication: true,
    bookingSystem: true,
  });
});


// ======================================================
// AUTH - REGISTER
// ======================================================

app.post("/auth/register", async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      age,
    } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        message:
          "Name, email and password are required",
      });
    }

    if (name.trim().length < 2) {
      return res.status(400).json({
        message:
          "Name must contain at least 2 characters",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        message:
          "Password must contain at least 8 characters",
      });
    }

    if (
      age !== undefined &&
      age !== "" &&
      Number(age) < 1
    ) {
      return res.status(400).json({
        message: "Age is invalid",
      });
    }

    const normalizedEmail =
      email.trim().toLowerCase();

    const existingUser =
      await users.findOne({
        email: normalizedEmail,
      });

    if (existingUser) {
      return res.status(409).json({
        message:
          "An account with this email already exists",
      });
    }

    const hashedPassword =
      await bcrypt.hash(
        password,
        10
      );

    const newUser = {
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,

      age:
        age !== undefined &&
        age !== ""
          ? Number(age)
          : null,

      role: "user",

      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result =
      await users.insertOne(
        newUser
      );

    const createdUser = {
      ...newUser,
      _id: result.insertedId,
    };

    const token =
      generateToken(
        createdUser
      );

    res.status(201).json({
      message:
        "Account created successfully",

      token,

      user:
        publicUser(
          createdUser
        ),
    });

  } catch (error) {
    console.error(
      "REGISTER ERROR:",
      error
    );

    if (error.code === 11000) {
      return res.status(409).json({
        message:
          "Email already exists",
      });
    }

    res.status(500).json({
      message:
        "Registration failed",
    });
  }
});


// ======================================================
// AUTH - LOGIN
// ======================================================

app.post("/auth/login", async (req, res) => {
  try {
    const {
      email,
      password,
    } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message:
          "Email and password are required",
      });
    }

    const normalizedEmail =
      email.trim().toLowerCase();

    const user =
      await users.findOne({
        email: normalizedEmail,
      });

    if (!user || !user.password) {
      return res.status(401).json({
        message:
          "Invalid email or password",
      });
    }

    const passwordCorrect =
      await bcrypt.compare(
        password,
        user.password
      );

    if (!passwordCorrect) {
      return res.status(401).json({
        message:
          "Invalid email or password",
      });
    }

    const token =
      generateToken(user);

    res.json({
      message:
        "Login successful",

      token,

      user:
        publicUser(user),
    });

  } catch (error) {
    console.error(
      "LOGIN ERROR:",
      error
    );

    res.status(500).json({
      message:
        "Login failed",
    });
  }
});


// ======================================================
// AUTH - CURRENT USER
// ======================================================

app.get(
  "/auth/me",
  requireAuth,

  async (req, res) => {
    try {
      if (
        !validObjectId(
          req.user.userId
        )
      ) {
        return res.status(400).json({
          message:
            "Invalid user ID",
        });
      }

      const user =
        await users.findOne({
          _id:
            new ObjectId(
              req.user.userId
            ),
        });

      if (!user) {
        return res.status(404).json({
          message:
            "User not found",
        });
      }

      res.json(
        publicUser(user)
      );

    } catch (error) {
      console.error(
        "AUTH ME ERROR:",
        error
      );

      res.status(500).json({
        message:
          "Could not load account",
      });
    }
  }
);


// ======================================================
// AUTH - UPDATE OWN PROFILE
// ======================================================

app.put(
  "/auth/me",
  requireAuth,

  async (req, res) => {
    try {
      const {
        name,
        age,
      } = req.body;

      if (!name) {
        return res.status(400).json({
          message:
            "Name is required",
        });
      }

      if (
        name.trim().length < 2
      ) {
        return res.status(400).json({
          message:
            "Name must contain at least 2 characters",
        });
      }

      if (
        age !== undefined &&
        age !== "" &&
        Number(age) < 1
      ) {
        return res.status(400).json({
          message:
            "Age is invalid",
        });
      }

      const id =
        new ObjectId(
          req.user.userId
        );

      const result =
        await users.updateOne(
          {
            _id: id,
          },
          {
            $set: {
              name:
                name.trim(),

              age:
                age !== undefined &&
                age !== ""
                  ? Number(age)
                  : null,

              updatedAt:
                new Date(),
            },
          }
        );

      if (
        result.matchedCount === 0
      ) {
        return res.status(404).json({
          message:
            "User not found",
        });
      }

      const updatedUser =
        await users.findOne({
          _id: id,
        });

      res.json({
        message:
          "Profile updated",

        user:
          publicUser(
            updatedUser
          ),
      });

    } catch (error) {
      console.error(
        "PROFILE UPDATE ERROR:",
        error
      );

      res.status(500).json({
        message:
          "Could not update profile",
      });
    }
  }
);


// ======================================================
// ADMIN - USERS
// ======================================================

app.get(
  "/users",
  requireAuth,
  requireAdmin,

  async (req, res) => {
    try {
      const result =
        await users
          .find({})
          .sort({
            createdAt: -1,
          })
          .toArray();

      res.json(
        result.map(
          publicUser
        )
      );

    } catch (error) {
      console.error(
        "GET USERS ERROR:",
        error
      );

      res.status(500).json({
        message:
          "Could not load users",
      });
    }
  }
);


app.post(
  "/users",
  requireAuth,
  requireAdmin,

  async (req, res) => {
    try {
      const {
        name,
        email,
        password,
        age,
      } = req.body;

      if (
        !name ||
        !email ||
        !password
      ) {
        return res.status(400).json({
          message:
            "Name, email and password are required",
        });
      }

      if (password.length < 8) {
        return res.status(400).json({
          message:
            "Password must contain at least 8 characters",
        });
      }

      const normalizedEmail =
        email.trim().toLowerCase();

      const exists =
        await users.findOne({
          email:
            normalizedEmail,
        });

      if (exists) {
        return res.status(409).json({
          message:
            "Email already exists",
        });
      }

      const hashedPassword =
        await bcrypt.hash(
          password,
          10
        );

      const newUser = {
        name:
          name.trim(),

        email:
          normalizedEmail,

        password:
          hashedPassword,

        age:
          age !== undefined &&
          age !== ""
            ? Number(age)
            : null,

        role:
          "user",

        createdAt:
          new Date(),

        updatedAt:
          new Date(),
      };

      const result =
        await users.insertOne(
          newUser
        );

      const createdUser = {
        ...newUser,
        _id:
          result.insertedId,
      };

      res.status(201).json({
        message:
          "User created",

        user:
          publicUser(
            createdUser
          ),
      });

    } catch (error) {
      console.error(
        "CREATE USER ERROR:",
        error
      );

      if (error.code === 11000) {
        return res.status(409).json({
          message:
            "Email already exists",
        });
      }

      res.status(500).json({
        message:
          "Could not create user",
      });
    }
  }
);


app.put(
  "/users/:id",
  requireAuth,
  requireAdmin,

  async (req, res) => {
    try {
      const { id } =
        req.params;

      const {
        name,
        email,
        age,
      } = req.body;

      if (
        !validObjectId(id)
      ) {
        return res.status(400).json({
          message:
            "Invalid user ID",
        });
      }

      if (!name || !email) {
        return res.status(400).json({
          message:
            "Name and email are required",
        });
      }

      const userId =
        new ObjectId(id);

      const normalizedEmail =
        email.trim().toLowerCase();

      const emailOwner =
        await users.findOne({
          email:
            normalizedEmail,

          _id: {
            $ne:
              userId,
          },
        });

      if (emailOwner) {
        return res.status(409).json({
          message:
            "Email already used by another user",
        });
      }

      const result =
        await users.updateOne(
          {
            _id:
              userId,
          },
          {
            $set: {
              name:
                name.trim(),

              email:
                normalizedEmail,

              age:
                age !== undefined &&
                age !== ""
                  ? Number(age)
                  : null,

              updatedAt:
                new Date(),
            },
          }
        );

      if (
        result.matchedCount === 0
      ) {
        return res.status(404).json({
          message:
            "User not found",
        });
      }

      const updatedUser =
        await users.findOne({
          _id:
            userId,
        });

      res.json({
        message:
          "User updated",

        user:
          publicUser(
            updatedUser
          ),
      });

    } catch (error) {
      console.error(
        "UPDATE USER ERROR:",
        error
      );

      res.status(500).json({
        message:
          "Could not update user",
      });
    }
  }
);


app.delete(
  "/users/:id",
  requireAuth,
  requireAdmin,

  async (req, res) => {
    try {
      const { id } =
        req.params;

      if (
        !validObjectId(id)
      ) {
        return res.status(400).json({
          message:
            "Invalid user ID",
        });
      }

      if (
        id ===
        req.user.userId
      ) {
        return res.status(400).json({
          message:
            "You cannot delete your own account",
        });
      }

      const userId =
        new ObjectId(id);

      const userBookings =
        await bookings.countDocuments({
          userId,
        });

      if (userBookings > 0) {
        return res.status(409).json({
          message:
            "This user has bookings. Delete or cancel them first.",
        });
      }

      const result =
        await users.deleteOne({
          _id:
            userId,
        });

      if (
        result.deletedCount === 0
      ) {
        return res.status(404).json({
          message:
            "User not found",
        });
      }

      res.json({
        message:
          "User deleted successfully",
      });

    } catch (error) {
      console.error(
        "DELETE USER ERROR:",
        error
      );

      res.status(500).json({
        message:
          "Could not delete user",
      });
    }
  }
);


// ======================================================
// EVENTS
// ======================================================


// ------------------------------------------------------
// GET ALL EVENTS
// Any authenticated user
// ------------------------------------------------------

app.get(
  "/events",
  requireAuth,

  async (req, res) => {
    try {
      const result =
        await events
          .find({})
          .sort({
            createdAt: -1,
          })
          .toArray();

      res.json(result);

    } catch (error) {
      console.error(
        "GET EVENTS ERROR:",
        error
      );

      res.status(500).json({
        message:
          "Could not load events",
      });
    }
  }
);


// ------------------------------------------------------
// GET ONE EVENT
// ------------------------------------------------------

app.get(
  "/events/:id",
  requireAuth,

  async (req, res) => {
    try {
      const { id } =
        req.params;

      if (
        !validObjectId(id)
      ) {
        return res.status(400).json({
          message:
            "Invalid event ID",
        });
      }

      const event =
        await events.findOne({
          _id:
            new ObjectId(id),
        });

      if (!event) {
        return res.status(404).json({
          message:
            "Event not found",
        });
      }

      res.json(event);

    } catch (error) {
      console.error(
        "GET EVENT ERROR:",
        error
      );

      res.status(500).json({
        message:
          "Could not load event",
      });
    }
  }
);


// ------------------------------------------------------
// ADMIN CREATE EVENT
// ------------------------------------------------------

app.post(
  "/events",
  requireAuth,
  requireAdmin,

  async (req, res) => {
    try {
      const {
        title,
        description,
        location,
      } = req.body;

      if (!title) {
        return res.status(400).json({
          message:
            "Event title is required",
        });
      }

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

      res.status(201).json({
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

      res.status(500).json({
        message:
          "Could not create event",
      });
    }
  }
);


// ------------------------------------------------------
// ADMIN UPDATE EVENT
// ------------------------------------------------------

app.put(
  "/events/:id",
  requireAuth,
  requireAdmin,

  async (req, res) => {
    try {
      const { id } =
        req.params;

      const {
        title,
        description,
        location,
      } = req.body;

      if (
        !validObjectId(id)
      ) {
        return res.status(400).json({
          message:
            "Invalid event ID",
        });
      }

      if (!title) {
        return res.status(400).json({
          message:
            "Event title is required",
        });
      }

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
        return res.status(404).json({
          message:
            "Event not found",
        });
      }

      const updatedEvent =
        await events.findOne({
          _id:
            eventId,
        });

      res.json({
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

      res.status(500).json({
        message:
          "Could not update event",
      });
    }
  }
);


// ------------------------------------------------------
// ADMIN DELETE EVENT
// ------------------------------------------------------

app.delete(
  "/events/:id",
  requireAuth,
  requireAdmin,

  async (req, res) => {
    try {
      const { id } =
        req.params;

      if (
        !validObjectId(id)
      ) {
        return res.status(400).json({
          message:
            "Invalid event ID",
        });
      }

      const eventId =
        new ObjectId(id);

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
          session =>
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

        if (bookingCount > 0) {
          return res.status(409).json({
            message:
              "This event has active bookings and cannot be deleted",
          });
        }

        await sessions.deleteMany({
          eventId,
        });
      }

      const result =
        await events.deleteOne({
          _id:
            eventId,
        });

      if (
        result.deletedCount === 0
      ) {
        return res.status(404).json({
          message:
            "Event not found",
        });
      }

      res.json({
        message:
          "Event deleted successfully",
      });

    } catch (error) {
      console.error(
        "DELETE EVENT ERROR:",
        error
      );

      res.status(500).json({
        message:
          "Could not delete event",
      });
    }
  }
);


// ======================================================
// SESSIONS
// ======================================================


// ------------------------------------------------------
// GET SESSIONS FOR EVENT
// ------------------------------------------------------

app.get(
  "/events/:id/sessions",
  requireAuth,

  async (req, res) => {
    try {
      const { id } =
        req.params;

      if (
        !validObjectId(id)
      ) {
        return res.status(400).json({
          message:
            "Invalid event ID",
        });
      }

      const eventId =
        new ObjectId(id);

      const event =
        await events.findOne({
          _id:
            eventId,
        });

      if (!event) {
        return res.status(404).json({
          message:
            "Event not found",
        });
      }

      const filter = {
        eventId,
      };

      // Normal users only need future available sessions.
      if (
        req.user.role !== "admin"
      ) {
        filter.status =
          "available";

        filter.startAt = {
          $gt:
            new Date(),
        };
      }

      const result =
        await sessions
          .find(filter)
          .sort({
            startAt: 1,
          })
          .toArray();

      const response =
        result.map(
          session => ({
            ...session,

            remainingPlaces:
              Math.max(
                0,
                session.capacity -
                  (session.bookedCount || 0)
              ),
          })
        );

      res.json(response);

    } catch (error) {
      console.error(
        "GET SESSIONS ERROR:",
        error
      );

      res.status(500).json({
        message:
          "Could not load sessions",
      });
    }
  }
);


// ------------------------------------------------------
// ADMIN CREATE SESSION
// ------------------------------------------------------

app.post(
  "/events/:id/sessions",
  requireAuth,
  requireAdmin,

  async (req, res) => {
    try {
      const { id } =
        req.params;

      const {
        startAt,
        endAt,
        capacity,
      } = req.body;

      if (
        !validObjectId(id)
      ) {
        return res.status(400).json({
          message:
            "Invalid event ID",
        });
      }

      if (
        !startAt ||
        !endAt ||
        capacity === undefined
      ) {
        return res.status(400).json({
          message:
            "startAt, endAt and capacity are required",
        });
      }

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
        return res.status(400).json({
          message:
            "Invalid session date",
        });
      }

      if (end <= start) {
        return res.status(400).json({
          message:
            "Session end must be after its start",
        });
      }

      const numericCapacity =
        Number(capacity);

      if (
        !Number.isInteger(
          numericCapacity
        ) ||
        numericCapacity < 1
      ) {
        return res.status(400).json({
          message:
            "Capacity must be a positive integer",
        });
      }

      const eventId =
        new ObjectId(id);

      const event =
        await events.findOne({
          _id:
            eventId,
        });

      if (!event) {
        return res.status(404).json({
          message:
            "Event not found",
        });
      }

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

      res.status(201).json({
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

      res.status(500).json({
        message:
          "Could not create session",
      });
    }
  }
);


// ------------------------------------------------------
// ADMIN UPDATE SESSION
// ------------------------------------------------------

app.put(
  "/sessions/:id",
  requireAuth,
  requireAdmin,

  async (req, res) => {
    try {
      const { id } =
        req.params;

      const {
        startAt,
        endAt,
        capacity,
        status,
      } = req.body;

      if (
        !validObjectId(id)
      ) {
        return res.status(400).json({
          message:
            "Invalid session ID",
        });
      }

      const sessionId =
        new ObjectId(id);

      const existing =
        await sessions.findOne({
          _id:
            sessionId,
        });

      if (!existing) {
        return res.status(404).json({
          message:
            "Session not found",
        });
      }

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
        return res.status(400).json({
          message:
            "Invalid session date",
        });
      }

      if (end <= start) {
        return res.status(400).json({
          message:
            "Session end must be after start",
        });
      }

      const numericCapacity =
        Number(capacity);

      if (
        !Number.isInteger(
          numericCapacity
        ) ||
        numericCapacity < 1
      ) {
        return res.status(400).json({
          message:
            "Capacity must be a positive integer",
        });
      }

      if (
        numericCapacity <
        (existing.bookedCount || 0)
      ) {
        return res.status(409).json({
          message:
            `Capacity cannot be lower than the current number of bookings (${existing.bookedCount || 0})`,
        });
      }

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
        return res.status(400).json({
          message:
            "Invalid session status",
        });
      }

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

      res.json({
        message:
          "Session updated",

        session: {
          ...updatedSession,

          remainingPlaces:
            Math.max(
              0,
              updatedSession.capacity -
                (updatedSession.bookedCount || 0)
            ),
        },
      });

    } catch (error) {
      console.error(
        "UPDATE SESSION ERROR:",
        error
      );

      res.status(500).json({
        message:
          "Could not update session",
      });
    }
  }
);


// ------------------------------------------------------
// ADMIN DELETE SESSION
// ------------------------------------------------------

app.delete(
  "/sessions/:id",
  requireAuth,
  requireAdmin,

  async (req, res) => {
    try {
      const { id } =
        req.params;

      if (
        !validObjectId(id)
      ) {
        return res.status(400).json({
          message:
            "Invalid session ID",
        });
      }

      const sessionId =
        new ObjectId(id);

      const bookingCount =
        await bookings.countDocuments({
          sessionId,
        });

      if (bookingCount > 0) {
        return res.status(409).json({
          message:
            "This session has bookings and cannot be deleted",
        });
      }

      const result =
        await sessions.deleteOne({
          _id:
            sessionId,
        });

      if (
        result.deletedCount === 0
      ) {
        return res.status(404).json({
          message:
            "Session not found",
        });
      }

      res.json({
        message:
          "Session deleted successfully",
      });

    } catch (error) {
      console.error(
        "DELETE SESSION ERROR:",
        error
      );

      res.status(500).json({
        message:
          "Could not delete session",
      });
    }
  }
);


// ======================================================
// BOOKINGS
// ======================================================


// ------------------------------------------------------
// CREATE BOOKING
//
// POST /bookings
//
// Body:
// {
//   "sessionId": "..."
// }
// ------------------------------------------------------

app.post(
  "/bookings",
  requireAuth,

  async (req, res) => {
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
        return res.status(400).json({
          message:
            "Valid sessionId is required",
        });
      }

      const userObjectId =
        new ObjectId(
          req.user.userId
        );

      const sessionObjectId =
        new ObjectId(
          sessionId
        );


      // ------------------------------------------
      // Already booked?
      // ------------------------------------------

      const existingBooking =
        await bookings.findOne({
          userId:
            userObjectId,

          sessionId:
            sessionObjectId,
        });

      if (existingBooking) {
        return res.status(409).json({
          message:
            "You already booked this session",
        });
      }


      // ------------------------------------------
      // Check session
      // ------------------------------------------

      const session =
        await sessions.findOne({
          _id:
            sessionObjectId,
        });

      if (!session) {
        return res.status(404).json({
          message:
            "Session not found",
        });
      }

      if (
        session.status !==
        "available"
      ) {
        return res.status(409).json({
          message:
            "This session is not available",
        });
      }

      if (
        session.startAt <=
        new Date()
      ) {
        return res.status(409).json({
          message:
            "This session has already started",
        });
      }


      // ------------------------------------------
      // Atomic seat reservation
      //
      // bookedCount must be < capacity.
      // Only one request can claim each place.
      // ------------------------------------------

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
        reserveResult.matchedCount === 0
      ) {
        return res.status(409).json({
          message:
            "This session is full or unavailable",
        });
      }


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

        res.status(201).json({
          message:
            "Booking confirmed",

          booking: {
            ...newBooking,
            _id:
              result.insertedId,
          },
        });

      } catch (insertError) {

        // Give the seat back if booking insertion fails.
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
          }
        );


        if (
          insertError.code ===
          11000
        ) {
          return res.status(409).json({
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

      res.status(500).json({
        message:
          "Could not create booking",
      });
    }
  }
);


// ------------------------------------------------------
// GET MY BOOKINGS
// ------------------------------------------------------

app.get(
  "/bookings/me",
  requireAuth,

  async (req, res) => {
    try {
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

      res.json(result);

    } catch (error) {
      console.error(
        "GET MY BOOKINGS ERROR:",
        error
      );

      res.status(500).json({
        message:
          "Could not load bookings",
      });
    }
  }
);


// ------------------------------------------------------
// CANCEL OWN BOOKING
// ------------------------------------------------------

app.delete(
  "/bookings/:id",
  requireAuth,

  async (req, res) => {
    try {
      const { id } =
        req.params;

      if (
        !validObjectId(id)
      ) {
        return res.status(400).json({
          message:
            "Invalid booking ID",
        });
      }

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
        return res.status(404).json({
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
        deleteResult.deletedCount === 0
      ) {
        return res.status(404).json({
          message:
            "Booking not found",
        });
      }

      await sessions.updateOne(
        {
          _id:
            booking.sessionId,

          bookedCount: {
            $gt:
              0,
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

      res.json({
        message:
          "Booking cancelled successfully",
      });

    } catch (error) {
      console.error(
        "CANCEL BOOKING ERROR:",
        error
      );

      res.status(500).json({
        message:
          "Could not cancel booking",
      });
    }
  }
);


// ------------------------------------------------------
// ADMIN - GET ALL BOOKINGS
// ------------------------------------------------------

app.get(
  "/bookings",
  requireAuth,
  requireAdmin,

  async (req, res) => {
    try {
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

      res.json(result);

    } catch (error) {
      console.error(
        "ADMIN GET BOOKINGS ERROR:",
        error
      );

      res.status(500).json({
        message:
          "Could not load bookings",
      });
    }
  }
);


// ======================================================
// 404
// ======================================================

app.use((req, res) => {
  res.status(404).json({
    message:
      "Route not found",
  });
});


// ======================================================
// START SERVER
// ======================================================

async function startServer() {
  try {
    await client.connect();

    await client
      .db("admin")
      .command({
        ping: 1,
      });

    console.log(
      "✅ MongoDB Atlas connected"
    );

    const db =
      client.db(
        "test_app"
      );

    users =
      db.collection(
        "users"
      );

    events =
      db.collection(
        "events"
      );

    sessions =
      db.collection(
        "sessions"
      );

    bookings =
      db.collection(
        "bookings"
      );


    // ==================================================
    // INDEXES
    // ==================================================

    await users.createIndex(
      {
        email: 1,
      },
      {
        unique: true,
      }
    );


    await sessions.createIndex({
      eventId: 1,
      startAt: 1,
    });


    // A user can only book a session once.
    await bookings.createIndex(
      {
        userId: 1,
        sessionId: 1,
      },
      {
        unique: true,
      }
    );


    await bookings.createIndex({
      userId: 1,
    });


    await bookings.createIndex({
      sessionId: 1,
    });


    console.log(
      "✅ Database indexes ready"
    );


    app.listen(
      PORT,
      "0.0.0.0",
      () => {
        console.log(
          `🚀 Server running on port ${PORT}`
        );
      }
    );

  } catch (error) {
    console.error(
      "❌ Failed to start server:",
      error
    );

    process.exit(1);
  }
}


startServer();