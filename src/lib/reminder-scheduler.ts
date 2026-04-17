import mongoose from "mongoose";

export interface ReminderPayload {
  clientId: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  policyId?: string;
  policyNumber?: string;
  insurer?: string;
  dueDate?: string;
  premiumAmount?: string;
  agentId: string;
  agentName: string;
  agentEmail: string;
  agentPhone: string;
  templateSlug: string;
  variableMap: Record<string, string>;
}

function istDateRange(daysOffset: number): { start: Date; end: Date } {
  const nowIST = new Date(
    new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" })
  );
  const target = new Date(nowIST);
  target.setDate(target.getDate() + daysOffset);

  const start = new Date(target);
  start.setHours(0, 0, 0, 0);
  const end = new Date(target);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

export async function getDueRenewals(
  daysAhead: number,
  dataFilter: object
): Promise<ReminderPayload[]> {
  const { start, end } = istDateRange(daysAhead);
  const { default: Policy } = await import("@/models/Policy");

  const policies: any[] = await Policy.find({
    ...dataFilter,
    status: "active",
    endDate: { $gte: start, $lte: end },
  })
    .populate({ path: "clientId", model: "Client", select: "fullName email mobile emailOptOut" })
    .populate({ path: "agentId", model: "User", select: "name email mobile" })
    .populate({ path: "insurerId", model: "Insurer", select: "name" })
    .lean();

  return policies
    .filter((p) => !(p.clientId as any)?.emailOptOut)
    .map((p) => {
      const client: any = p.clientId;
      const agent: any = p.agentId;
      return {
        clientId: client?._id?.toString(),
        clientName: client?.fullName || "",
        clientEmail: client?.email || "",
        clientPhone: client?.mobile || "",
        policyId: p._id?.toString(),
        policyNumber: p.policyNumber,
        insurer: (p.insurerId as any)?.name || "",
        dueDate: new Date(p.endDate).toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata" }),
        agentId: agent?._id?.toString(),
        agentName: agent?.name || "",
        agentEmail: agent?.email || "",
        agentPhone: agent?.mobile || "",
        templateSlug: "renewal-notice",
        variableMap: {
          clientName: client?.fullName || "",
          policyNumber: p.policyNumber,
          insurer: (p.insurerId as any)?.name || "",
          renewalDate: new Date(p.endDate).toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata" }),
          agentName: agent?.name || "",
          agentPhone: agent?.mobile || "",
        },
      };
    });
}

export async function getDuePremiums(
  daysAhead: number,
  dataFilter: object
): Promise<ReminderPayload[]> {
  const { start, end } = istDateRange(daysAhead);
  const { default: Premium } = await import("@/models/Premium");

  const premiums: any[] = await Premium.find({
    ...dataFilter,
    dueDate: { $gte: start, $lte: end },
    status: { $in: ["upcoming", "due"] },
  })
    .populate({ path: "clientId", model: "Client", select: "fullName email mobile emailOptOut" })
    .populate({
      path: "policyId",
      model: "Policy",
      select: "policyNumber",
      populate: { path: "insurerId", model: "Insurer", select: "name" },
    })
    .populate({ path: "agentId", model: "User", select: "name email mobile" })
    .lean();

  return premiums
    .filter((p) => !(p.clientId as any)?.emailOptOut)
    .map((p) => {
      const client: any = p.clientId;
      const policy: any = p.policyId;
      const agent: any = p.agentId;
      return {
        clientId: client?._id?.toString(),
        clientName: client?.fullName || "",
        clientEmail: client?.email || "",
        clientPhone: client?.mobile || "",
        policyId: policy?._id?.toString(),
        policyNumber: policy?.policyNumber,
        insurer: policy?.insurerId?.name || "",
        dueDate: new Date(p.dueDate).toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata" }),
        premiumAmount: `₹${new Intl.NumberFormat("en-IN").format(p.amount / 100)}`,
        agentId: agent?._id?.toString(),
        agentName: agent?.name || "",
        agentEmail: agent?.email || "",
        agentPhone: agent?.mobile || "",
        templateSlug: "premium-due",
        variableMap: {
          clientName: client?.fullName || "",
          policyNumber: policy?.policyNumber || "",
          premiumAmount: `₹${new Intl.NumberFormat("en-IN").format(p.amount / 100)}`,
          dueDate: new Date(p.dueDate).toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata" }),
          insurer: policy?.insurerId?.name || "",
          agentName: agent?.name || "",
          agentPhone: agent?.mobile || "",
        },
      };
    });
}

export async function getOverduePremiums(
  daysOverdue: number,
  dataFilter: object
): Promise<ReminderPayload[]> {
  const { start, end } = istDateRange(-daysOverdue);
  const { default: Premium } = await import("@/models/Premium");

  const premiums: any[] = await Premium.find({
    ...dataFilter,
    dueDate: { $gte: start, $lte: end },
    status: "overdue",
  })
    .populate({ path: "clientId", model: "Client", select: "fullName email mobile emailOptOut" })
    .populate({ path: "policyId", model: "Policy", select: "policyNumber" })
    .populate({ path: "agentId", model: "User", select: "name email mobile" })
    .lean();

  return premiums
    .filter((p) => !(p.clientId as any)?.emailOptOut)
    .map((p) => {
      const client: any = p.clientId;
      const policy: any = p.policyId;
      const agent: any = p.agentId;
      return {
        clientId: client?._id?.toString(),
        clientName: client?.fullName || "",
        clientEmail: client?.email || "",
        clientPhone: client?.mobile || "",
        policyId: policy?._id?.toString(),
        policyNumber: policy?.policyNumber,
        dueDate: new Date(p.dueDate).toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata" }),
        premiumAmount: `₹${new Intl.NumberFormat("en-IN").format(p.amount / 100)}`,
        agentId: agent?._id?.toString(),
        agentName: agent?.name || "",
        agentEmail: agent?.email || "",
        agentPhone: agent?.mobile || "",
        templateSlug: "premium-overdue",
        variableMap: {
          clientName: client?.fullName || "",
          policyNumber: policy?.policyNumber || "",
          premiumAmount: `₹${new Intl.NumberFormat("en-IN").format(p.amount / 100)}`,
          daysOverdue: String(daysOverdue),
          agentName: agent?.name || "",
          agentPhone: agent?.mobile || "",
        },
      };
    });
}

export async function getBirthdays(dataFilter: object): Promise<ReminderPayload[]> {
  const { default: Client } = await import("@/models/Client");

  const nowIST = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
  const todayMonth = nowIST.getMonth() + 1;
  const todayDay = nowIST.getDate();

  // Aggregation to match month + day of dateOfBirth
  const clients: any[] = await (Client as any).aggregate([
    {
      $match: {
        ...dataFilter,
        dateOfBirth: { $exists: true, $ne: null },
        emailOptOut: { $ne: true },
      },
    },
    {
      $addFields: {
        dobMonth: { $month: "$dateOfBirth" },
        dobDay: { $dayOfMonth: "$dateOfBirth" },
      },
    },
    { $match: { dobMonth: todayMonth, dobDay: todayDay } },
  ]);

  return clients.map((c) => ({
    clientId: c._id?.toString(),
    clientName: c.fullName || "",
    clientEmail: c.email || "",
    clientPhone: c.mobile || "",
    agentId: c.agentId?.toString() || "",
    agentName: "",
    agentEmail: "",
    agentPhone: "",
    templateSlug: "birthday-greeting",
    variableMap: { clientName: c.fullName || "", agencyName: "InsureFlow" },
  }));
}

export async function getMaturities(
  daysAhead: number,
  dataFilter: object
): Promise<ReminderPayload[]> {
  const { start, end } = istDateRange(daysAhead);
  const { default: Policy } = await import("@/models/Policy");

  const policies: any[] = await Policy.find({
    ...dataFilter,
    status: "active",
    endDate: { $gte: start, $lte: end },
    type: { $in: ["life", "ulip", "term"] }, // only maturity-relevant types
  })
    .populate({ path: "clientId", model: "Client", select: "fullName email mobile emailOptOut" })
    .populate({ path: "agentId", model: "User", select: "name email mobile" })
    .populate({ path: "insurerId", model: "Insurer", select: "name" })
    .lean();

  return policies
    .filter((p) => !(p.clientId as any)?.emailOptOut)
    .map((p) => {
      const client: any = p.clientId;
      const agent: any = p.agentId;
      return {
        clientId: client?._id?.toString(),
        clientName: client?.fullName || "",
        clientEmail: client?.email || "",
        clientPhone: client?.mobile || "",
        policyId: p._id?.toString(),
        policyNumber: p.policyNumber,
        insurer: (p.insurerId as any)?.name || "",
        dueDate: new Date(p.endDate).toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata" }),
        agentId: agent?._id?.toString(),
        agentName: agent?.name || "",
        agentEmail: agent?.email || "",
        agentPhone: agent?.mobile || "",
        templateSlug: "maturity-alert",
        variableMap: {
          clientName: client?.fullName || "",
          policyNumber: p.policyNumber,
          maturityDate: new Date(p.endDate).toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata" }),
          insurer: (p.insurerId as any)?.name || "",
          sumAssured: p.sumAssured ? `₹${new Intl.NumberFormat("en-IN").format(p.sumAssured / 100)}` : "",
          agentName: agent?.name || "",
          agentPhone: agent?.mobile || "",
        },
      };
    });
}
