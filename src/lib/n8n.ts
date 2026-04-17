// n8n integration — graceful fallback if not configured.
// The app must function completely without n8n.

import { buildVariablePayload } from "./template-engine";

export const N8N_WEBHOOK_SECRET = process.env.N8N_WEBHOOK_SECRET ?? "";

export async function isN8nConfigured(): Promise<boolean> {
  try {
    const { default: dbConnect } = await import("@/lib/mongodb");
    await dbConnect();
    const { default: ReminderSettings } = await import("@/models/ReminderSettings");
    const settings: any = await ReminderSettings.findOne({}).lean();
    return !!(settings?.n8nWebhookUrl && settings.n8nSecretConfigured && N8N_WEBHOOK_SECRET);
  } catch {
    return false;
  }
}

export async function triggerN8nWebhook(
  eventType: string,
  payload: object
): Promise<{ success: boolean; executionId?: string; error?: string }> {
  try {
    const { default: dbConnect } = await import("@/lib/mongodb");
    await dbConnect();
    const { default: ReminderSettings } = await import("@/models/ReminderSettings");
    const settings: any = await ReminderSettings.findOne({}).lean();

    if (!settings?.n8nWebhookUrl || !N8N_WEBHOOK_SECRET) {
      console.warn("[n8n] Not configured — skipping webhook trigger");
      return { success: false };
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000); // 10s hard timeout

    const res = await fetch(settings.n8nWebhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-InsureFlow-Secret": N8N_WEBHOOK_SECRET,
      },
      body: JSON.stringify({ event: eventType, ...payload }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!res.ok) {
      const text = await res.text();
      return { success: false, error: `n8n returned ${res.status}: ${text}` };
    }

    const data = await res.json().catch(() => ({}));
    return { success: true, executionId: data?.executionId };
  } catch (err: any) {
    const msg = err?.name === "AbortError" ? "n8n webhook timed out" : err?.message;
    console.error("[n8n] Webhook error:", msg);
    return { success: false, error: msg };
  }
}

export async function triggerManualReminder(
  clientId: string,
  policyId: string,
  templateSlug: string
): Promise<{ success: boolean }> {
  try {
    const variableMap = await buildVariablePayload(clientId, policyId);
    const result = await triggerN8nWebhook("manual_reminder", {
      clientId,
      policyId,
      templateSlug,
      ...variableMap,
    });
    return { success: result.success };
  } catch {
    return { success: false };
  }
}
