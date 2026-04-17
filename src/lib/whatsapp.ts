// WhatsApp integration — zero-dependency deep link mode
// All functions work without any API keys. wa.me links require no configuration.

export const WHATSAPP_MODE: "deep_link" | "api" =
  (process.env.WHATSAPP_MODE as "deep_link" | "api") ?? "deep_link";

const WHATSAPP_PROVIDER = process.env.WHATSAPP_PROVIDER ?? "wati";

export function generateWaLink(phone: string, message: string): string {
  if (!phone) return "";
  // Sanitize: remove all non-digits
  let sanitized = phone.replace(/\D/g, "");
  // Remove leading 0 (Indian local format)
  if (sanitized.startsWith("0")) sanitized = sanitized.slice(1);
  // Prepend country code 91 for 10-digit Indian numbers
  if (sanitized.length === 10) sanitized = "91" + sanitized;
  if (sanitized.length < 10) return "";

  const encoded = encodeURIComponent(message);
  return `https://wa.me/${sanitized}?text=${encoded}`;
}

// ─── Message template functions ──────────────────────────────────────────────

export const WHATSAPP_MESSAGE_TEMPLATES: Record<
  string,
  (vars: Record<string, string>) => string
> = {
  premium_due: (v) =>
    `Dear ${v.clientName}, your premium of ₹${v.premiumAmount} for policy ${v.policyNumber} (${v.insurer}) is due on ${v.dueDate}. Please arrange payment to keep your policy active.\n\nFor assistance: ${v.agentName} - ${v.agentPhone}`,

  premium_overdue: (v) =>
    `⚠️ URGENT: Dear ${v.clientName}, premium for policy ${v.policyNumber} is overdue by ${v.daysOverdue} days. Amount: ₹${v.premiumAmount}. Please pay immediately to avoid policy lapse.\n\n${v.agentName} - ${v.agentPhone}`,

  premium_receipt: (v) =>
    `✅ Payment Received!\n\nDear ${v.clientName}, we have received your premium payment of ₹${v.premiumAmount} for policy ${v.policyNumber}.\n\nReceipt No: ${v.receiptNumber}\nDate: ${v.paymentDate}\n\nThank you! ${v.agentName} - ${v.agentPhone}`,

  renewal_reminder: (v) =>
    `Dear ${v.clientName}, your insurance policy ${v.policyNumber} with ${v.insurer} is due for renewal on ${v.renewalDate}. Premium: ₹${v.premiumAmount}.\n\nContact us to renew: ${v.agentName} - ${v.agentPhone}`,

  claim_update: (v) =>
    `Dear ${v.clientName}, update on your claim ${v.claimNumber}: Status has changed to *${v.claimStatus}*.\n\nDays since filing: ${v.daysPending}\n\nFor queries: ${v.agentName} - ${v.agentPhone}`,

  cheque_bounce: (v) =>
    `Dear ${v.clientName}, unfortunately your cheque for policy ${v.policyNumber} has been returned by the bank. Please arrange an alternative payment of ₹${v.premiumAmount}.\n\n${v.agentName} - ${v.agentPhone}`,

  birthday_greeting: (v) =>
    `🎂 Dear ${v.clientName}, wishing you a very Happy Birthday! Thank you for trusting ${v.agencyName} with your insurance needs.\n\nWith warm wishes,\n${v.agentName} - ${v.agencyName}`,

  policy_maturity: (v) =>
    `Dear ${v.clientName}, your policy ${v.policyNumber} with ${v.insurer} matures on ${v.maturityDate}. Maturity amount: ₹${v.sumAssured}.\n\nLet's discuss reinvestment options. ${v.agentName} - ${v.agentPhone}`,

  document_request: (v) =>
    `Dear ${v.clientName}, we still need the following documents for your claim ${v.claimNumber}: ${v.pendingDocs}. Please submit at your earliest convenience.\n\n${v.agentName} - ${v.agentPhone}`,
};

export function buildWhatsAppUrl(
  templateKey: string,
  variables: Record<string, string>,
  phone: string
): string {
  const templateFn = WHATSAPP_MESSAGE_TEMPLATES[templateKey];
  const message = templateFn
    ? templateFn(variables)
    : variables.customMessage || "Hello from InsureFlow";
  return generateWaLink(phone, message);
}

// ─── API mode stubs (future WATI / Twilio) ───────────────────────────────────

export async function sendWhatsAppApiMessage(
  phone: string,
  templateKey: string,
  variables: Record<string, string>
): Promise<{ success: boolean; messageId?: string; reason?: string }> {
  if (WHATSAPP_MODE !== "api") {
    return { success: false, reason: "API mode not enabled — set WHATSAPP_MODE=api" };
  }

  const templateFn = WHATSAPP_MESSAGE_TEMPLATES[templateKey];
  const message = templateFn ? templateFn(variables) : variables.customMessage ?? "";

  if (WHATSAPP_PROVIDER === "wati") {
    // TODO: Implement WATI API integration
    // POST https://live-mt-server.wati.io/api/v1/sendSessionMessage/{phone}
    // Headers: Authorization Bearer WATI_API_KEY
    console.log("[WhatsApp/WATI] Would send to", phone, ":", message);
    return { success: true, messageId: "stub_" + Date.now() };
  }

  if (WHATSAPP_PROVIDER === "twilio") {
    // TODO: Implement Twilio WhatsApp API integration
    // Twilio.messages.create({ from: 'whatsapp:+14155238886', to: `whatsapp:+${phone}`, body: message })
    console.log("[WhatsApp/Twilio] Would send to", phone, ":", message);
    return { success: true, messageId: "stub_" + Date.now() };
  }

  return { success: false, reason: "Unknown WHATSAPP_PROVIDER" };
}
