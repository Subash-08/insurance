/**
 * Seed 10 system email templates (isSystem: true)
 * Run: npm run seed:templates
 */
import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const MONGODB_URI = process.env.MONGODB_URI!;
if (!MONGODB_URI) throw new Error("MONGODB_URI not set in .env.local");

const VersionHistorySchema = new mongoose.Schema({ version: Number, bodyHtml: String, subject: String, savedAt: Date }, { _id: false });
const EmailTemplateSchema = new mongoose.Schema({
  name: String, slug: { type: String, unique: true }, type: String, channel: { type: String, default: "email" },
  subject: String, bodyHtml: String, bodyText: String, variables: [String],
  isSystem: { type: Boolean, default: false }, isActive: { type: Boolean, default: true },
  versionHistory: [VersionHistorySchema],
}, { timestamps: true });

const EmailTemplate = mongoose.models.EmailTemplate || mongoose.model("EmailTemplate", EmailTemplateSchema);

const brand = "#1D4ED8";

function htmlWrap(body: string): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:Arial,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:24px">
<table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0">
  <tr><td style="background:${brand};padding:20px 24px"><h1 style="color:#ffffff;margin:0;font-size:20px">InsureFlow</h1></td></tr>
  <tr><td style="padding:28px 24px">${body}</td></tr>
  <tr><td style="background:#f1f5f9;padding:16px 24px;text-align:center;font-size:12px;color:#64748b">
    This is an automated message from InsureFlow. Please do not reply to this email.
  </td></tr>
</table></td></tr></table></body></html>`;
}

const TEMPLATES = [
  {
    slug: "renewal-notice",
    name: "Policy Renewal Notice",
    type: "renewal",
    subject: "Your insurance policy {{policyNumber}} is due for renewal",
    variables: ["clientName", "policyNumber", "insurer", "renewalDate", "premiumAmount", "agentName", "agentPhone"],
    bodyHtml: htmlWrap(`
      <p style="color:#334155;font-size:15px">Dear {{clientName}},</p>
      <p style="color:#475569">Your insurance policy <strong>{{policyNumber}}</strong> with <strong>{{insurer}}</strong> is due for renewal on <strong style="color:${brand}">{{renewalDate}}</strong>.</p>
      <div style="background:#eff6ff;border-left:4px solid ${brand};padding:16px;border-radius:8px;margin:20px 0">
        <p style="margin:0;color:#1e40af;font-size:14px">Premium Amount: <strong>{{premiumAmount}}</strong></p>
      </div>
      <p style="color:#475569">Please renew your policy before the due date to avoid any lapse in coverage. Contact your agent for assistance.</p>
      <div style="margin:24px 0;padding:16px;background:#f8fafc;border-radius:8px">
        <p style="margin:0;font-size:13px;color:#64748b">Your Agent: <strong>{{agentName}}</strong> | <strong>{{agentPhone}}</strong></p>
      </div>`),
  },
  {
    slug: "premium-due",
    name: "Premium Due Reminder",
    type: "premium_due",
    subject: "Premium payment reminder — {{policyNumber}}",
    variables: ["clientName", "policyNumber", "premiumAmount", "dueDate", "insurer", "agentName", "agentPhone"],
    bodyHtml: htmlWrap(`
      <p style="color:#334155;font-size:15px">Dear {{clientName}},</p>
      <p style="color:#475569">This is a friendly reminder that your premium payment for policy <strong>{{policyNumber}}</strong> is due on <strong style="color:${brand}">{{dueDate}}</strong>.</p>
      <div style="background:#eff6ff;border-left:4px solid ${brand};padding:16px;border-radius:8px;margin:20px 0">
        <p style="margin:0;color:#1e40af"><strong>Amount Due: {{premiumAmount}}</strong></p>
      </div>
      <p style="color:#475569">Please ensure payment is made on time to keep your policy active.</p>
      <p style="font-size:13px;color:#64748b">Questions? Contact {{agentName}} at {{agentPhone}}</p>`),
  },
  {
    slug: "premium-overdue",
    name: "Premium Overdue Alert",
    type: "premium_overdue",
    subject: "URGENT: Premium overdue for {{policyNumber}}",
    variables: ["clientName", "policyNumber", "premiumAmount", "dueDate", "daysOverdue", "agentName", "agentPhone"],
    bodyHtml: htmlWrap(`
      <div style="background:#fef2f2;border-left:4px solid #dc2626;padding:16px;border-radius:8px;margin-bottom:20px">
        <p style="margin:0;color:#dc2626;font-weight:bold">⚠️ URGENT: Your premium is overdue by {{daysOverdue}} days</p>
      </div>
      <p style="color:#334155;font-size:15px">Dear {{clientName}},</p>
      <p style="color:#475569">The premium for policy <strong>{{policyNumber}}</strong> (Amount: <strong>{{premiumAmount}}</strong>) was due on <strong>{{dueDate}}</strong>.</p>
      <p style="color:#dc2626;font-weight:bold">Your policy is at risk of lapsing. Please pay immediately to maintain coverage.</p>
      <p style="font-size:13px;color:#64748b">Contact your agent NOW: {{agentName}} — {{agentPhone}}</p>`),
  },
  {
    slug: "lapse-warning",
    name: "Policy Lapse Warning",
    type: "lapse_warning",
    subject: "Your policy {{policyNumber}} is at risk of lapsing",
    variables: ["clientName", "policyNumber", "insurer", "agentName", "agentPhone"],
    bodyHtml: htmlWrap(`
      <div style="background:#fffbeb;border-left:4px solid #f59e0b;padding:16px;border-radius:8px;margin-bottom:20px">
        <p style="margin:0;color:#92400e;font-weight:bold">⚠️ Lapse Warning</p>
      </div>
      <p style="color:#334155;font-size:15px">Dear {{clientName}},</p>
      <p style="color:#475569">Your policy <strong>{{policyNumber}}</strong> with <strong>{{insurer}}</strong> is at risk of lapsing due to non-payment of premium.</p>
      <p style="color:#475569">A lapsed policy means you will lose all insurance coverage and benefits. Please contact your agent immediately.</p>
      <p style="font-size:13px;color:#64748b">{{agentName}} — {{agentPhone}}</p>`),
  },
  {
    slug: "birthday-greeting",
    name: "Birthday Greeting",
    type: "birthday",
    subject: "Happy Birthday, {{clientName}}! 🎂",
    variables: ["clientName", "agentName", "agencyName"],
    bodyHtml: htmlWrap(`
      <div style="text-align:center;padding:20px 0">
        <div style="font-size:48px">🎂</div>
        <h2 style="color:${brand}">Happy Birthday, {{clientName}}!</h2>
      </div>
      <p style="color:#475569;text-align:center">Wishing you a wonderful birthday filled with joy and happiness.</p>
      <p style="color:#475569;text-align:center">Thank you for trusting {{agencyName}} with your insurance needs.</p>
      <p style="text-align:center;font-size:13px;color:#64748b">With warm wishes,<br><strong>{{agentName}}</strong><br>{{agencyName}}</p>`),
  },
  {
    slug: "policy-anniversary",
    name: "Policy Anniversary",
    type: "anniversary",
    subject: "{{policyNumber}} — Policy Anniversary",
    variables: ["clientName", "policyNumber", "insurer", "agentName", "agencyName"],
    bodyHtml: htmlWrap(`
      <div style="text-align:center;padding:20px 0">
        <div style="font-size:40px">🎉</div>
        <h2 style="color:${brand}">Policy Anniversary!</h2>
      </div>
      <p style="color:#334155;font-size:15px">Dear {{clientName}},</p>
      <p style="color:#475569">On this anniversary of your policy <strong>{{policyNumber}}</strong> with {{insurer}}, we thank you for your continued trust.</p>
      <p style="color:#475569">Your coverage continues to protect what matters most to you.</p>
      <p style="font-size:13px;color:#64748b">{{agentName}} — {{agencyName}}</p>`),
  },
  {
    slug: "maturity-alert",
    name: "Policy Maturity Alert",
    type: "maturity",
    subject: "Your policy {{policyNumber}} matures on {{maturityDate}}",
    variables: ["clientName", "policyNumber", "insurer", "maturityDate", "sumAssured", "agentName", "agentPhone"],
    bodyHtml: htmlWrap(`
      <p style="color:#334155;font-size:15px">Dear {{clientName}},</p>
      <p style="color:#475569">Your policy <strong>{{policyNumber}}</strong> with <strong>{{insurer}}</strong> is maturing on <strong style="color:${brand}">{{maturityDate}}</strong>.</p>
      <div style="background:#f0fdf4;border-left:4px solid #22c55e;padding:16px;border-radius:8px;margin:20px 0">
        <p style="margin:0;color:#15803d">Maturity Amount: <strong>{{sumAssured}}</strong></p>
      </div>
      <p style="color:#475569">Please contact your agent to discuss maturity claim procedures and reinvestment options.</p>
      <p style="font-size:13px;color:#64748b">{{agentName}} — {{agentPhone}}</p>`),
  },
  {
    slug: "welcome-client",
    name: "Welcome New Client",
    type: "welcome",
    subject: "Welcome to {{agencyName}} — Your policy details",
    variables: ["clientName", "policyNumber", "insurer", "agencyName", "agentName", "agentPhone", "agentEmail"],
    bodyHtml: htmlWrap(`
      <p style="color:#334155;font-size:15px">Dear {{clientName}},</p>
      <p style="color:#475569">Welcome to <strong>{{agencyName}}</strong>! We are delighted to have you as our client.</p>
      <div style="background:#eff6ff;border-radius:8px;padding:16px;margin:20px 0">
        <p style="margin:0;color:#1e40af"><strong>Policy Number:</strong> {{policyNumber}}</p>
        <p style="margin:8px 0 0;color:#1e40af"><strong>Insurer:</strong> {{insurer}}</p>
      </div>
      <p style="color:#475569">Your dedicated agent is always here to help you with any queries.</p>
      <div style="background:#f8fafc;border-radius:8px;padding:16px">
        <p style="margin:0;font-size:13px;color:#64748b"><strong>{{agentName}}</strong><br>📞 {{agentPhone}}<br>✉️ {{agentEmail}}</p>
      </div>`),
  },
  {
    slug: "claim-acknowledgement",
    name: "Claim Acknowledgement",
    type: "claim_ack",
    subject: "Claim {{claimNumber}} received — we're on it",
    variables: ["clientName", "claimNumber", "claimType", "policyNumber", "agentName", "agentPhone"],
    bodyHtml: htmlWrap(`
      <div style="text-align:center;margin-bottom:20px">
        <div style="display:inline-block;background:#eff6ff;color:${brand};padding:8px 20px;border-radius:999px;font-weight:bold;font-size:18px">{{claimNumber}}</div>
      </div>
      <p style="color:#334155;font-size:15px">Dear {{clientName}},</p>
      <p style="color:#475569">We have received your <strong>{{claimType}}</strong> claim for policy <strong>{{policyNumber}}</strong> and are processing it.</p>
      <p style="color:#475569">Your agent will keep you updated on the progress. Expected timelines vary by claim type.</p>
      <p style="font-size:13px;color:#64748b">For queries: {{agentName}} — {{agentPhone}}</p>`),
  },
  {
    slug: "payment-confirmation",
    name: "Payment Confirmation",
    type: "payment_confirmation",
    subject: "Payment received for {{policyNumber}} — {{premiumAmount}}",
    variables: ["clientName", "policyNumber", "premiumAmount", "agentName"],
    bodyHtml: htmlWrap(`
      <div style="text-align:center;margin-bottom:20px">
        <div style="font-size:40px">✅</div>
        <h2 style="color:#16a34a">Payment Received!</h2>
      </div>
      <p style="color:#334155;font-size:15px">Dear {{clientName}},</p>
      <p style="color:#475569">We have successfully received your premium payment of <strong style="color:#16a34a">{{premiumAmount}}</strong> for policy <strong>{{policyNumber}}</strong>.</p>
      <p style="color:#475569">Your policy coverage continues uninterrupted. Thank you for your timely payment.</p>
      <p style="font-size:13px;color:#64748b">{{agentName}} — InsureFlow</p>`),
  },
];

async function seed() {
  await mongoose.connect(MONGODB_URI);
  console.log("Connected to MongoDB");

  let created = 0, skipped = 0;
  for (const t of TEMPLATES) {
    const exists = await EmailTemplate.findOne({ slug: t.slug });
    if (exists) { console.log(`⏭  ${t.slug} already exists — skipping`); skipped++; continue; }
    await EmailTemplate.create({ ...t, isSystem: true, isActive: true });
    console.log(`✅  Created: ${t.slug}`);
    created++;
  }

  console.log(`\nSeed complete: ${created} created, ${skipped} skipped`);
  await mongoose.disconnect();
}

seed().catch((err) => { console.error(err); process.exit(1); });
