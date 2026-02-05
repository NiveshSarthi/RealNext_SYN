# WhatsApp Flow Builder - External API Documentation

## Overview

This API allows external applications to integrate with WhatsApp Flow Builder for managing templates, contacts, and campaigns.

**Base URL:** `https://ckk4swcsssos844w0ccos4og.72.61.248.175.sslip.io/api/v1`

---

## Quick Start: Complete Setup Workflow

This section guides you through the full setup process from super admin login to sending your first campaign.

### Step 1: Super Admin Login

Super admin credentials are configured in your `.env` file:

- `ADMIN_EMAIL` - Super admin email
- `ADMIN_PASSWORD` - Super admin password

**POST** `/auth/login`

```bash
curl -X POST https://your-domain.com/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "Admin@1234"
  }'
```

**Response:**

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

### Step 2: Create Organization + Admin

Use the super admin token to create a new organization with its first admin user.

**POST** `/super-admin/organizations`

```bash
curl -X POST https://your-domain.com/super-admin/organizations \
  -H "Authorization: Bearer SUPER_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Acme Corporation",
    "admin_email": "admin@acme.com",
    "admin_password": "SecurePassword123"
  }'
```

**Response:**

```json
{
  "status": "success",
  "message": "Organization created successfully",
  "organization_id": "60f7c123abc...",
  "admin_user_id": "60f7c456def..."
}
```

### Step 3: Admin Login

Login with the newly created admin credentials to get a token for that organization.

**POST** `/auth/login`

```bash
curl -X POST https://your-domain.com/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@acme.com",
    "password": "SecurePassword123"
  }'
```

### Step 4: Configure WhatsApp Credentials

Before sending messages, configure WhatsApp API credentials for the organization.

**POST** `/settings/whatsapp`

```bash
curl -X POST https://your-domain.com/settings/whatsapp \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "phone_number_id": "943988142125457",
    "whatsapp_token": "EAAaZAQOUjYaYBO...",
    "waba_id": "1594054638266272",
    "display_name": "Acme Support"
  }'
```

**Response:**

```json
{
  "status": "success",
  "message": "WhatsApp credentials saved"
}
```

> **Note:** Get these credentials from your [Meta Developer Portal](https://developers.facebook.com/) > WhatsApp > API Setup.

### Step 5: Start Using the API

Now you can use all the API endpoints with the admin token:

- Manage templates
- Create contacts
- Run campaigns

---

## Authentication

All endpoints require JWT Bearer token authentication.

### Getting a Token

**POST** `/auth/login`

```bash
curl -X POST https://your-domain.com/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "your-email@example.com",
    "password": "your-password"
  }'
```

**Response:**

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR...",
  "token_type": "bearer"
}
```

### Using the Token

Include the access token in all API requests:

```bash
curl https://your-domain.com/api/v1/templates \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Token Expiry

- **Access Token:** 30 minutes
- **Refresh Token:** 7 days

To refresh your token:

**POST** `/auth/refresh`

```bash
curl -X POST https://your-domain.com/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refresh_token": "YOUR_REFRESH_TOKEN"}'
```

---

## Super Admin Endpoints

These endpoints require super admin access (role: `super_admin`).

### List Organizations

**GET** `/super-admin/organizations`

| Parameter | Type | Description                            |
| --------- | ---- | -------------------------------------- |
| page      | int  | Page number (default: 1)               |
| limit     | int  | Items per page (default: 20, max: 100) |

```bash
curl https://your-domain.com/super-admin/organizations \
  -H "Authorization: Bearer SUPER_ADMIN_TOKEN"
```

### Create Organization

**POST** `/super-admin/organizations`

```bash
curl -X POST https://your-domain.com/super-admin/organizations \
  -H "Authorization: Bearer SUPER_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "New Company",
    "admin_email": "admin@newcompany.com",
    "admin_password": "SecurePass123"
  }'
```

### Update Organization

**PUT** `/super-admin/organizations/{org_id}`

```bash
curl -X PUT https://your-domain.com/super-admin/organizations/60f7c... \
  -H "Authorization: Bearer SUPER_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Company Name",
    "is_active": true
  }'
```

### Deactivate Organization

**DELETE** `/super-admin/organizations/{org_id}`

Soft-deletes the organization and all its users.

```bash
curl -X DELETE https://your-domain.com/super-admin/organizations/60f7c... \
  -H "Authorization: Bearer SUPER_ADMIN_TOKEN"
```

### Platform Statistics

**GET** `/super-admin/stats`

```bash
curl https://your-domain.com/super-admin/stats \
  -H "Authorization: Bearer SUPER_ADMIN_TOKEN"
```

**Response:**

```json
{
  "total_organizations": 15,
  "active_organizations": 12,
  "total_users": 45,
  "active_users": 40
}
```

---

## WhatsApp Settings

### Get WhatsApp Settings

**GET** `/settings/whatsapp`

```bash
curl https://your-domain.com/settings/whatsapp \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

**Response:**

```json
{
  "configured": true,
  "phone_number_id": "943988142125457",
  "whatsapp_token_masked": "...last10chars",
  "waba_id": "1594054638266272",
  "display_name": "My Business",
  "webhook_url": "https://your-domain.com/webhook/60f7c...",
  "webhook_verify_token": "auto_generated_token"
}
```

### Save WhatsApp Settings

**POST** `/settings/whatsapp`

| Field           | Type   | Required | Description                  |
| --------------- | ------ | -------- | ---------------------------- |
| phone_number_id | string | Yes      | Phone Number ID from Meta    |
| whatsapp_token  | string | Yes\*    | Permanent access token       |
| waba_id         | string | Yes      | WhatsApp Business Account ID |
| display_name    | string | No       | Business display name        |

\*If empty, preserves existing token.

```bash
curl -X POST https://your-domain.com/settings/whatsapp \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "phone_number_id": "943988142125457",
    "whatsapp_token": "EAAaZAQOUjYaYBO...",
    "waba_id": "1594054638266272",
    "display_name": "Acme Support"
  }'
```

---

## Templates

### List Templates

**GET** `/api/v1/templates`

Fetch all WhatsApp templates for your organization.

```bash
curl https://your-domain.com/api/v1/templates \
  -H "Authorization: Bearer TOKEN"
```

**Response:**

```json
[
  {
    "name": "hello_world",
    "status": "APPROVED",
    "category": "MARKETING",
    "language": "en_US",
    "components": [...]
  }
]
```

### Create Template

**POST** `/api/v1/templates`

```bash
curl -X POST https://your-domain.com/api/v1/templates \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "my_template",
    "category": "MARKETING",
    "language": "en_US",
    "components": [
      {
        "type": "BODY",
        "text": "Hello {{1}}, your order {{2}} is ready!"
      }
    ]
  }'
```

**Categories:** `MARKETING`, `UTILITY`, `AUTHENTICATION`

### Delete Template

**DELETE** `/api/v1/templates/{name}`

```bash
curl -X DELETE https://your-domain.com/api/v1/templates/my_template \
  -H "Authorization: Bearer TOKEN"
```

---

## Contacts

### List Contacts

**GET** `/api/v1/contacts`

| Parameter | Type   | Description                            |
| --------- | ------ | -------------------------------------- |
| page      | int    | Page number (default: 1)               |
| limit     | int    | Items per page (default: 20, max: 100) |
| search    | string | Search by name or number               |
| tag       | string | Filter by tag                          |

```bash
curl "https://your-domain.com/api/v1/contacts?page=1&limit=20&tag=lead" \
  -H "Authorization: Bearer TOKEN"
```

**Response:**

```json
{
  "contacts": [
    {
      "_id": "60f7c...",
      "name": "John Doe",
      "number": "919876543210",
      "tags": ["lead"]
    }
  ],
  "total": 150,
  "page": 1,
  "pages": 8
}
```

### Create Contact

**POST** `/api/v1/contacts`

```bash
curl -X POST https://your-domain.com/api/v1/contacts \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "number": "919876543210",
    "tags": ["lead", "new"]
  }'
```

### Upload Contacts (CSV)

**POST** `/api/v1/contacts/upload`

Upload a CSV file with contacts.

**CSV Format:**

```csv
name,number,tags
John Doe,919876543210,lead;new
Jane Smith,919876543211,customer
```

```bash
curl -X POST https://your-domain.com/api/v1/contacts/upload \
  -H "Authorization: Bearer TOKEN" \
  -F "file=@contacts.csv"
```

---

## Campaigns

### List Campaigns

**GET** `/api/v1/campaigns`

```bash
curl https://your-domain.com/api/v1/campaigns \
  -H "Authorization: Bearer TOKEN"
```

**Response:**

```json
[
  {
    "_id": "60f7c...",
    "template_name": "hello_world",
    "status": "completed",
    "total_contacts": 100,
    "stats": {
      "sent": 98,
      "delivered": 95,
      "read": 50,
      "failed": 2
    },
    "created_at": "2026-02-03T07:00:00Z"
  }
]
```

### Get Campaign Details

**GET** `/api/v1/campaigns/{campaign_id}`

```bash
curl https://your-domain.com/api/v1/campaigns/60f7c123... \
  -H "Authorization: Bearer TOKEN"
```

### Get Campaign Logs

**GET** `/api/v1/campaigns/{campaign_id}/logs`

| Parameter | Type   | Description                                     |
| --------- | ------ | ----------------------------------------------- |
| status    | string | Filter by status: sent, delivered, read, failed |

```bash
curl "https://your-domain.com/api/v1/campaigns/60f7c.../logs?status=failed" \
  -H "Authorization: Bearer TOKEN"
```

### Create Campaign

**POST** `/api/v1/campaigns`

Send messages immediately or schedule for later.

```bash
curl -X POST https://your-domain.com/api/v1/campaigns \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "template_name": "hello_world",
    "language_code": "en_US",
    "contact_ids": ["60f7c123...", "60f7c456..."],
    "variable_mapping": {
      "1": "{{name}}",
      "2": "Your order is ready"
    }
  }'
```

**Request Body:**

| Field            | Type   | Required | Description                               |
| ---------------- | ------ | -------- | ----------------------------------------- |
| template_name    | string | Yes      | Name of approved template                 |
| language_code    | string | No       | Default: "en_US"                          |
| contact_ids      | array  | No\*     | Specific contact IDs                      |
| filters          | object | No\*     | Filter contacts (e.g., `{"tag": "lead"}`) |
| variable_mapping | object | No       | Template variable values                  |
| schedule_time    | string | No       | ISO datetime for scheduling               |

\*Either `contact_ids` or `filters` must be provided.

**Variable Mapping Special Values:**

- `{{name}}` - Replaced with contact's name
- `{{number}}` - Replaced with contact's number
- Any other string - Used as-is

**Scheduling Example:**

```json
{
  "template_name": "promo_offer",
  "filters": { "tag": "subscriber" },
  "variable_mapping": { "1": "{{name}}" },
  "schedule_time": "2026-02-05T10:00:00Z"
}
```

---

## Error Responses

All errors follow this format:

```json
{
  "detail": "Error message here"
}
```

| Status Code | Description                             |
| ----------- | --------------------------------------- |
| 400         | Bad Request - Invalid input             |
| 401         | Unauthorized - Invalid or expired token |
| 403         | Forbidden - Insufficient permissions    |
| 404         | Not Found - Resource doesn't exist      |
| 500         | Server Error                            |

---

## Rate Limits

- **Login:** 5 requests per minute per IP
- **API calls:** 100 requests per minute per user

---

## Complete Workflow Example

### n8n / JavaScript Integration

```javascript
// 1. Super Admin Login (or Admin Login if org already exists)
const loginResponse = await $http.post("https://your-domain.com/auth/login", {
  email: "admin@example.com",
  password: "Admin@1234",
});
const superAdminToken = loginResponse.data.access_token;

// 2. Create new organization (Super Admin only)
const orgResponse = await $http.post(
  "https://your-domain.com/super-admin/organizations",
  {
    name: "New Client Corp",
    admin_email: "client@newcorp.com",
    admin_password: "ClientPass123",
  },
  {
    headers: { Authorization: `Bearer ${superAdminToken}` },
  },
);
console.log("Organization created:", orgResponse.data.organization_id);

// 3. Login as the new admin
const adminLogin = await $http.post("https://your-domain.com/auth/login", {
  email: "client@newcorp.com",
  password: "ClientPass123",
});
const adminToken = adminLogin.data.access_token;

// 4. Configure WhatsApp credentials
await $http.post(
  "https://your-domain.com/settings/whatsapp",
  {
    phone_number_id: "943988142125457",
    whatsapp_token: "EAAaZAQOUjYaYBO...",
    waba_id: "1594054638266272",
    display_name: "New Client Support",
  },
  {
    headers: { Authorization: `Bearer ${adminToken}` },
  },
);

// 5. Now use the API normally
const templates = await $http.get("https://your-domain.com/api/v1/templates", {
  headers: { Authorization: `Bearer ${adminToken}` },
});
```

### Python Example

```python
import requests

BASE_URL = "https://your-domain.com"

# 1. Super Admin Login
login_resp = requests.post(f"{BASE_URL}/auth/login", json={
    "email": "admin@example.com",
    "password": "Admin@1234"
})
super_admin_token = login_resp.json()["access_token"]

# 2. Create Organization
headers = {"Authorization": f"Bearer {super_admin_token}"}
org_resp = requests.post(f"{BASE_URL}/super-admin/organizations", json={
    "name": "Python Test Org",
    "admin_email": "python@test.com",
    "admin_password": "TestPass123"
}, headers=headers)
print(f"Org created: {org_resp.json()}")

# 3. Login as new admin
admin_login = requests.post(f"{BASE_URL}/auth/login", json={
    "email": "python@test.com",
    "password": "TestPass123"
})
admin_token = admin_login.json()["access_token"]

# 4. Configure WhatsApp
admin_headers = {"Authorization": f"Bearer {admin_token}"}
requests.post(f"{BASE_URL}/settings/whatsapp", json={
    "phone_number_id": "YOUR_PHONE_NUMBER_ID",
    "whatsapp_token": "YOUR_WHATSAPP_TOKEN",
    "waba_id": "YOUR_WABA_ID"
}, headers=admin_headers)

# 5. Start a campaign
campaign = requests.post(f"{BASE_URL}/api/v1/campaigns", json={
    "template_name": "hello_world",
    "filters": {"tag": "lead"},
    "variable_mapping": {"1": "{{name}}"}
}, headers=admin_headers)
print(f"Campaign started: {campaign.json()}")
```
