import mongoose from "mongoose";
import config from "../config";
// import { User, UserRole, UserStatus, RegistrationStatus } from "../app/models";
// import bcrypt from "bcrypt";

async function connectMongoDB() {
  try {
    await mongoose.connect(config.database_url as string, {
      serverSelectionTimeoutMS: 30000, // Increased timeout
      heartbeatFrequencyMS: 2000,
      retryWrites: true,
      ssl: true,
      tlsAllowInvalidCertificates: true,
    });
    console.log("MongoDB connected successfully!");
    // await initiateSuperAdmin();
  } catch (error) {
    console.error("MongoDB connection error:", error);
    console.log("Attempting to reconnect in 5 seconds...");
    // Instead of exiting, retry connection after delay
    setTimeout(() => {
      connectMongoDB();
    }, 5000);
  }
}

mongoose.connection.on("connected", () => {
  console.log("Mongoose connected to MongoDB");
});

mongoose.connection.on("error", (err) => {
  console.error("Mongoose connection error:", err);
});

mongoose.connection.on("disconnected", () => {
  console.log("Mongoose disconnected from MongoDB");
});

// async function initiateSuperAdmin() {
//   const adminEmail = "info@brikky.net";

//   const existingAdmin = await User.findOne({ email: adminEmail });
//   if (existingAdmin) return;

//   const hashedPassword = await bcrypt.hash(
//     "12345678",
//     Number(config.bcrypt_salt_rounds)
//   );

//   await User.create({
//     email: adminEmail,
//     password: hashedPassword,
//     affiliationCondition: true,
//     role: UserRole.ADMIN,
//     status: UserStatus.ACTIVE,
//     registrationStatus: RegistrationStatus.COMPLETED,
//     isEmailVerified: true,
//   });

//   console.log("Super Admin created successfully");
// }

connectMongoDB();

export { connectMongoDB };
