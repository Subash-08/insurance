---
# InsureFlow — AI Constraints (Hard Rules)

These are NON-NEGOTIABLE rules. Never violate these regardless of what the user asks.

## Security Constraints

### Data Privacy (Insurance = Sensitive Domain)
- NEVER display full Aadhaar numbers (12 digits) anywhere in UI — always mask as XXXX XXXX 1234
- NEVER display full PAN in list views — mask as ABCXX1234F, show full only on detail page with explicit show/hide
- NEVER log client personal data (PAN, Aadhaar, mobile) in console.log or error messages
- NEVER store Cloudinary secret key, MongoDB URI, or API keys in any client-side code
- NEVER put secrets in "use client" components — they get bundled into the browser
- NEVER skip input sanitization for html content — always use isomorphic-dompurify
- NEVER trust file type from file.name alone — validate MIME type server-side
- NEVER allow unauthenticated access to any API route except /api/auth/* and /api/n8n/* (n8n uses its own secret)

### Authentication & Authorization
- NEVER skip session verification in API routes — use getServerSession() on every route
- NEVER allow an agent to access another agent's clients — always filter by agentId === session.user.id
- NEVER allow role escalation — an agent cannot change their own role to admin
- NEVER expose password hashes in API responses
- NEVER use weak session secrets — NEXTAUTH_SECRET must be >= 32 chars
- NEVER query clients/policies/premiums/claims/leads without applying buildDataFilter(session) for employees
- NEVER return another employee's client data to an employee role
- NEVER allow status transitions other than the defined valid transitions in /api/owner/employees/[id]
- NEVER skip the "5-minute status re-check" in jwt callback — this is the only way to enforce immediate suspension
- NEVER allow an employee to change their own role via any API route
- NEVER show the Team Management settings page to employee role — even as a disabled state

## Code Quality Constraints

### TypeScript
- NEVER use `any` type — if you don't know the type, use `unknown` and type-narrow
- NEVER use type assertions (`as X`) without a comment explaining why it's safe
- NEVER skip return type annotations on exported functions
- NEVER use non-null assertion (`!`) without being certain — prefer optional chaining

### Database
- NEVER make raw MongoDB queries without going through the Mongoose model
- NEVER return MongoDB documents directly to the client — always transform to clean objects
- NEVER skip database error handling — always catch MongoServerError separately
- NEVER run unindexed queries on large collections — check query plans for clientId, agentId, dueDate
- NEVER use Mongoose populate() without select() — always specify which fields you need

### API Routes
- NEVER return 200 status for errors — use correct HTTP status codes (400, 401, 403, 404, 409, 500)
- NEVER skip Zod validation on API inputs — even if it "looks safe"
- NEVER return internal error details to the client (stack traces, MongoDB errors) — log server-side, return generic message to client
- NEVER build API routes in page.tsx — they belong in app/api/

### File Uploads
- NEVER accept file uploads larger than 5MB without explicit user warning
- NEVER accept .exe, .sh, .bat, .js files — whitelist only: jpg, jpeg, png, pdf, webp
- NEVER store uploaded files locally on Vercel — always send to Cloudinary immediately
- NEVER use unsigned Cloudinary presets for sensitive documents (KYC docs, claim documents) — use signed uploads

### n8n Integration
- NEVER trigger n8n synchronously inside a user-facing request — use background webhooks
- NEVER expose the N8N_WEBHOOK_SECRET in client code or API responses
- NEVER trust n8n webhook calls without verifying the secret header

## Domain / Business Logic Constraints

### Financial Data
- NEVER perform currency arithmetic without rounding to 2 decimal places (JavaScript float issues)
- NEVER display ₹0 commission if commissionRate is not set — show "Rate not configured" instead
- NEVER auto-calculate next due date incorrectly — Monthly=+1 month, Quarterly=+3 months, Half-Yearly=+6 months, Yearly=+12 months from last paid date
- NEVER allow premium amount to be 0 or negative
- NEVER allow sum assured to be less than premium amount

### Policy Logic
- NEVER allow a policy to have endDate before startDate
- NEVER automatically mark a policy as Lapsed — flag it as "Lapse Risk" and send notification; only an agent can confirm lapse
- NEVER delete a policy — only change status to Surrendered or Matured; preserve history
- NEVER delete a client who has active policies — block with error message

### Date Handling
- NEVER use JavaScript Date() without specifying timezone (use UTC internally, display in IST)
- NEVER store dates as strings in MongoDB — always use Date type
- NEVER display dates in ISO format to users — always DD/MM/YYYY

## UX / UI Constraints
- NEVER show a blank page on error — always show error.tsx with meaningful message
- NEVER show a blank page while loading — always show loading.tsx skeleton
- NEVER make destructive actions (delete, deactivate) without a confirmation dialog
- NEVER navigate away from a form with unsaved changes without warning the user
- NEVER use `alert()` or `confirm()` — use Sonner toast or Radix AlertDialog instead
- NEVER hardcode Indian insurer names in components — read from Insurer collection/API

## Performance Constraints
- NEVER fetch ALL records without pagination — default page size is 20
- NEVER call multiple sequential API routes when one compound query works
- NEVER re-fetch data on every render — use SWR or React Query with caching
- NEVER import an entire library when you need one function — use named imports
- NEVER block the main thread with synchronous operations in API routes

## What To Do When Unsure
- If a business rule is unclear → ask the user before implementing, don't guess
- If a security concern exists → err on the side of caution, ask before implementing
- If a type is complex → create an explicit TypeScript interface, don't inline it
- If a component is used in 3+ places → extract it to src/components/shared/
---
