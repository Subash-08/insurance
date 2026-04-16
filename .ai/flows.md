# InsureFlow Business Flows

## 1. Authentication Flow
- User logs in via credential provider (NextAuth) using `/login`.
- Server validates password Hash.
- JWT token is issued containing `id`, `role`, and `name`.
- User is redirected to `/dashboard`.
- Middleware protects all `/(dashboard)` routes, redirecting unauthenticated users to `/login`.

## 2. Policy Creation & Premium Generation
- Agent creates a new Client first (or selects an existing one).
- Agent creates a Policy for the client.
- System automatically generates the first Premium record (or a schedule depending on the frequency).
- AuditLog is created.

## 3. n8n Automation Flow (Reminders)
- **Hourly trigger:** n8n polls `GET /api/n8n/get-due-reminders` (authorized via secret).
- Endpoint returns all `Reminders` where `scheduledDate` is due and `status` is Pending.
- n8n processes the array, injects data into the corresponding `EmailTemplate`, and uses Resend to fire the email.
- Upon success/fail, n8n calls `POST /api/n8n/log-reminder` to update the Reminder record.

## 4. Claims Flow
- Client notifies Agent.
- Agent files new Claim.
- Status = `Filed`.
- Agent uploads documents over time.
- Status changes: `Under Review` -> `Approved` -> `Settled`.
- Every transition appends to the `timeline` array.

## 5. Lead -> Client Conversion
- Lead is tracked in Kanji/Board.
- When Lead agrees, status becomes `Won`.
- Endpoint `POST /api/leads/[id]/convert` is triggered.
- A new `Client` record is generated from Lead data.
- Lead gets `convertedClientId`.
