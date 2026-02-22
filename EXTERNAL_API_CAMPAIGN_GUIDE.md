# External API Integration Guide: Campaigns & Contacts

This guide explains how an external application can integrate with the FlowZapp backend to automatically upload contacts and trigger WhatsApp campaigns.

## Overview

To run a campaign from an external app, follow these three steps:

1. **Authenticate**: Get a JWT Access Token.
2. **Setup Contacts**: Upload your target audience (usually with a unique tag).
3. **Execution**: Trigger the campaign using a template and filtering by the tag.

---

## 1. Authentication

All requests must be authenticated using a JWT token in the `Authorization` header.

### Endpoint: `POST /auth/login`

**Request Body:**

```json
{
  "email": "your_org_email@example.com",
  "password": "your_org_password"
}
```

**Response:**

```json
{
  "access_token": "eyJhbG...",
  "refresh_token": "...",
  "token_type": "bearer"
}
```

> [!IMPORTANT]
> Include this token in all subsequent requests: `Authorization: Bearer <access_token>`

---

## 2. Managing Contacts

Before running a campaign, you must ensure the contacts exist in the system. The most efficient way for campaigns is to upload them with a **batch tag**.

### Option A: Bulk Upload (CSV)

Upload a CSV file where contacts are automatically assigned to your organization.

**Endpoint:** `POST /api/v1/contacts/upload`
**Content-Type:** `multipart/form-data`

**Body:**

- `file`: (The .csv file)

**CSV Format:**

```csv
name,phone,tags
John Doe,919876543210,promo_batch_feb_22
Jane Smith,918877665544,promo_batch_feb_22
```

_Note: Using a unique tag like `promo_batch_feb_22` allows you to target only these contacts in the next step._

### Option B: Single Contact (JSON)

**Endpoint:** `POST /api/v1/contacts`
**Request Body:**

```json
{
  "name": "John Doe",
  "number": "919876543210",
  "tags": ["api_lead", "promo_batch_feb_22"]
}
```

### Option C: Retrieve Contact IDs

If you need to get a list of IDs for contacts you previously uploaded (e.g., to select a subset), use the list endpoint with a tag filter.

**Endpoint:** `GET /api/v1/contacts?tag=promo_batch_feb_22&limit=100`
**Response:**

```json
{
  "contacts": [
    {
      "id": "6999660a47...",
      "name": "John Doe",
      "number": "919876543210",
      "tags": ["promo_batch_feb_22"]
    }
  ],
  "total": 1,
  "page": 1
}
```

---

## 3. Running a Campaign

Once contacts are uploaded, you can trigger a campaign. You have two ways to target your audience:

1. **By Filters** (Recommended): Target everyone with a specific tag.
2. **By Contact IDs**: Provide an explicit list of MongoDB IDs.

### Step 3.1: Get Approved Templates

Check which templates are available to use.

**Endpoint:** `GET /api/v1/templates`
**Response Snippet:**

```json
[
  {
    "name": "welcome_message",
    "status": "APPROVED",
    "language": "en_US",
    "components": [...]
  }
]
```

### Step 3.2: Create & Start Campaign

Trigger the actual message blast.

**Endpoint:** `POST /api/v1/campaigns`
**Request Body (Targeting by Tag):**

```json
{
  "template_name": "welcome_message",
  "language_code": "en_US",
  "filters": {
    "tag": "promo_batch_feb_22"
  },
  "variable_mapping": {
    "1": "{{name}}"
  }
}
```

**Request Body (Targeting by Specific IDs):**

```json
{
  "template_name": "welcome_message",
  "language_code": "en_US",
  "contact_ids": ["6999660a47f26c61db0ae35a", "6999660a47f26c61db0ae35b"],
  "variable_mapping": {
    "1": "{{name}}"
  }
}
```

#### Fields Explained:

- `template_name`: The exact name of the approved template.
- `filters`: A dictionary to select your audience. `{"tag": "your_tag"}` is recommended.
- `variable_mapping`: Maps template placeholders `{{n}}` to contact data.
  - `"{{name}}"`: Replaced with the contact's name.
  - `"{{number}}"`: Replaced with the contact's phone number.
  - Any custom string.

---

## 4. Monitoring Progress

You can check the status and logs of your campaign.

### Get All Campaigns: `GET /api/v1/campaigns`

### Get Campaign Details: `GET /api/v1/campaigns/{campaign_id}`

### Get Detailed Logs: `GET /api/v1/campaigns/{campaign_id}/logs`

---

## Best Practices

1. **Normalization**: Phone numbers should include the country code without the `+` prefix (e.g., `91` for India).
2. **Template Status**: Only `APPROVED` templates can be used in campaigns.
3. **Drafting**: Use `filters` carefully to avoid sending to your entire contact list by mistake.
