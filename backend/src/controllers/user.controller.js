import bcrypt from "bcryptjs";
import { ObjectId } from "mongodb";

import {
  getCollections,
} from "../config/database.js";

import {
  publicUser,
} from "../utils/publicUser.js";

import {
  validObjectId,
} from "../utils/validators.js";


// ======================================================
// GET ALL USERS
// Admin only
// ======================================================

export async function getUsers(
  req,
  res
) {
  try {
    const {
      users,
    } = getCollections();

    const result =
      await users
        .find({})
        .sort({
          createdAt: -1,
        })
        .toArray();

    return res.json(
      result.map(
        publicUser
      )
    );

  } catch (error) {
    console.error(
      "GET USERS ERROR:",
      error
    );

    return res
      .status(500)
      .json({
        message:
          "Could not load users",
      });
  }
}


// ======================================================
// CREATE USER
// Admin only
// ======================================================

export async function createUser(
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


    // --------------------------------------------------
    // Validation
    // --------------------------------------------------

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


    // --------------------------------------------------
    // Check duplicate email
    // --------------------------------------------------

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
            "Email already exists",
        });
    }


    // --------------------------------------------------
    // Hash password
    // --------------------------------------------------

    const hashedPassword =
      await bcrypt.hash(
        password,
        10
      );


    // --------------------------------------------------
    // Create user
    // --------------------------------------------------

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

      // Admin-created users are normal users
      // by default.
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


    return res
      .status(201)
      .json({
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
          "Could not create user",
      });
  }
}


// ======================================================
// UPDATE USER
// Admin only
// ======================================================

export async function updateUser(
  req,
  res
) {
  try {
    const {
      id,
    } = req.params;


    const {
      name,
      email,
      age,
    } = req.body;


    // --------------------------------------------------
    // Validate ID
    // --------------------------------------------------

    if (
      !validObjectId(id)
    ) {
      return res
        .status(400)
        .json({
          message:
            "Invalid user ID",
        });
    }


    // --------------------------------------------------
    // Validate fields
    // --------------------------------------------------

    if (
      !name ||
      !email
    ) {
      return res
        .status(400)
        .json({
          message:
            "Name and email are required",
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


    const userId =
      new ObjectId(id);


    const normalizedEmail =
      email
        .trim()
        .toLowerCase();


    // --------------------------------------------------
    // Make sure another user does not already
    // use the same email
    // --------------------------------------------------

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
      return res
        .status(409)
        .json({
          message:
            "Email already used by another user",
        });
    }


    // --------------------------------------------------
    // Update user
    // --------------------------------------------------

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
      return res
        .status(404)
        .json({
          message:
            "User not found",
        });
    }


    const updatedUser =
      await users.findOne({
        _id:
          userId,
      });


    return res.json({
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
          "Could not update user",
      });
  }
}


// ======================================================
// DELETE USER
// Admin only
// ======================================================

export async function deleteUser(
  req,
  res
) {
  try {
    const {
      id,
    } = req.params;


    // --------------------------------------------------
    // Validate ID
    // --------------------------------------------------

    if (
      !validObjectId(id)
    ) {
      return res
        .status(400)
        .json({
          message:
            "Invalid user ID",
        });
    }


    // --------------------------------------------------
    // Admin cannot delete own account
    // --------------------------------------------------

    if (
      id ===
      req.user.userId
    ) {
      return res
        .status(400)
        .json({
          message:
            "You cannot delete your own account",
        });
    }


    const {
      users,
      bookings,
    } = getCollections();


    const userId =
      new ObjectId(id);


    // --------------------------------------------------
    // Prevent deleting a user who still has bookings
    // --------------------------------------------------

    const userBookings =
      await bookings.countDocuments({
        userId,
      });


    if (
      userBookings > 0
    ) {
      return res
        .status(409)
        .json({
          message:
            "This user has bookings. Delete or cancel them first.",
        });
    }


    // --------------------------------------------------
    // Delete user
    // --------------------------------------------------

    const result =
      await users.deleteOne({
        _id:
          userId,
      });


    if (
      result.deletedCount === 0
    ) {
      return res
        .status(404)
        .json({
          message:
            "User not found",
        });
    }


    return res.json({
      message:
        "User deleted successfully",
    });

  } catch (error) {
    console.error(
      "DELETE USER ERROR:",
      error
    );


    return res
      .status(500)
      .json({
        message:
          "Could not delete user",
      });
  }
}