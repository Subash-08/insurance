# Architecture Decision Records (ADR)

## 1. Using Next.js 14 App Router
We chose Next.js App Router to utilize React Server Components for faster loading in poor mobile network conditions, avoiding heavy client side data fetching loops.

## 2. MongoDB over PostgreSQL
Insurance data schemas can be highly polymorphic (Life vs Health vs Vehicle insurance have completely different specifics). Using the MongoDB document model allows us to utilize the `typeSpecificData` object elegantly without a massive joined EAV (Entity-Attribute-Value) schema.

## 3. n8n for Background Tasks
Vercel serverless functions have timeouts (10s/30s) and do not support long running node chron tasks natively. Using n8n allows for visual, reliable email distribution with retry capabilities.
