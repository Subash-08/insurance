import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import mongoose from "mongoose";

// Use a raw schema mapped to the collection directly so Mongoose model validation doesn't interfere
const RawLeadSchema = new mongoose.Schema({}, { strict: false });
const RawLead = mongoose.models.RawLead || mongoose.model("RawLead", RawLeadSchema, "leads");

async function main() {
  console.log("Connecting to MongoDB...");
  await mongoose.connect(process.env.MONGODB_URI as string);
  console.log("Connected.");

  try {
    const totalCount = await RawLead.countDocuments();
    console.log(`Found ${totalCount} existing leads. Starting migration...`);

    if (totalCount === 0) {
      console.log("No leads to migrate. Exiting.");
      process.exit(0);
    }

    const BATCH_SIZE = 100;
    let processed = 0;
    let failed = 0;
    let updated = 0;

    for (let skip = 0; skip < totalCount; skip += BATCH_SIZE) {
      const batch = await RawLead.find({}).skip(skip).limit(BATCH_SIZE);
      
      const bulkOps = [];
      
      for (const lead of batch) {
        let needsUpdate = false;
        const set: Record<string, any> = {};
        const unset: Record<string, any> = {};

        // 1. name -> fullName
        if (lead.toObject().name) {
          set.fullName = lead.toObject().name;
          unset.name = "";
          needsUpdate = true;
        }

        // 2. mobile -> phone
        if (lead.toObject().mobile) {
          // normalize phone
          set.phone = lead.toObject().mobile.replace(/\D/g, "");
          unset.mobile = "";
          needsUpdate = true;
        }

        // 3. assignedTo -> agentId
        if (lead.toObject().assignedTo) {
          set.agentId = lead.toObject().assignedTo;
          unset.assignedTo = "";
          needsUpdate = true;
        }

        if (needsUpdate) {
          bulkOps.push({
            updateOne: {
              filter: { _id: lead._id },
              update: { $set: set, $unset: unset },
            },
          });
        }
      }

      if (bulkOps.length > 0) {
        try {
          const result = await RawLead.collection.bulkWrite(bulkOps);
          updated += result.modifiedCount || 0;
        } catch (error) {
          console.error(`Batch failed at skip ${skip}:`, error);
          failed += bulkOps.length;
        }
      }

      processed += batch.length;
      console.log(`Processed ${processed}/${totalCount}...`);
    }

    const newTotal = await RawLead.countDocuments({
      $or: [
        { name: { $exists: true } },
        { mobile: { $exists: true } },
        { assignedTo: { $exists: true } },
      ],
    });

    console.log(`Migration Complete. Updated ${updated} documents. Failed: ${failed}.`);
    
    if (newTotal > 0) {
      console.warn(`WARNING: ${newTotal} documents still have old fields!`);
    } else {
      console.log("SUCCESS: All leads migrated successfully.");
    }

  } catch (error) {
    console.error("Migration fatal error:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected.");
  }
}

main();
