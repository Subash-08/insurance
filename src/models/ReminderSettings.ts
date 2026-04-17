import mongoose, { Schema } from "mongoose";

const ReminderSettingsSchema = new Schema({
  renewalDays: { type: [Number], default: [60, 30, 15, 7] },
  premiumDueDays: { type: [Number], default: [7, 3, 1] },
  premiumOverdueDays: { type: [Number], default: [3, 7, 15] },
  maturityAlertDays: { type: [Number], default: [90, 30, 7] },
  sendBirthdayGreeting: { type: Boolean, default: true },
  sendAnniversaryGreeting: { type: Boolean, default: true },
  sendLapseWarning: { type: Boolean, default: true },
  lapseWarningAfterDays: { type: Number, default: 7 },
  activeHoursStart: { type: Number, default: 9 },
  activeHoursEnd: { type: Number, default: 18 },
  workingDays: { type: [Number], default: [1, 2, 3, 4, 5, 6] },
  emailOptOutRespected: { type: Boolean, default: true },
  smsOptOutRespected: { type: Boolean, default: true },
  n8nWebhookUrl: { type: String },
  n8nSecretConfigured: { type: Boolean, default: false },
  // Revenue target in PAISE (₹1 = 100 paise). Default 0 = no target set.
  monthlyRevenueTarget: { type: Number, default: 0 },
}, { timestamps: true });

export default mongoose.models.ReminderSettings ||
  mongoose.model("ReminderSettings", ReminderSettingsSchema);
