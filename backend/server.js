import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import {
  MongoClient,
  ServerApiVersion,
  ObjectId,
} from "mongodb";

dotenv.config();

const app = express();

const PORT = process.env.PORT || 5000;
const uri = process.env.MONGO_URI;

app.use(cors());
app.use(express.json());

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

let users;


// ============================================
// TEST ROUTE
// ============================================

app.get("/", (req, res) => {
  res.json({
    message: "Backend is working",
  });
});


// ============================================
// GET ALL USERS
// ============================================

app.get("/users", async (req, res) => {
  try {
    const result = await users
      .find()
      .sort({ createdAt: -1 })
      .toArray();

    res.json(result);

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to get users",
    });
  }
});


// ============================================
// CREATE USER
// ============================================

app.post("/users", async (req, res) => {
  try {
    const { name, email, age } = req.body;

    if (!name || !email || age === undefined) {
      return res.status(400).json({
        message: "Name, email and age are required",
      });
    }

    const newUser = {
      name,
      email,
      age: Number(age),
      createdAt: new Date(),
    };

    const result = await users.insertOne(newUser);

    const createdUser = await users.findOne({
      _id: result.insertedId,
    });

    res.status(201).json(createdUser);

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to create user",
    });
  }
});


// ============================================
// UPDATE USER
// ============================================

app.put("/users/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const { name, email, age } = req.body;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Invalid user ID",
      });
    }

    const result = await users.updateOne(
      {
        _id: new ObjectId(id),
      },
      {
        $set: {
          name,
          email,
          age: Number(age),
          updatedAt: new Date(),
        },
      }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const updatedUser = await users.findOne({
      _id: new ObjectId(id),
    });

    res.json(updatedUser);

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to update user",
    });
  }
});


// ============================================
// DELETE USER
// ============================================

app.delete("/users/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Invalid user ID",
      });
    }

    const result = await users.deleteOne({
      _id: new ObjectId(id),
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    res.json({
      message: "User deleted successfully",
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to delete user",
    });
  }
});


// ============================================
// START DATABASE + SERVER
// ============================================

async function startServer() {
  try {
    await client.connect();

    await client.db("admin").command({
      ping: 1,
    });

    console.log("✅ MongoDB Atlas connected");

    const db = client.db("test_app");

    users = db.collection("users");

    app.listen(PORT, () => {
      console.log(
        `🚀 Server running on http://localhost:${PORT}`
      );
    });

  } catch (error) {
    console.error(
      "❌ Failed to connect to MongoDB:",
      error
    );
  }
}

startServer();