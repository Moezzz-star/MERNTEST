import {
  MongoClient,
  ServerApiVersion,
} from "mongodb";

import { env } from "./env.js";

const client = new MongoClient(
  env.MONGO_URI,
  {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    },
  }
);

let db = null;

export async function connectDatabase() {
  await client.connect();

  await client
    .db("admin")
    .command({
      ping: 1,
    });

  db = client.db("test_app");

  console.log(
    "✅ MongoDB Atlas connected"
  );

  await createIndexes();
}

export function getCollections() {
  if (!db) {
    throw new Error(
      "Database has not been initialized"
    );
  }

  return {
    users:
      db.collection("users"),

    events:
      db.collection("events"),

    sessions:
      db.collection("sessions"),

    bookings:
      db.collection("bookings"),
  };
}

async function createIndexes() {
  const {
    users,
    sessions,
    bookings,
  } = getCollections();

  // Unique account email
  await users.createIndex(
    {
      email: 1,
    },
    {
      unique: true,
    }
  );

  // Faster event-session lookups
  await sessions.createIndex({
    eventId: 1,
    startAt: 1,
  });

  // Same user cannot book same session twice
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
}