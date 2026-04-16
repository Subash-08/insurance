/**
 * scripts/fix-pan-index.js
 *
 * One-off migration: drops the non-sparse compound unique index on
 * clients(agencyId, panNumber) and recreates it as sparse via Mongoose.
 *
 * Run once (dev server can stay up):
 *   node scripts/fix-pan-index.js
 */

const mongoose = require("mongoose");
const path = require("path");
const fs = require("fs");

// Load .env.local manually
const envFile = path.join(__dirname, "..", ".env.local");
if (fs.existsSync(envFile)) {
  const lines = fs.readFileSync(envFile, "utf8").split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx).trim();
    const val = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, "");
    if (!process.env[key]) process.env[key] = val;
  }
}

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error("❌  MONGODB_URI not set in .env.local");
  process.exit(1);
}

async function main() {
  await mongoose.connect(uri);
  const db = mongoose.connection.db;
  const col = db.collection("clients");

  // Drop the old (non-sparse or stale) index
  try {
    await col.dropIndex("agencyId_1_panNumber_1");
    console.log("✅  Dropped agencyId_1_panNumber_1 index");
  } catch (e) {
    if (e.codeName === "IndexNotFound") {
      console.log("ℹ️   Index not found — already dropped or never existed");
    } else {
      throw e;
    }
  }

  // Recreate as sparse unique
  await col.createIndex(
    { agencyId: 1, panNumber: 1 },
    { unique: true, sparse: true, name: "agencyId_1_panNumber_1" }
  );
  console.log("✅  Recreated agencyId_1_panNumber_1 as sparse unique index");

  await mongoose.disconnect();
  console.log("✅  Done");
}

main().catch((e) => {
  console.error("❌ ", e.message);
  process.exit(1);
});
