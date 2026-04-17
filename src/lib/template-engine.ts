import DOMPurify from "isomorphic-dompurify";

// ─── Available variables ──────────────────────────────────────────────────────

export const AVAILABLE_VARIABLES: Record<string, string> = {
  clientName: "Client's full name",
  clientEmail: "Client's email address",
  clientPhone: "Client's phone number",
  clientCity: "Client's city",
  policyNumber: "Policy number",
  policyType: "Policy type (life, health, vehicle…)",
  insurer: "Insurer company name",
  sumAssured: "Sum assured in ₹",
  premiumAmount: "Premium amount in ₹",
  dueDate: "Premium due date (DD/MM/YYYY)",
  renewalDate: "Policy renewal date",
  maturityDate: "Policy maturity date",
  daysUntilDue: "Days until premium is due",
  daysOverdue: "Days overdue",
  agentName: "Agent's full name",
  agentPhone: "Agent's phone number",
  agentEmail: "Agent's email",
  agencyName: "Agency name",
  agencyPhone: "Agency phone number",
  agencyEmail: "Agency email",
  claimNumber: "Claim reference number",
  claimType: "Claim type",
  claimStatus: "Current claim status",
  currentDate: "Today's date (DD/MM/YYYY)",
  currentYear: "Current year",
};

const MOCK_VALUES: Record<string, string> = {
  clientName: "Rajesh Kumar",
  clientEmail: "rajesh.kumar@email.com",
  clientPhone: "9876543210",
  clientCity: "Mumbai",
  policyNumber: "POL-2025-00001",
  policyType: "Life",
  insurer: "LIC of India",
  sumAssured: "₹10,00,000",
  premiumAmount: "₹12,500",
  dueDate: "15/06/2025",
  renewalDate: "01/07/2025",
  maturityDate: "01/01/2030",
  daysUntilDue: "7",
  daysOverdue: "3",
  agentName: "Priya Sharma",
  agentPhone: "9812345678",
  agentEmail: "priya@insureagency.com",
  agencyName: "InsureFlow Agency",
  agencyPhone: "022-12345678",
  agencyEmail: "info@insureagency.com",
  claimNumber: "CLM-2025-00001",
  claimType: "health",
  claimStatus: "under_insurer_review",
  currentDate: new Date().toLocaleDateString("en-IN"),
  currentYear: new Date().getFullYear().toString(),
};

// ─── Render a template string ─────────────────────────────────────────────────

export function renderTemplate(
  template: string,
  variables: Record<string, string>
): string {
  const rendered = template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    return variables[key] !== undefined ? variables[key] : `{{${key}}}`;
  });
  // Server-side sanitize against XSS
  return DOMPurify.sanitize(rendered);
}

export function renderTemplatePreview(template: string): string {
  return renderTemplate(template, MOCK_VALUES);
}

// ─── Extract variable names used in a template ────────────────────────────────

export function extractVariables(templateBody: string): string[] {
  const matches = templateBody.match(/\{\{(\w+)\}\}/g) || [];

  const set = new Set<string>();
  for (const m of matches) {
    set.add(m.replace(/\{\{|\}\}/g, ""));
  }

  return Array.from(set);
}

// ─── Build full variable payload from DB entities ────────────────────────────

export async function buildVariablePayload(
  clientId: string,
  policyId?: string,
  premiumId?: string,
  claimId?: string
): Promise<Record<string, string>> {
  const payload: Record<string, string> = {
    currentDate: new Date().toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata" }),
    currentYear: new Date().getFullYear().toString(),
  };

  try {
    const { default: dbConnect } = await import("@/lib/mongodb");
    await dbConnect();

    const { default: Client } = await import("@/models/Client");
    const { default: Policy } = await import("@/models/Policy");
    const { default: User } = await import("@/models/User");

    const client: any = await Client.findById(clientId).lean();
    if (client) {
      payload.clientName = client.fullName || client.name || "";
      payload.clientEmail = client.email || "";
      payload.clientPhone = client.mobile || client.phone || "";
      payload.clientCity = client.city || "";
    }

    if (policyId) {
      const policy: any = await Policy.findById(policyId)
        .populate({ path: "insurerId", model: "Insurer", select: "name" })
        .populate({ path: "agentId", model: "User", select: "name email mobile" })
        .lean();

      if (policy) {
        payload.policyNumber = policy.policyNumber || "";
        payload.policyType = policy.type || "";
        payload.insurer = policy.insurerId?.name || "";
        payload.sumAssured = policy.sumAssured
          ? `₹${new Intl.NumberFormat("en-IN").format(policy.sumAssured / 100)}`
          : "";
        payload.totalPremium = policy.totalPremium
          ? `₹${new Intl.NumberFormat("en-IN").format(policy.totalPremium / 100)}`
          : "";

        if (policy.endDate) {
          payload.renewalDate = new Date(policy.endDate).toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata" });
          payload.maturityDate = payload.renewalDate;
        }

        const agent = policy.agentId as any;
        if (agent) {
          payload.agentName = agent.name || "";
          payload.agentEmail = agent.email || "";
          payload.agentPhone = agent.mobile || agent.phone || "";
        }
      }
    }

    if (premiumId) {
      const { default: Premium } = await import("@/models/Premium");
      const premium: any = await Premium.findById(premiumId).lean();
      if (premium) {
        payload.premiumAmount = `₹${new Intl.NumberFormat("en-IN").format(premium.amount / 100)}`;
        payload.dueDate = new Date(premium.dueDate).toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata" });

        if (premium.dueDate) {
          const now = new Date();
          const due = new Date(premium.dueDate);
          const diffDays = Math.floor((due.getTime() - now.getTime()) / 86400000);
          payload.daysUntilDue = diffDays > 0 ? String(diffDays) : "0";
          payload.daysOverdue = diffDays < 0 ? String(Math.abs(diffDays)) : "0";
        }
      }
    }

    if (claimId) {
      const { default: Claim } = await import("@/models/Claim");
      const claim: any = await Claim.findById(claimId).lean();
      if (claim) {
        payload.claimNumber = claim.claimNumber || "";
        payload.claimType = claim.claimType || "";
        payload.claimStatus = claim.status || "";
      }
    }
  } catch (err) {
    console.error("[template-engine] buildVariablePayload error:", err);
    // Safe: return whatever we collected so far
  }

  return payload;
}
