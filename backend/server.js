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
  "https://merntest-zouari.vercel.app",
];

app.use(
  cors({
    origin(origin, callback) {

      // PowerShell, Postman, curl, server-to-server...
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


// ======================================================
// USER SANITIZER
// Never return password hashes
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


// ======================================================
// JWT
// ======================================================

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
// BASIC ROUTE
// ======================================================

app.get("/", (req, res) => {
  res.json({
    message: "Backend is working",
    authentication: true,
  });
});


// ======================================================
// REGISTER
// POST /auth/register
// ======================================================

app.post("/auth/register", async (req, res) => {
  try {

    const {
      name,
      email,
      password,
      age,
    } = req.body;


    // -------------------------
    // Validation
    // -------------------------

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


    // -------------------------
    // Existing user?
    // -------------------------

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


    // -------------------------
    // Password hash
    // -------------------------

    const hashedPassword =
      await bcrypt.hash(
        password,
        10
      );


    // -------------------------
    // User
    // IMPORTANT:
    // registration can NEVER
    // choose admin role
    // -------------------------

    const newUser = {
      name: name.trim(),
      email: normalizedEmail,

      password:
        hashedPassword,

      age:
        age !== undefined &&
        age !== ""
          ? Number(age)
          : null,

      role: "user",

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
// LOGIN
// POST /auth/login
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


    // Old CRUD users may not have passwords
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
// CURRENT USER
// GET /auth/me
// ======================================================

app.get(
  "/auth/me",
  requireAuth,

  async (req, res) => {
    try {

      if (
        !ObjectId.isValid(
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
// UPDATE OWN PROFILE
// PUT /auth/me
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


      if (name.trim().length < 2) {
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
// ADMIN: GET USERS
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


// ======================================================
// ADMIN: CREATE USER
// ======================================================

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

        role: "user",

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


// ======================================================
// ADMIN: UPDATE USER
// ======================================================

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


      if (!ObjectId.isValid(id)) {
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


      if (error.code === 11000) {
        return res.status(409).json({
          message:
            "Email already exists",
        });
      }


      res.status(500).json({
        message:
          "Could not update user",
      });
    }
  }
);


// ======================================================
// ADMIN: DELETE USER
// ======================================================

app.delete(
  "/users/:id",
  requireAuth,
  requireAdmin,

  async (req, res) => {
    try {

      const { id } =
        req.params;


      if (!ObjectId.isValid(id)) {
        return res.status(400).json({
          message:
            "Invalid user ID",
        });
      }


      // Prevent admin from deleting
      // the currently logged-in account.
      if (
        id ===
        req.user.userId
      ) {
        return res.status(400).json({
          message:
            "You cannot delete your own account from the admin dashboard",
        });
      }


      const result =
        await users.deleteOne({
          _id:
            new ObjectId(id),
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
// 404
// ======================================================

app.use((req, res) => {
  res.status(404).json({
    message:
      "Route not found",
  });
});


// ======================================================
// START
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


    // MongoDB itself now guarantees
    // unique email addresses.
    await users.createIndex(
  { email: 1 },
  { unique: true }
);


    console.log(
      "✅ Unique email index ready"
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