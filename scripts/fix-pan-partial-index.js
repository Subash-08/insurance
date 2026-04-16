const mongoose = require("mongoose");
const path = require("path");
const fs = require("fs");

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

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Connected");
  const db = mongoose.connection.db;
  const col = db.collection("clients");

  try {
    await col.dropIndex("agencyId_1_panNumber_1");
    console.log("Dropped old agencyId_1_panNumber_1 index");
  } catch (e) {
    console.log("Index not found or already dropped");
  }

  await col.createIndex(
    { agencyId: 1, panNumber: 1 },
    { unique: true, partialFilterExpression: { panNumber: { $type: "string" } }, name: "agencyId_1_panNumber_1" }
  );
  console.log("Recreated agencyId_1_panNumber_1 with partialFilterExpression!");

  await mongoose.disconnect();
}
main().catch(console.error);
