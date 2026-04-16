/**
 * scripts/fix-pan-index.ts
 *
 * One-off migration: drops the existing (non-sparse) compound unique index
 * on clients(agencyId, panNumber) and lets Mongoose recreate it as sparse.
 *
 * Run once:
 *   npx ts-node -r tsconfig-paths/register scripts/fix-pan-index.ts
 */

import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI not set in .env.local");

  await mongoose.connect(uri);
  const db = mongoose.connection.db!;

  try {
    await db.collection("clients").dropIndex("agencyId_1_panNumber_1");
    console.log("✅  Dropped agencyId_1_panNumber_1 index");
  } catch (e: any) {
    if (e.codeName === "IndexNotFound") {
      console.log("ℹ️  Index not found — already dropped or never existed");
    } else {
      throw e;
    }
  }

  // Import the model so Mongoose syncs the sparse index
  await import("../src/models/Client");
  await mongoose.syncIndexes();
  console.log("✅  Indexes synced — sparse index recreated");

  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
