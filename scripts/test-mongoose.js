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
  
  const indexes = await db.collection("clients").indexes();
  console.log("Indexes on clients:", JSON.stringify(indexes.map(i => ({name: i.name, sparse: i.sparse})), null, 2));

  const coll = db.collection("clients");
  const nullPanCount = await coll.countDocuments({ agencyId: new mongoose.Types.ObjectId('69e0acd1b87c2cfb6b857014'), panNumber: null });
  console.log("Existing documents with panNumber: null =", nullPanCount);
  
  const undefinedPanCount = await coll.countDocuments({ agencyId: new mongoose.Types.ObjectId('69e0acd1b87c2cfb6b857014'), panNumber: { $exists: false } });
  console.log("Existing documents with panNumber missing =", undefinedPanCount);

  await mongoose.disconnect();
}
main().catch(console.error);
