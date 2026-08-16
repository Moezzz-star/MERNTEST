import jwt from "jsonwebtoken";

import { env } from "../config/env.js";

export function requireAuth(
  req,
  res,
  next
) {
  try {
    const authorization =
      req.headers.authorization;

    if (
      !authorization ||
      !authorization.startsWith(
        "Bearer "
      )
    ) {
      return res
        .status(401)
        .json({
          message:
            "Authentication required",
        });
    }

    const token =
      authorization.split(" ")[1];

    const decoded =
      jwt.verify(
        token,
        env.JWT_SECRET
      );

    req.user = decoded;

    next();
  } catch {
    return res
      .status(401)
      .json({
        message:
          "Invalid or expired token",
      });
  }
}