import dotenv from "dotenv";
import path from "path";

// Load the .env manually
dotenv.config({
  path: path.resolve(__dirname, "../../.env"),
});

console.log('Loaded MONGO_URI:', process.env.MONGO_URI); // <-- test

import mongoose, { ClientSession } from "mongoose";
import connectDatabase from "../config/database.config";
import RoleModel from "../models/roles-permission.model";
import { Roles, Permissions } from "../enums/role.enum";



// Define role permissions
const rolePermissions: Record<string, string[]> = {
  [Roles.OWNER]: [
    Permissions.CREATE_WORKSPACE,
    Permissions.DELETE_WORKSPACE,
    Permissions.EDIT_WORKSPACE,
    Permissions.MANAGE_WORKSPACE_SETTINGS,
    Permissions.ADD_MEMBER,
    Permissions.CHANGE_MEMBER_ROLE,
    Permissions.REMOVE_MEMBER,
    Permissions.CREATE_PROJECT,
    Permissions.EDIT_PROJECT,
    Permissions.DELETE_PROJECT,
    Permissions.CREATE_TASK,
    Permissions.EDIT_TASK,
    Permissions.DELETE_TASK,
  ],
  [Roles.ADMIN]: [
    Permissions.EDIT_WORKSPACE,
    Permissions.ADD_MEMBER,
    Permissions.REMOVE_MEMBER,
    Permissions.CREATE_PROJECT,
    Permissions.EDIT_PROJECT,
    Permissions.CREATE_TASK,
    Permissions.EDIT_TASK,
  ],
  [Roles.MEMBER]: [
    Permissions.CREATE_TASK,
    Permissions.EDIT_TASK,
    Permissions.VIEW_ONLY,
  ],
};

const seedRoles = async (): Promise<void> => {
  console.log("Seeding roles started...");

  let session: ClientSession | null = null;

  try {
    // Connect to the database
    await connectDatabase();
    console.log("Connected to database:", mongoose.connection.name);

    // Start a session and transaction
    session = await mongoose.startSession();
    session.startTransaction();
    console.log("Transaction started...");

    // Clear existing roles
    console.log("Clearing existing roles...");
    await RoleModel.deleteMany({}).session(session);
    console.log("Existing roles cleared.");

    // Prepare role documents
    const roleDocs = Object.entries(rolePermissions).map(([name, permissions]) => ({
      name,
      permissions,
    }));

    console.log("Seeding roles:", roleDocs.map((doc) => doc.name));

    // Insert roles
    await RoleModel.insertMany(roleDocs, { session });
    console.log("Roles seeded successfully.");

    // Commit the transaction
    await session.commitTransaction();
    console.log("Transaction committed.");

  } catch (error) {
    console.error("Error during seeding:", error);
    if (session) {
      await session.abortTransaction();
      console.log("Transaction aborted.");
    }
    throw error;
  } finally {
    if (session) {
      session.endSession();
      console.log("Session ended.");
    }
    await mongoose.disconnect();
    console.log("Disconnected from database.");
    process.exit(0);
  }
};

// Run the seed script
seedRoles()
  .then(() => console.log("Seeding completed successfully."))
  .catch((error) => {
    console.error("Error running seed script:", error);
    process.exit(1);
  });
