---
# InsureFlow — Project Context

## What Is This?
InsureFlow is a full-stack Insurance Agency Management System (CRM) built for Indian insurance agents and agency owners. It replaces spreadsheets, scattered WhatsApp messages, and missed renewal calls with a centralized platform.

## The Problem It Solves
Indian insurance agents today:
- Track clients in Excel or physical registers — data gets lost
- Miss renewal dates because there is no automated reminder system
- Have no visibility on premium collection — find out about lapsed policies too late
- Cannot manage claims tracking — clients lose trust
- Have no lead pipeline — promising enquiries fall through the cracks
- Cannot generate commission reports — manual calculation errors
- Share login credentials with team — no data security or audit trail

## Target Users
1. Agency Owner / Admin: Manages the full agency. Can see all agents' data, configure automation, generate commission reports. 1-3 users per agency.
2. Insurance Agent: Manages their own book of clients. Views only their own data. Adds clients, records premiums, files claims. 3-20 users per agency.

## Core Modules
1. Dashboard — daily action view: renewals due, overdue premiums, birthdays, maturities
2. Lead Management — pipeline from enquiry to client (kanban + list views)
3. Client Management — complete profile: personal, KYC, nominees, medical, documents
4. Policy Management — all policy types with type-specific fields
5. Premium Tracker — due/overdue/paid tracking with receipt photos
6. Claims Management — workflow tracking from filing to settlement
7. Reminders & Automation — n8n-powered email reminders (renewal/premium/birthday/maturity)
8. Reports & Analytics — business summary, expiry reports, commission, client-wise
9. Settings — agency profile, team, insurers master, policy templates, email templates

## Indian Market Specifics
- Currency: Indian Rupee ₹, formatted as ₹X,XX,XXX (Indian numbering system)
- Date format: DD/MM/YYYY
- PAN format: ABCDE1234F (5 alpha + 4 numeric + 1 alpha, uppercase)
- Aadhaar: 12-digit number, always display masked as XXXX XXXX XXXX
- Insurers pre-loaded: LIC, HDFC Life, ICICI Prudential, Star Health, Bajaj Allianz, New India Assurance, SBI Life, Max Life, TATA AIA
- GST on insurance premium: 18%
- Grace period standard: 30 days after due date
- Financial year: April to March

## Tech Stack
- Frontend + API: Next.js 14 App Router (TypeScript)
- Database: MongoDB Atlas (Mongoose ODM)
- Auth: NextAuth v4 (JWT, role-based)
- File Storage: Cloudinary
- Email: Resend
- Automation: n8n (webhook-based, external)
- Hosting: Vercel
- UI: Tailwind CSS + shadcn/ui + Radix UI
- Charts: Recharts
- Animation: Framer Motion
- Forms: React Hook Form + Zod
- Toast: Sonner

## Data Relationships
Client (1) → Policies (many)
Policy (1) → Premiums (many, auto-generated on policy creation)
Policy (1) → Claims (many)
Client (1) → Leads (1, when converted)
Agent (1) → Clients (many)
Agent (1) → Leads (many)
EmailTemplate (1) → Reminders (many)
Policy (1) → Reminders (many)

## n8n Automation Architecture
n8n runs on n8n Cloud (external). It:
1. Polls GET /api/n8n/get-due-reminders every hour via HTTP Request node
2. Loops through each record using SplitInBatches node
3. Fills email template variables using Set node
4. Sends email via Resend using HTTP Request node
5. Calls back POST /api/n8n/log-reminder with sent status
6. All n8n requests authenticated via N8N_WEBHOOK_SECRET header

## Key Business Rules
- Lapse prevention: if premium overdue > 3 days → urgent email to client
- Policy renewal: reminders at 60, 30, 15, 7 days before expiry
- Birthday greetings: email on client birthday (builds relationship, cross-sell opportunity)
- Commission = totalPremium × commissionRate (configured per insurer in Settings)
- Agent data isolation: agents see ONLY their own clients; admins see all
- Audit trail: every create/update/delete logged in AuditLog collection

## Folder Structure Rationale
- App Router route groups: (auth) and (dashboard) keep layouts clean without affecting URLs
- Models in src/models/ separate from app/ to avoid circular imports
- Types in src/types/index.ts as single source of truth
- Shared components in src/components/shared/ — used across all modules
- lib/ contains all third-party integrations (never in components)
---
