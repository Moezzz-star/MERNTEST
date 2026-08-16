import bcrypt from "bcryptjs";
import { ObjectId } from "mongodb";

import {
  getCollections,
} from "../config/database.js";

import {
  generateToken,
} from "../utils/jwt.js";

import {
  publicUser,
} from "../utils/publicUser.js";

import {
  validObjectId,
} from "../utils/validators.js";


// ======================================================
// REGISTER
// ======================================================

export async function register(
  req,
  res
) {
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
      return res
        .status(400)
        .json({
          message:
            "Name, email and password are required",
        });
    }

    if (
      name.trim().length < 2
    ) {
      return res
        .status(400)
        .json({
          message:
            "Name must contain at least 2 characters",
        });
    }

    if (
      password.length < 8
    ) {
      return res
        .status(400)
        .json({
          message:
            "Password must contain at least 8 characters",
        });
    }

    if (
      age !== undefined &&
      age !== "" &&
      Number(age) < 1
    ) {
      return res
        .status(400)
        .json({
          message:
            "Age is invalid",
        });
    }

    const {
      users,
    } = getCollections();

    const normalizedEmail =
      email
        .trim()
        .toLowerCase();

    const existingUser =
      await users.findOne({
        email:
          normalizedEmail,
      });

    if (existingUser) {
      return res
        .status(409)
        .json({
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

    const token =
      generateToken(
        createdUser
      );

    return res
      .status(201)
      .json({
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

    if (
      error.code === 11000
    ) {
      return res
        .status(409)
        .json({
          message:
            "Email already exists",
        });
    }

    return res
      .status(500)
      .json({
        message:
          "Registration failed",
      });
  }
}


// ======================================================
// LOGIN
// ======================================================

export async function login(
  req,
  res
) {
  try {
    const {
      email,
      password,
    } = req.body;

    if (
      !email ||
      !password
    ) {
      return res
        .status(400)
        .json({
          message:
            "Email and password are required",
        });
    }

    const {
      users,
    } = getCollections();

    const normalizedEmail =
      email
        .trim()
        .toLowerCase();

    const user =
      await users.findOne({
        email:
          normalizedEmail,
      });

    if (
      !user ||
      !user.password
    ) {
      return res
        .status(401)
        .json({
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
      return res
        .status(401)
        .json({
          message:
            "Invalid email or password",
        });
    }

    const token =
      generateToken(user);

    return res.json({
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

    return res
      .status(500)
      .json({
        message:
          "Login failed",
      });
  }
}


// ======================================================
// CURRENT USER
// ======================================================

export async function getMe(
  req,
  res
) {
  try {
    if (
      !validObjectId(
        req.user.userId
      )
    ) {
      return res
        .status(400)
        .json({
          message:
            "Invalid user ID",
        });
    }

    const {
      users,
    } = getCollections();

    const user =
      await users.findOne({
        _id:
          new ObjectId(
            req.user.userId
          ),
      });

    if (!user) {
      return res
        .status(404)
        .json({
          message:
            "User not found",
        });
    }

    return res.json(
      publicUser(user)
    );
  } catch (error) {
    console.error(
      "GET ME ERROR:",
      error
    );

    return res
      .status(500)
      .json({
        message:
          "Could not load account",
      });
  }
}


// ======================================================
// UPDATE OWN PROFILE
// ======================================================

export async function updateMe(
  req,
  res
) {
  try {
    const {
      name,
      age,
    } = req.body;

    if (!name) {
      return res
        .status(400)
        .json({
          message:
            "Name is required",
        });
    }

    if (
      name.trim().length < 2
    ) {
      return res
        .status(400)
        .json({
          message:
            "Name must contain at least 2 characters",
        });
    }

    if (
      age !== undefined &&
      age !== "" &&
      Number(age) < 1
    ) {
      return res
        .status(400)
        .json({
          message:
            "Age is invalid",
        });
    }

    const {
      users,
    } = getCollections();

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
      return res
        .status(404)
        .json({
          message:
            "User not found",
        });
    }

    const updatedUser =
      await users.findOne({
        _id: id,
      });

    return res.json({
      message:
        "Profile updated",

      user:
        publicUser(
          updatedUser
        ),
    });
  } catch (error) {
    console.error(
      "UPDATE ME ERROR:",
      error
    );

    return res
      .status(500)
      .json({
        message:
          "Could not update profile",
      });
  }
}