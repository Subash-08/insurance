# Environment Setup Guide

Follow these steps to configure InsureFlow locally:

1. **MongoDB Atlas**
   - Create a free cluster.
   - Whitelist `0.0.0.0/0` (or specifically your IP).
   - Copy connection string to `MONGODB_URI`.

2. **NextAuth**
   - Generate secret using `openssl rand -base64 32`.
   - Set `NEXTAUTH_SECRET`.
   - Ensure `NEXTAUTH_URL=http://localhost:3000`.

3. **Cloudinary**
   - Create a free account.
   - Enter `CLOUDINARY_CLOUD_NAME`, `API_KEY`, and `API_SECRET`.
   - Create an unsigned preset named `insureflow_unsigned`.

4. **Resend**
   - Sign up and verify your domain to get an API key.
   - Put it in `RESEND_API_KEY`.

5. **n8n**
   - Create a workflow with Webhook trigger.
   - Copy the test URL to `N8N_WEBHOOK_URL`.
   - Define your own arbitrary secret for `N8N_WEBHOOK_SECRET`.
