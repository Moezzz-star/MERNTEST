import jwt from "jsonwebtoken";

import { env } from "../config/env.js";

export function generateToken(user) {
  return jwt.sign(
    {
      userId:
        user._id.toString(),

      role:
        user.role || "user",
    },

    env.JWT_SECRET,

    {
      expiresIn: "7d",
    }
  );
}