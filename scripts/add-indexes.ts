import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import mongoose from "mongoose";

// Models
import User from "@/models/User";
import Client from "@/models/Client";
import Policy from "@/models/Policy";
import Premium from "@/models/Premium";
import Claim from "@/models/Claim";
import Lead from "@/models/Lead";
import CommissionLog from "@/models/CommissionLog";
import Notification from "@/models/Notification";

async function main() {
  console.log("Connecting to MongoDB...");
  await mongoose.connect(process.env.MONGODB_URI as string);
  console.log("Connected.");

  try {
    console.log("Creating Client indexes...");
    await Client.collection.createIndex(
      { phone: 1, agencyId: 1 },
      { unique: true, partialFilterExpression: { phone: { $type: "string" } } }
    );
    await Client.collection.createIndex({ agencyId: 1, agentId: 1 });

    console.log("Creating Lead indexes...");
    await Lead.collection.createIndex(
      { phone: 1, agencyId: 1 },
      { unique: true, partialFilterExpression: { phone: { $type: "string" } } }
    );
    await Lead.collection.createIndex({ agencyId: 1, agentId: 1 });
    await Lead.collection.createIndex({ isActive: 1 });

    console.log("Creating Policy indexes...");
    await Policy.collection.createIndex({ agencyId: 1, agentId: 1 });

    console.log("Creating Premium indexes...");
    await Premium.collection.createIndex({ agencyId: 1, agentId: 1 });

    console.log("Creating Claim indexes...");
    await Claim.collection.createIndex({ agencyId: 1, agentId: 1 });

    console.log("Creating CommissionLog indexes...");
    // CommissionLog schema doesn't currently mandate agencyId field in schema, but typical pattern includes agentId
    await CommissionLog.collection.createIndex({ agentId: 1, month: 1 });
    await CommissionLog.collection.createIndex({ paymentHistoryId: 1 }, { unique: true });

    console.log("Creating Notification indexes...");
    // TTL index for auto-expiration in 180 days
    await Notification.collection.createIndex({ createdAt: 1 }, { expireAfterSeconds: 180 * 24 * 60 * 60 });
    await Notification.collection.createIndex({ userId: 1, isRead: 1, createdAt: -1 });

    console.log("All indexes applied successfully!");
  } catch (error) {
    console.error("Error creating indexes:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected.");
  }
}

main();
