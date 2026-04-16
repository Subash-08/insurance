# Architecture Overview

## Motivation
InsureFlow needs a robust, scalable structure that easily separates public UI from protected Dashboard layers, while handling background cron jobs correctly in a Vercel serverless environment (using external n8n).

## Next.js 14 App Router
We use the App Router because React Server Components (RSC) drastically reduce the client JavaScript bundle. All data fetching for pages happens on the server via Mongoose `lean()` queries.

### Route Groups
- `(auth)`: Login/onboarding flows. Does not include standard navigation bars.
- `(dashboard)`: Contains the Sidebar and Header layouts. Wrapped in session verification.

## Mongoose in Serverless
Next.js on Vercel destroys and rebuilds instances. We utilize a singleton connection manager (`src/lib/mongodb.ts`) to cache the active connection globally and prevent exhaustion of connection pools.

## Separation of Concerns
- **Models**: `src/models/*.ts` - Pure schema definitions.
- **Types**: `src/types/index.ts` - TypeScript interfaces mapping exactly to Models.
- **Libraries**: `src/lib/*.ts` - Third-party wrappers (Resend, Cloudinary, n8n, utils).
- **Components**: Grouped strictly by domain (`clients`, `policies`, `claims`) rather than component archetypes, except for `shared/`.
