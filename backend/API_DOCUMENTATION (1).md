# FlowZapp WhatsApp Platform — API Documentation

## Base URL

| Environment | URL                                    |
| ----------- | -------------------------------------- |
| Production  | `https://wfbbackend.niveshsarthi.com` |
| Local       | `http://localhost:8000`                |

## Authentication

All protected endpoints require a JWT bearer token in the `Authorization` header:

```
Authorization: Bearer <access_token>
```

Get a token via `POST /auth/login`. Tokens expire in **30 minutes**. Use `POST /auth/refresh` to renew.

---

## 1. Authentication (`/auth`)

### POST /auth/register

Register a new admin + organization.

**Request Body**

```json
{ "email": "admin@company.com", "password": "secret123" }
```

**Response 200**

```json
{ "message": "User registered successfully", "user_id": "64abc123..." }
```

**Errors**: `400` Email already registered

---

### POST /auth/login

Login and get JWT tokens.

**Request Body**

```json
{ "email": "admin@company.com", "password": "secret123" }
```

**Response 200**

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

**Errors**: `401` Invalid credentials / Account locked / Deactivated

---

### POST /auth/refresh

Exchange refresh token for a new access token.

**Request Body**

```json
{ "refresh_token": "eyJ..." }
```

**Response 200** — Same as `/auth/login` response

**Errors**: `401` Token expired or revoked

---

### POST /auth/google

Login or sign up via Google OAuth.

**Request Body**

```json
{ "token": "<google_id_token>" }
```

**Response 200** — Same as `/auth/login` response

---

### POST /auth/register-with-invite

Register a new team member using an invitation.

**Request Body**

```json
{
  "email": "sales@company.com",
  "password": "secret123",
  "organization_id": "64abc123...",
  "name": "John Doe"
}
```

**Response 200**

```json
{
  "message": "User registered successfully",
  "user_id": "64abc123...",
  "organization_id": "64abc123...",
  "role": "marketing"
}
```

**Errors**: `403` Email not in access list, `400` User limit reached

---

### POST /auth/password-reset-request

**Request Body**

```json
{ "email": "user@company.com" }
```

**Response 200**

```json
{ "message": "Reset token generated", "token": "abc123xyz..." }
```

---

### POST /auth/password-reset

**Request Body**

```json
{ "token": "abc123xyz...", "new_password": "newSecret123" }
```

**Response 200**

```json
{ "message": "Password reset successfully" }
```

**Errors**: `400` Invalid or expired token

---

### GET /auth/me

Get current logged-in user's profile.

**Response 200**

```json
{
  "_id": "64abc123...",
  "email": "admin@company.com",
  "role": "admin",
  "organization_id": "64abc123...",
  "is_active": true,
  "created_at": "2024-01-15T10:30:00Z"
}
```

---

## 2. Super Admin (`/super-admin`)

> Requires `super_admin` role. Login via `POST /super-admin/login`.

### POST /super-admin/login

**Request Body**

```json
{ "email": "superadmin@platform.com", "password": "secret" }
```

**Response 200** — Same structure as `/auth/login`

---

### GET /super-admin/dashboard

**Response 200**

```json
{
  "total_organizations": 42,
  "total_users": 187,
  "active_subscriptions": 31,
  "monthly_revenue": 150000
}
```

---

### GET /super-admin/organizations

**Response 200**

```json
[
  {
    "_id": "64abc123...",
    "name": "Acme Corp",
    "owner_email": "admin@acme.com",
    "status": "active",
    "plan": "pro",
    "created_at": "2024-01-10T00:00:00Z"
  }
]
```

---

### POST /super-admin/organizations

**Request Body**

```json
{ "name": "New Company", "admin_email": "admin@newco.com", "plan": "starter" }
```

**Response 200**

```json
{ "status": "success", "org_id": "64abc123...", "admin_id": "64abc456..." }
```

---

### PUT /super-admin/organizations/{org_id}/status

**Request Body**

```json
{ "status": "suspended" }
```

**Response 200**

```json
{ "message": "Organization status updated" }
```

---

### DELETE /super-admin/organizations/{org_id}

**Response 200**

```json
{ "message": "Organization deleted" }
```

---

## 3. Organization Admin

### Team & Access (`/admin`)

> Requires `admin` role.

#### GET /admin/team

List all team members in the org.

**Response 200**

```json
[
  {
    "_id": "64abc123...",
    "email": "sales@company.com",
    "name": "Jane Doe",
    "role": "marketing",
    "is_active": true
  }
]
```

---

#### GET /admin/access-list

List all invited emails.

**Response 200**

```json
[
  {
    "_id": "64abc123...",
    "email": "invite@example.com",
    "role": "marketing",
    "status": "pending",
    "invited_at": "2024-01-15T10:30:00Z"
  }
]
```

---

#### POST /admin/access-list

Invite a new user to the org.

**Request Body**

```json
{ "email": "newmember@company.com", "role": "marketing" }
```

**Response 200**

```json
{ "status": "success", "message": "Invitation sent to newmember@company.com" }
```

**Errors**: `400` Already invited / User limit reached

---

#### DELETE /admin/access-list/{email}

**Response 200**

```json
{ "message": "Invitation revoked" }
```

---

#### PUT /admin/users/{user_id}/role

**Request Body**

```json
{ "role": "marketing" }
```

**Response 200**

```json
{ "message": "Role updated" }
```

---

### Settings (`/settings`)

#### GET /settings/whatsapp

**Response 200**

```json
{
  "configured": true,
  "phone_number_id": "1234567890",
  "waba_id": "9876543210",
  "masked_token": "...abcd"
}
```

---

#### POST /settings/whatsapp

**Request Body**

```json
{
  "whatsapp_token": "EAABs...",
  "phone_number_id": "1234567890",
  "waba_id": "9876543210",
  "verify_token": "my_verify_secret"
}
```

**Response 200**

```json
{ "status": "success", "message": "WhatsApp credentials saved" }
```

---

#### GET /settings/openai

**Response 200**

```json
{ "configured": true, "masked_key": "...k4d9" }
```

---

#### POST /settings/openai

**Request Body**

```json
{ "api_key": "sk-proj-..." }
```

**Response 200**

```json
{ "status": "success", "message": "OpenAI API key saved" }
```

---

### Phone Numbers (`/phone-numbers`)

#### GET /phone-numbers

**Response 200**

```json
[
  {
    "_id": "64abc123...",
    "display_name": "Support Line",
    "phone_number_id": "1234567890",
    "waba_id": "9876543210",
    "flow_id": null,
    "bot_id": "64abc456...",
    "is_primary": false,
    "created_at": "2024-01-10T00:00:00Z"
  }
]
```

---

#### POST /phone-numbers

**Request Body**

```json
{
  "display_name": "Sales Line",
  "phone_number_id": "1234567890",
  "waba_id": "9876543210",
  "whatsapp_token": "EAABs...",
  "verify_token": "my_secret"
}
```

**Response 200**

```json
{ "status": "success", "phone_id": "64abc123..." }
```

---

#### PUT /phone-numbers/{phone_id}

Update flow/bot assignment for a phone number.

**Request Body**

```json
{ "bot_id": "64abc123...", "flow_id": null, "display_name": "Updated Name" }
```

**Response 200**

```json
{ "status": "success", "message": "Phone number updated" }
```

---

## 4. Automation & AI

### Bots (`/bots`)

#### GET /bots

**Response 200**

```json
[
  {
    "_id": "64abc123...",
    "name": "Support Bot",
    "system_prompt": "You are a helpful assistant...",
    "model": "gpt-4o-mini",
    "knowledge_base_ids": ["64abc456..."],
    "is_active": true,
    "created_at": "2024-01-10T00:00:00Z"
  }
]
```

---

#### POST /bots

**Request Body**

```json
{
  "name": "Lead Qualifier",
  "system_prompt": "You are a sales assistant...",
  "model": "gpt-4o-mini",
  "knowledge_base_ids": ["64abc456..."],
  "context_window": 10,
  "temperature": 0.7
}
```

**Response 200**

```json
{ "status": "success", "bot_id": "64abc123..." }
```

---

#### POST /bots/{bot_id}/test

Test a bot with a message.

**Request Body**

```json
{ "message": "What are your pricing plans?" }
```

**Response 200**

```json
{
  "response": "We offer Starter, Pro, and Enterprise plans...",
  "model_used": "gpt-4o-mini",
  "tokens_used": 142
}
```

---

### Knowledge Bases (`/knowledge-bases`)

#### GET /knowledge-bases

**Response 200**

```json
[
  {
    "_id": "64abc123...",
    "name": "Product Docs",
    "description": "Internal product documentation",
    "document_count": 5,
    "total_chunks": 234,
    "is_active": true,
    "created_at": "2024-01-10T00:00:00Z"
  }
]
```

---

#### POST /knowledge-bases

**Request Body**

```json
{ "name": "Product FAQ", "description": "Frequently asked questions" }
```

**Response 200**

```json
{ "status": "success", "kb_id": "64abc123..." }
```

---

#### POST /knowledge-bases/{kb_id}/upload

Upload a document (PDF, DOCX, TXT). Use `multipart/form-data`.

**Form Field**: `file` — the document file (max 10MB)

**Response 200**

```json
{
  "status": "success",
  "document_id": "64abc123...",
  "filename": "product_faq.pdf",
  "file_size": 204800,
  "chunks_created": 47
}
```

**Errors**: `400` Missing OpenAI key / File too large, `404` KB not found

---

#### GET /knowledge-bases/{kb_id}/documents

**Response 200**

```json
[
  {
    "id": "64abc123...",
    "filename": "product_faq.pdf",
    "file_type": ".pdf",
    "file_size": 204800,
    "chunk_count": 47,
    "upload_status": "completed",
    "created_at": "2024-01-15T10:30:00Z"
  }
]
```

---

### Flows (`/flows`)

#### GET /flows

**Response 200**

```json
[
  {
    "_id": "64abc123...",
    "name": "Welcome Flow",
    "nodes": [...],
    "edges": [...],
    "is_active": true,
    "created_at": "2024-01-10T00:00:00Z"
  }
]
```

---

#### POST /flows

**Request Body**

```json
{ "name": "New Flow", "nodes": [], "edges": [] }
```

**Response 200**

```json
{ "status": "success", "flow_id": "64abc123..." }
```

---

## 5. Contacts (`/contacts`)

#### GET /contacts

**Query Parameters**

| Param      | Type   | Description                              |
| ---------- | ------ | ---------------------------------------- |
| `page`     | int    | Page number (default: 1)                 |
| `limit`    | int    | Results per page (default: 20, max: 100) |
| `search`   | string | Search by name, phone number, or tag     |
| `tag`      | string | Filter by exact tag                      |
| `isActive` | bool   | Filter by active status                  |

**Response 200**

```json
{
  "contacts": [
    {
      "_id": "64abc123...",
      "name": "Raj Kumar",
      "number": "919876543210",
      "tags": ["VIP", "Lead"],
      "isActive": true,
      "organization_id": "64abc456...",
      "created_at": "2024-01-10T00:00:00Z"
    }
  ],
  "total": 150,
  "page": 1,
  "pages": 8,
  "current_page": 1
}
```

---

#### POST /contacts

**Request Body**

```json
{
  "name": "Raj Kumar",
  "number": "919876543210",
  "tags": ["Lead", "Delhi"]
}
```

**Response 200**

```json
{ "status": "success", "contact_id": "64abc123..." }
```

**Errors**: `400` Number already exists

---

#### DELETE /contacts/{contact_id}

**Response 200**

```json
{ "status": "success", "message": "Contact deleted" }
```

**Errors**: `404` Contact not found or not in your organization

---

#### POST /upload-contacts

Upload contacts via CSV. Use `multipart/form-data`.

**Form Field**: `file` — CSV file with columns: `name`, `number`, `tags`

**Response 200**

```json
{
  "status": "success",
  "total_rows": 500,
  "imported": 487,
  "skipped": 13,
  "errors": ["Row 45: Invalid number format"]
}
```

---

## 6. Templates (`/templates`)

#### GET /templates

Fetches approved templates from Meta (live).

**Response 200**

```json
[
  {
    "id": "1234567890",
    "name": "welcome_message",
    "status": "APPROVED",
    "language": "en",
    "category": "MARKETING",
    "components": [
      { "type": "HEADER", "format": "TEXT", "text": "Hello {{1}}!" },
      { "type": "BODY", "text": "Welcome to {{2}}. We're glad to have you." },
      {
        "type": "BUTTONS",
        "buttons": [
          { "type": "QUICK_REPLY", "text": "Learn More" },
          { "type": "QUICK_REPLY", "text": "Not Interested" }
        ]
      }
    ]
  }
]
```

---

#### POST /templates

Create a new template on Meta.

**Request Body**

```json
{
  "name": "promo_launch",
  "language": "en_US",
  "category": "MARKETING",
  "components": [
    { "type": "BODY", "text": "Hi {{1}}, check out our new offer!" },
    {
      "type": "BUTTONS",
      "buttons": [{ "type": "QUICK_REPLY", "text": "Interested" }]
    }
  ]
}
```

**Response 200**

```json
{
  "status": "success",
  "template_id": "1234567890",
  "message": "Template submitted for review"
}
```

---

## 7. Campaigns (`/campaigns`)

#### GET /campaigns

**Response 200**

```json
[
  {
    "_id": "64abc123...",
    "name": "January Promo",
    "template_name": "promo_jan",
    "status": "completed",
    "total_contacts": 500,
    "sent": 498,
    "failed": 2,
    "scheduled_at": null,
    "created_at": "2024-01-15T10:30:00Z"
  }
]
```

---

#### POST /campaigns/send

**Request Body**

```json
{
  "name": "February Promo",
  "template_name": "promo_feb",
  "language": "en_US",
  "contact_ids": ["64abc123...", "64abc456..."],
  "filters": { "tag": "VIP" },
  "variable_mapping": {
    "1": { "type": "contact_field", "value": "name" },
    "2": { "type": "static", "value": "FlowZapp" }
  },
  "scheduled_at": null
}
```

**Response 200**

```json
{
  "status": "success",
  "campaign_id": "64abc123...",
  "message": "Campaign started in background"
}
```

---

#### GET /campaigns/{campaign_id}/logs

**Response 200**

```json
[
  {
    "contact_number": "919876543210",
    "contact_name": "Raj Kumar",
    "status": "sent",
    "message_id": "wamid.abc123...",
    "sent_at": "2024-01-15T10:31:02Z",
    "error": null
  }
]
```

---

## 8. Conversations (`/conversations`)

#### GET /conversations

**Query Parameters**

| Param             | Type   | Description                   |
| ----------------- | ------ | ----------------------------- |
| `phone_number_id` | string | Filter by source phone number |

**Response 200**

```json
[
  {
    "_id": "919876543210",
    "name": "Raj Kumar",
    "last_message": "Thanks for your help!",
    "last_timestamp": "2024-01-15T10:45:00Z",
    "direction": "incoming",
    "phone_number_id": "1234567890",
    "unread_count": 3
  }
]
```

---

#### GET /conversations/{number}/messages

**Path Parameter**: `number` — WhatsApp number (e.g. `919876543210`)

**Response 200**

```json
[
  {
    "_id": "64abc123...",
    "number": "919876543210",
    "body": "Hello! Can I get pricing info?",
    "direction": "incoming",
    "type": "text",
    "timestamp": "2024-01-15T10:44:00Z",
    "profile_name": "Raj Kumar"
  },
  {
    "_id": "64abc456...",
    "number": "919876543210",
    "body": "Hi Raj! Our pricing starts at ₹2,999/month.",
    "direction": "outgoing",
    "type": "template",
    "template_name": "pricing_info",
    "buttons": ["View Plans", "Talk to Sales"],
    "timestamp": "2024-01-15T10:44:30Z"
  }
]
```

---

#### POST /conversations/send

Send a direct WhatsApp message.

**Request Body**

```json
{
  "to": "919876543210",
  "message": "Hello! How can I help you today?",
  "phone_number_id": "1234567890"
}
```

**Response 200**

```json
{
  "status": "success",
  "message_id": "wamid.HBgLOTE5ODc2NTQz..."
}
```

---

## 9. Webhooks

| Method | Endpoint                             | Description                                                        |
| ------ | ------------------------------------ | ------------------------------------------------------------------ |
| `GET`  | `/webhook/{org_id}`                  | Meta verification challenge (returns `hub.challenge`)              |
| `POST` | `/webhook/{org_id}`                  | Receives all WhatsApp events for an org                            |
| `GET`  | `/webhook/{org_id}/phone/{phone_id}` | Phone-specific verification                                        |
| `POST` | `/webhook/{org_id}/phone/{phone_id}` | Phone-specific events                                              |
| `WS`   | `/ws/{org_id}`                       | WebSocket — real-time frontend push (new messages, status updates) |

**Configure in Meta**: Set webhook URL to `https://your-domain.com/webhook/{org_id}` with your `verify_token`.

---

## 10. External API (`/api/v1`)

> Use these endpoints for third-party integrations (n8n, Zapier, custom apps).  
> Auth: `Authorization: Bearer <access_token>` from `/auth/login`.

| Method | Endpoint                  | Description                                      |
| ------ | ------------------------- | ------------------------------------------------ |
| `GET`  | `/api/v1/templates`       | List approved templates                          |
| `POST` | `/api/v1/templates`       | Create template                                  |
| `GET`  | `/api/v1/contacts`        | List contacts (same query params as `/contacts`) |
| `POST` | `/api/v1/contacts`        | Create contact                                   |
| `POST` | `/api/v1/contacts/upload` | Upload CSV                                       |
| `GET`  | `/api/v1/campaigns`       | List campaigns                                   |
| `POST` | `/api/v1/campaigns`       | Create & send campaign                           |

Request/response structures are identical to their internal counterparts documented above.

---

## Common Error Responses

| Status | Meaning          | Example                                                                             |
| ------ | ---------------- | ----------------------------------------------------------------------------------- |
| `400`  | Bad Request      | `{ "detail": "Email already registered" }`                                          |
| `401`  | Unauthorized     | `{ "detail": "Invalid email or password" }`                                         |
| `403`  | Forbidden        | `{ "detail": "Admin access required" }`                                             |
| `404`  | Not Found        | `{ "detail": "Contact not found or not in your organization" }`                     |
| `422`  | Validation Error | `{ "detail": [{ "loc": ["body", "email"], "msg": "value is not a valid email" }] }` |
| `500`  | Server Error     | `{ "detail": "Internal server error" }`                                             |

---

## Sales Team (`/sales-team`)

#### GET /sales-team

**Response 200**

```json
[
  {
    "_id": "64abc123...",
    "name": "Priya Sharma",
    "email": "priya@company.com",
    "phone": "919876543210",
    "organization_id": "64abc456...",
    "created_at": "2024-01-10T00:00:00Z"
  }
]
```

---

#### POST /sales-team

**Request Body**

```json
{
  "name": "Priya Sharma",
  "email": "priya@company.com",
  "phone": "919876543210"
}
```

**Response 200**

```json
{ "status": "success", "member_id": "64abc123..." }
```
