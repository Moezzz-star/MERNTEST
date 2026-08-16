import dotenv from "dotenv";

dotenv.config();

export const env = {
  PORT: process.env.PORT || 5000,
  MONGO_URI: process.env.MONGO_URI,
  JWT_SECRET: process.env.JWT_SECRET,
  FRONTEND_URL: process.env.FRONTEND_URL,
};

if (!env.MONGO_URI) {
  console.error("❌ MONGO_URI environment variable is missing");
  process.exit(1);
}

if (!env.JWT_SECRET) {
  console.error("❌ JWT_SECRET environment variable is missing");
  process.exit(1);
}