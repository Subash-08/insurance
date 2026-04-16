export async function notifyN8n(event: string, payload: any) {
  const url = process.env.N8N_WEBHOOK_URL;
  if (!url) return;
  await fetch(url, { method: "POST", headers: { "Content-Type": "application/json", "Authorization": `Bearer ${process.env.N8N_WEBHOOK_SECRET}` }, body: JSON.stringify({ event, ...payload }) });
}
