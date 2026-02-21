# WhatsApp Flow Builder API Documentation

## Base URL

`https://wfb.backend.niveshsarthi.com` (Production)
`http://localhost:8000` (Local)

---

## 1. Authentication (`/auth`)

**Tags**: `auth`

| Method | Endpoint                | Description                               | Auth Required            |
| :----- | :---------------------- | :---------------------------------------- | :----------------------- |
| `POST` | `/auth/signup`          | Register a new organization & admin.      | No                       |
| `POST` | `/auth/login`           | Login to get JWT access token.            | No                       |
| `POST` | `/auth/refresh`         | Refresh access token using refresh token. | Start with Refresh Token |
| `POST` | `/auth/forgot-password` | Request password reset email.             | No                       |
| `POST` | `/auth/reset-password`  | Reset password using token.               | No                       |
| `GET`  | `/auth/me`              | Get current user profile.                 | Yes                      |

---

## 2. Super Admin (`/super-admin`)

**Tags**: `super-admin`
**Requires**: Super Admin Role

| Method   | Endpoint                                     | Description                                 |
| :------- | :------------------------------------------- | :------------------------------------------ |
| `POST`   | `/super-admin/login`                         | Super Admin specific login.                 |
| `GET`    | `/super-admin/dashboard`                     | Get high-level stats (total orgs, revenue). |
| `GET`    | `/super-admin/organizations`                 | List all organizations.                     |
| `POST`   | `/super-admin/organizations`                 | Create a new organization manually.         |
| `GET`    | `/super-admin/organizations/{org_id}`        | Get specific organization details.          |
| `PUT`    | `/super-admin/organizations/{org_id}/status` | Suspend/Activate organization.              |
| `DELETE` | `/super-admin/organizations/{org_id}`        | Delete organization (Soft delete).          |
| `POST`   | `/super-admin/admins`                        | Create a new admin user manually.           |

---

## 3. Organization Admin

### Team & Access (`/admin`)

**Tags**: `admin`
**Requires**: Admin Role

| Method   | Endpoint                      | Description                          |
| :------- | :---------------------------- | :----------------------------------- |
| `GET`    | `/admin/access-list`          | Get list of invited emails.          |
| `POST`   | `/admin/access-list`          | Invite a new user (marketing/sales). |
| `DELETE` | `/admin/access-list/{email}`  | Revoke invitation.                   |
| `PUT`    | `/admin/users/{user_id}/role` | Update a user's role.                |
| `GET`    | `/admin/team`                 | List all team members.               |

### Settings (`/settings`)

**Tags**: `settings`
**Requires**: Admin Role

| Method   | Endpoint             | Description                          |
| :------- | :------------------- | :----------------------------------- |
| `GET`    | `/settings/whatsapp` | Get WhatsApp API credentials status. |
| `POST`   | `/settings/whatsapp` | Save WhatsApp API credentials.       |
| `DELETE` | `/settings/whatsapp` | Remove WhatsApp credentials.         |
| `GET`    | `/settings/openai`   | Get OpenAI API key status.           |
| `POST`   | `/settings/openai`   | Save OpenAI API key.                 |
| `DELETE` | `/settings/openai`   | Remove OpenAI API key.               |

### Phone Numbers (`/phone-numbers`)

**Tags**: `phone-numbers`
**Requires**: Admin Role

| Method   | Endpoint                    | Description                                          |
| :------- | :-------------------------- | :--------------------------------------------------- |
| `GET`    | `/phone-numbers`            | List all configured phone numbers.                   |
| `POST`   | `/phone-numbers`            | Add a new additional phone number.                   |
| `GET`    | `/phone-numbers/list`       | Get dropdown list of all phones (Accessible to all). |
| `GET`    | `/phone-numbers/{phone_id}` | Get details of a specific phone number.              |
| `PUT`    | `/phone-numbers/{phone_id}` | Update phone config (Flow/Bot assignment).           |
| `DELETE` | `/phone-numbers/{phone_id}` | Remove a phone number.                               |

### Sales Team (`/sales-team`)

**Tags**: `sales-team`

| Method   | Endpoint                  | Description                  |
| :------- | :------------------------ | :--------------------------- |
| `GET`    | `/sales-team`             | List sales team members.     |
| `POST`   | `/sales-team`             | Add a new sales team member. |
| `DELETE` | `/sales-team/{member_id}` | Remove a sales team member.  |

---

## 4. Plans & Billing

### Plans (`/plans`)

**Tags**: `plans`

| Method | Endpoint           | Description                        |
| :----- | :----------------- | :--------------------------------- |
| `GET`  | `/plans`           | List available subscription plans. |
| `GET`  | `/plans/{plan_id}` | Get plan details.                  |
| `POST` | `/plans`           | Create a new plan (Super Admin).   |
| `PUT`  | `/plans/{plan_id}` | Update a plan (Super Admin).       |

### Billing (`/billing`)

**Tags**: `billing`

| Method | Endpoint                 | Description                           |
| :----- | :----------------------- | :------------------------------------ |
| `POST` | `/create-subscription`   | Create Razorpay subscription.         |
| `POST` | `/verify-payment`        | Verify Razorpay payment signature.    |
| `GET`  | `/current-subscription`  | Get current org subscription status.  |
| `POST` | `/cancel-subscription`   | Cancel current subscription.          |
| `GET`  | `/invoices`              | List billing invoices.                |
| `GET`  | `/credit-packs`          | List available AI credit packs.       |
| `POST` | `/buy-credits`           | Purchase AI credits (Razorpay order). |
| `POST` | `/verify-credit-payment` | Verify credit purchase payment.       |

### Billing Admin (`/admin/ai-models`, `/admin/credit-packs`)

**Tags**: `billing-admin`
**Requires**: Super Admin Role

| Method | Endpoint                             | Description                               |
| :----- | :----------------------------------- | :---------------------------------------- |
| `GET`  | `/admin/ai-models`                   | List AI model pricing.                    |
| `PUT`  | `/admin/ai-models/{model_id}`        | Update AI model pricing.                  |
| `GET`  | `/admin/credit-packs`                | List credit packs.                        |
| `POST` | `/admin/credit-packs`                | Create credit pack.                       |
| `PUT`  | `/admin/credit-packs/{pack_id}`      | Update credit pack.                       |
| `GET`  | `/admin/orgs/billing`                | View all orgs credit/subscription status. |
| `POST` | `/admin/orgs/{org_id}/grant-credits` | Manually grant credits.                   |

---

## 5. Automation & AI

### Flows (`/flows`)

**Tags**: `flows`

| Method   | Endpoint           | Description                   |
| :------- | :----------------- | :---------------------------- |
| `GET`    | `/flows`           | List all flows.               |
| `POST`   | `/flows`           | Create a new flow.            |
| `GET`    | `/flows/{flow_id}` | Get flow details & structure. |
| `PUT`    | `/flows/{flow_id}` | Update flow structure.        |
| `DELETE` | `/flows/{flow_id}` | Delete a flow.                |

### Bots (`/bots`)

**Tags**: `bots`

| Method   | Endpoint              | Description                     |
| :------- | :-------------------- | :------------------------------ |
| `GET`    | `/bots`               | List all AI bots.               |
| `POST`   | `/bots`               | Create a new AI bot.            |
| `GET`    | `/bots/{bot_id}`      | Get bot details.                |
| `PUT`    | `/bots/{bot_id}`      | Update bot configuration.       |
| `DELETE` | `/bots/{bot_id}`      | Delete a bot.                   |
| `POST`   | `/bots/{bot_id}/test` | Test bot response (chat).       |
| `POST`   | `/bots/test-preview`  | Test bot config without saving. |

### Knowledge Bases (`/knowledge-bases`)

**Tags**: `knowledge-bases`

| Method   | Endpoint                                      | Description                  |
| :------- | :-------------------------------------------- | :--------------------------- |
| `GET`    | `/knowledge-bases`                            | List knowledge bases.        |
| `POST`   | `/knowledge-bases`                            | Create a new knowledge base. |
| `GET`    | `/knowledge-bases/{kb_id}`                    | Get KB details.              |
| `PUT`    | `/knowledge-bases/{kb_id}`                    | Update KB details.           |
| `DELETE` | `/knowledge-bases/{kb_id}`                    | Delete KB.                   |
| `POST`   | `/knowledge-bases/{kb_id}/upload`             | Upload document to KB.       |
| `GET`    | `/knowledge-bases/{kb_id}/documents`          | List documents in KB.        |
| `DELETE` | `/knowledge-bases/{kb_id}/documents/{doc_id}` | Delete document from KB.     |

---

## 6. Marketing & Messaging

### Campaigns (`/campaigns`)

| Method | Endpoint                        | Description                         |
| :----- | :------------------------------ | :---------------------------------- |
| `GET`  | `/campaigns`                    | List campaign history.              |
| `POST` | `/campaigns/send`               | Create & start/schedule a campaign. |
| `GET`  | `/campaigns/{campaign_id}/logs` | Get logs for a specific campaign.   |

### Contacts (`/contacts`)

| Method | Endpoint                    | Description              |
| :----- | :-------------------------- | :----------------------- |
| `GET`  | `/contacts`                 | List/Search contacts.    |
| `POST` | `/contacts`                 | Create a new contact.    |
| `POST` | `/upload-contacts`          | Upload contacts via CSV. |
| `GET`  | `/upload-contacts/template` | Download CSV template.   |

### Templates (`/templates`)

| Method   | Endpoint                  | Description                        |
| :------- | :------------------------ | :--------------------------------- |
| `GET`    | `/templates`              | Sync & List templates from Meta.   |
| `POST`   | `/templates`              | Create a new template on Meta.     |
| `DELETE` | `/templates/{name}`       | Delete a template on Meta.         |
| `POST`   | `/templates/upload-media` | Upload media for template headers. |

### Conversations (`/conversations`)

| Method | Endpoint                           | Description                     |
| :----- | :--------------------------------- | :------------------------------ |
| `GET`  | `/conversations`                   | List active conversations.      |
| `GET`  | `/conversations/{number}/messages` | Get message history for a user. |
| `POST` | `/conversations/send`              | Send a direct 1-on-1 message.   |

---

## 7. External API (`/api/v1`)

**Tags**: `external-api`
**Auth**: Bearer Token (Get via `/auth/login`)

| Method | Endpoint                  | Description          |
| :----- | :------------------------ | :------------------- |
| `GET`  | `/api/v1/templates`       | List templates.      |
| `POST` | `/api/v1/templates`       | Create template.     |
| `GET`  | `/api/v1/contacts`        | List contacts.       |
| `POST` | `/api/v1/contacts`        | Create contact.      |
| `POST` | `/api/v1/contacts/upload` | Upload contacts CSV. |
| `GET`  | `/api/v1/campaigns`       | List campaigns.      |
| `POST` | `/api/v1/campaigns`       | Create campaign.     |

---

## 8. Webhooks

**Base**: `{BACKEND_URL}`

| Method | Endpoint                             | Description                                         |
| :----- | :----------------------------------- | :-------------------------------------------------- |
| `GET`  | `/webhook`                           | Global Verify Token check (Legacy).                 |
| `POST` | `/webhook`                           | Global Webhook Event handler (Legacy).              |
| `GET`  | `/webhook/{org_id}`                  | **Org-Specific Verify**. Used in Meta App.          |
| `POST` | `/webhook/{org_id}`                  | **Org-Specific Webhook**. Receives messages/status. |
| `GET`  | `/webhook/{org_id}/phone/{phone_id}` | **Phone-Specific Verify**. Granular verification.   |
| `POST` | `/webhook/{org_id}/phone/{phone_id}` | **Phone-Specific Webhook**.                         |
| `WS`   | `/ws/{org_id}`                       | WebSocket for real-time frontend updates.           |
