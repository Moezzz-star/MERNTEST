import { MongoClient, ServerApiVersion } from "mongodb";

const uri =
  "mongodb+srv://moezzouari:Ecole123@cluster0.tmdvayw.mongodb.net/?appName=Cluster0";

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    await client.connect();

    console.log("✅ Connected to MongoDB Atlas");

    const db = client.db("test_app");
    const users = db.collection("users");

    // CREATE
    const created = await users.insertOne({
      name: "Moez",
      age: 24,
      email: "moez@test.com",
    });

    console.log("✅ Created user:", created.insertedId);

    // READ
    const allUsers = await users.find().toArray();

    console.log("📦 Users in database:");
    console.log(allUsers);

  } catch (error) {
    console.error("❌ Error:");
    console.error(error);
  } finally {
    await client.close();
  }
}

run();