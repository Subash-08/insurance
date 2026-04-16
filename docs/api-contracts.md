# API Contracts

All APIs require authentication and return standard payloads.

## Standard Payload Shape
```json
// Success
{
  "success": true,
  "data": { ... }, // or Array
  "pagination": { "page": 1, "limit": 20, "total": 100 } // if applicable
}

// Error
{
  "success": false,
  "error": "Message"
}
```

## Routes

### Clients
- `GET /api/clients`: List clients.
- `POST /api/clients`: Create client.
- `GET /api/clients/[id]`: Detail.
- `PUT /api/clients/[id]`: Update.
- `DELETE /api/clients/[id]`: Soft/Hard delete.

### Policies
- `GET /api/policies`: List.
- `POST /api/policies`: Create.
- `GET /api/policies/[id]`: Detail.
- `PUT /api/policies/[id]`: Update.
- `DELETE /api/policies/[id]`: Change status to surrendered.
- `POST /api/policies/[id]/renew`: Renew logic.

*(Repeat standard CRUD for Premiums, Claims, Leads)*

### Reminders & Webhooks
- `GET /api/n8n/get-due-reminders` (Secured via N8N_WEBHOOK_SECRET)
- `POST /api/n8n/log-reminder`
