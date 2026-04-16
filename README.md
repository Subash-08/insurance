# InsureFlow

Insurance Agency Management System built with Next.js 14 App Router, NextAuth, and MongoDB.

## Prerequisites
- Node.js >= 20
- npm >= 10

## Installation
1. Clone the repository
2. Run `npm install`
3. Copy `.env.local.example` to `.env.local` and populate variables
4. Run `npm run seed:admin` to create the initial admin user
5. Run `npm run dev` to start the development server

## Environment Setup
See `docs/env-setup.md` for detailed instructions on configuring MongoDB Atlas, Resend, Cloudinary, and NextAuth.

## Cloudinary Setup
Set up an unsigned upload preset named `insureflow_unsigned` to allow client-side avatar uploads. For KYC and secure documents, use signed authenticated server-side uploads.

## n8n Setup
Refer to `.ai/flows.md` for understanding the webhooks. Set `N8N_WEBHOOK_SECRET` in both your `.env.local` and your n8n workflow headers to ensure secure delivery.

## Folder Structure
We use standard App Router conventions with encapsulated model, type, and hook folders to prevent circular dependencies. Read `docs/architecture.md` for deeper insights.
