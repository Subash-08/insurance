/**
 * Seed script: 8 Indian insurers with 2–3 plans each
 * Usage: node -r ts-node/register scripts/seed-insurers.ts
 * Or use: npx tsx scripts/seed-insurers.ts
 */
import mongoose from "mongoose";
import * as fs from "fs";
import * as path from "path";

// Load env
const envPath = path.resolve(process.cwd(), ".env.local");
const envContent = fs.readFileSync(envPath, "utf-8");
const envLines = envContent.split(/\r?\n/);
for (const line of envLines) {
  const [key, ...rest] = line.split("=");
  if (key && rest.length) process.env[key.trim()] = rest.join("=").trim();
}

const MONGODB_URI = process.env.MONGODB_URI!;
if (!MONGODB_URI) {
  console.error("MONGODB_URI not found in .env.local");
  process.exit(1);
}

const INSURERS = [
  {
    name: "LIC of India",
    type: "life",
    claimHelpline: "022-68276827",
    website: "https://licindia.in",
    email: "support@licindia.in",
    phone: "022-68276827",
    plans: [
      { planName: "Jeevan Anand", planCode: "815", isActive: true },
      { planName: "Tech Term", planCode: "854", isActive: true },
      { planName: "Jeevan Umang", planCode: "845", isActive: true },
    ],
  },
  {
    name: "HDFC Life",
    type: "life",
    claimHelpline: "1860-267-9999",
    website: "https://hdfclife.com",
    email: "support@hdfclife.com",
    phone: "1860-267-9999",
    plans: [
      { planName: "Click 2 Protect Life", planCode: "C2PL", isActive: true },
      { planName: "Sanchay Plus", planCode: "SPLY", isActive: true },
      { planName: "ProGrowth Plus", planCode: "PGP", isActive: true },
    ],
  },
  {
    name: "ICICI Prudential Life",
    type: "life",
    claimHelpline: "1860-266-7766",
    website: "https://iciciprulife.com",
    email: "lifeline@iciciprulife.com",
    phone: "1860-266-7766",
    plans: [
      { planName: "iProtect Smart", planCode: "IPS", isActive: true },
      { planName: "ICICI Pru Signature", planCode: "SIGN", isActive: true },
    ],
  },
  {
    name: "SBI Life",
    type: "life",
    claimHelpline: "1800-267-9090",
    website: "https://sbilife.co.in",
    email: "info@sbilife.co.in",
    phone: "1800-267-9090",
    plans: [
      { planName: "eShield Next", planCode: "ESN", isActive: true },
      { planName: "Smart Privilege", planCode: "SP", isActive: true },
    ],
  },
  {
    name: "Max Life Insurance",
    type: "life",
    claimHelpline: "1860-120-5577",
    website: "https://maxlifeinsurance.com",
    email: "service@maxlifeinsurance.com",
    phone: "1860-120-5577",
    plans: [
      { planName: "Smart Secure Plus", planCode: "SSP", isActive: true },
      { planName: "Fast Track Super", planCode: "FTS", isActive: true },
    ],
  },
  {
    name: "Star Health Insurance",
    type: "health",
    claimHelpline: "1800-425-2255",
    website: "https://starhealth.in",
    email: "support@starhealth.in",
    phone: "1800-425-2255",
    plans: [
      { planName: "Comprehensive Health Plan", planCode: "CHP", isActive: true },
      { planName: "Family Health Optima", planCode: "FHO", isActive: true },
      { planName: "Senior Citizens Red Carpet", planCode: "SCRC", isActive: true },
    ],
  },
  {
    name: "New India Assurance",
    type: "general",
    claimHelpline: "1800-209-1415",
    website: "https://newindia.co.in",
    email: "ho@newindia.co.in",
    phone: "1800-209-1415",
    plans: [
      { planName: "Mediclaim Policy", planCode: "NIA-MED", isActive: true },
      { planName: "Vehicle Package Policy", planCode: "NIA-VEH", isActive: true },
    ],
  },
  {
    name: "Bajaj Allianz General",
    type: "general",
    claimHelpline: "1800-209-0144",
    website: "https://bajajallianz.com",
    email: "bagichelp@bajajallianz.co.in",
    phone: "1800-209-0144",
    plans: [
      { planName: "Health Guard", planCode: "BAG-HG", isActive: true },
      { planName: "Car Insurance Comprehensive", planCode: "BAG-CAR", isActive: true },
      { planName: "Trip Insurance", planCode: "BAG-TRIP", isActive: true },
    ],
  },
];

async function seed() {
  await mongoose.connect(MONGODB_URI);
  console.log("Connected to MongoDB");

  const InsurerSchema = new mongoose.Schema(
    {
      name: { type: String, required: true, unique: true },
      type: { type: String, enum: ["life", "general", "health", "composite"] },
      claimHelpline: String,
      website: String,
      email: String,
      phone: String,
      plans: [
        {
          planName: String,
          planCode: String,
          isActive: { type: Boolean, default: true },
        },
      ],
      isActive: { type: Boolean, default: true },
      createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    },
    { timestamps: true }
  );

  const Insurer =
    mongoose.models.Insurer || mongoose.model("Insurer", InsurerSchema);

  // Find the owner to set createdBy
  const UserSchema = new mongoose.Schema({
    name: String,
    email: String,
    role: String,
    status: String,
  });
  const User = mongoose.models.User || mongoose.model("User", UserSchema);
  const owner = await User.findOne({ role: "owner", status: "active" }).lean() as any;

  let created = 0;
  let skipped = 0;

  for (const data of INSURERS) {
    const existing = await Insurer.findOne({
      name: { $regex: `^${data.name}$`, $options: "i" },
    });
    if (existing) {
      console.log(`⏭ Skipped (already exists): ${data.name}`);
      skipped++;
      continue;
    }
    await Insurer.create({ ...data, createdBy: owner?._id });
    console.log(`✅ Created: ${data.name} (${data.plans.length} plans)`);
    created++;
  }

  console.log(`\nSeed complete: ${created} created, ${skipped} skipped`);
  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
