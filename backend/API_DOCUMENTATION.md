# Multi-Tenant SaaS Platform - API Documentation

## Base URL
```
Development: http://localhost:5000/api
Production: https://api.realnext.com/api
```

## Authentication

All API requests (except registration, login, and webhooks) require a valid JWT token in the Authorization header:

```
Authorization: Bearer <access_token>
```

### Getting Started

1. **Register** or **Login** to get tokens
2. Use `access_token` for API requests
3. Use `refresh_token` to get new access token when expired

---

## Authentication Endpoints

### Register
```http
POST /auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "company_name": "Acme Corp",
  "phone": "+919876543210",
  "password": "SecurePass123"
}
```

**Response 201:**
```json
{
  "success": true,
  "data": {
    "user": { "id": "uuid", "name": "John Doe", "email": "john@example.com" },
    "tenant": { "id": "uuid", "name": "Acme Corp" },
    "access_token": "eyJhbGc...",
    "refresh_token": "eyJhbGc..."
  }
}
```

### Login
```http
POST /auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "SecurePass123"
}
```

### Refresh Token
```http
POST /auth/refresh
Content-Type: application/json

{
  "refresh_token": "eyJhbGc..."
}
```

### Get Profile
```http
GET /auth/me
Authorization: Bearer <token>
```

---

## Super Admin APIs

**Required Role:** `is_super_admin = true`

### Partners

#### List Partners
```http
GET /admin/partners?page=1&limit=20&search=acme
```

#### Create Partner
```http
POST /admin/partners
Content-Type: application/json

{
  "name": "Acme Resellers",
  "email": "admin@acme.com",
  "subdomain": "acme",
  "commission_rate": 15.5
}
```

#### Update Partner
```http
PUT /admin/partners/:id
Content-Type: application/json

{
  "status": "active",
  "commission_rate": 20
}
```

### Plans

#### List Plans
```http
GET /admin/plans
```

#### Create Plan
```http
POST /admin/plans
Content-Type: application/json

{
  "code": "enterprise_plus",
  "name": "Enterprise Plus",
  "price_monthly": 29999,
  "price_yearly": 299990,
  "trial_days": 30,
  "is_public": true
}
```

#### Assign Features to Plan
```http
PUT /admin/plans/:planId/features
Content-Type: application/json

{
  "features": [
    { "feature_id": "uuid", "limits": { "max_leads": 10000 } },
    { "feature_id": "uuid", "limits": { "max_campaigns": 50 } }
  ]
}
```

### Analytics
```http
GET /admin/analytics/overview
GET /admin/analytics/revenue
GET /admin/analytics/tenants
```

---

## Partner Admin APIs

**Required Role:** Partner Admin/Team Member

### Tenant Management

#### List Partner's Tenants
```http
GET /partner/tenants?status=active&search=company
```

#### Create Tenant
```http
POST /partner/tenants
Content-Type: application/json

{
  "name": "Client Corp",
  "email": "admin@client.com",
  "phone": "+919876543210",
  "plan_id": "uuid",
  "owner_email": "owner@client.com",
  "owner_name": "Jane Smith"
}
```

#### Assign Subscription
```http
PUT /partner/tenants/:tenantId/subscription
Content-Type: application/json

{
  "plan_id": "uuid",
  "billing_cycle": "yearly"
}
```

### Partner Stats
```http
GET /partner/stats
```

**Response:**
```json
{
  "success": true,
  "data": {
    "tenants": { "total": 45, "active": 42, "new_this_month": 8 },
    "subscriptions": { "active": 38, "trial": 7 },
    "revenue": { "total": 850000, "commission_rate": 15, "estimated_commission": 127500 }
  }
}
```

---

## Tenant APIs

### Settings

#### Get Tenant Profile
```http
GET /tenant/profile
```

#### Update Settings
```http
PUT /tenant/settings
Content-Type: application/json

{
  "timezone": "Asia/Kolkata",
  "settings": {
    "whatsapp_number": "+919876543210",
    "business_hours": { "start": "09:00", "end": "18:00" }
  }
}
```

### Team Management

#### List Users
```http
GET /tenant/users
```

#### Invite User
```http
POST /tenant/users
Content-Type: application/json

{
  "email": "newuser@company.com",
  "name": "New User",
  "role": "user",
  "permissions": ["leads.view", "campaigns.create"]
}
```

### Subscription

#### Get Current Subscription
```http
GET /tenant/subscription
```

#### Upgrade Plan
```http
POST /tenant/subscription/upgrade
Content-Type: application/json

{
  "plan_id": "uuid"
}
```

---

## Feature Module APIs

### Workflows

#### List Workflows
```http
GET /workflows?status=active
```

#### Create Workflow
```http
POST /workflows
Content-Type: application/json

{
  "name": "Welcome Automation",
  "description": "Send welcome message to new leads",
  "active": false,
  "nodes": []
}
```

#### Activate/Deactivate
```http
POST /workflows/:id/activate
POST /workflows/:id/deactivate
```

#### Trigger Workflow
```http
POST /workflows/trigger/lead-qualification
Content-Type: application/json

{
  "lead_id": "uuid",
  "data": { "score": 85 }
}
```

### Analytics

#### Dashboard
```http
GET /analytics/dashboard
```

**Response:**
```json
{
  "success": true,
  "data": {
    "leads": { "total": 5420, "new_30_days": 380, "growth": 7.0 },
    "campaigns": { "active": 12 },
    "workflows": { "active": 8 },
    "messages": { "sent": 1250, "delivered": 1200, "read": 980 }
  }
}
```

#### Campaign Analytics
```http
GET /analytics/campaigns?from=2024-01-01&to=2024-01-31
```

### Network (Agent Connections)

#### Search Agents
```http
GET /network/search?query=real estate mumbai
```

#### Send Connection Request
```http
POST /network/connect/:tenantId
Content-Type: application/json

{
  "message": "Hi, I'd like to connect for referral opportunities"
}
```

#### Accept/Reject Requests
```http
POST /network/accept/:connectionId
POST /network/reject/:connectionId
```

### Quick Replies

#### List Quick Replies
```http
GET /quick-replies?category=greetings
```

#### Create Quick Reply
```http
POST /quick-replies
Content-Type: application/json

{
  "shortcut": "/intro",
  "title": "Company Introduction",
  "content": "Hello! I'm from Realnext, India's leading real estate platform...",
  "category": "greetings"
}
```

#### Process Shortcut
```http
POST /quick-replies/process
Content-Type: application/json

{
  "message": "Hi! /intro"
}
```

**Response:**
```json
{
  "success": true,
  "data": "Hi! Hello! I'm from Realnext, India's leading real estate platform...",
  "match": { "id": "uuid", "shortcut": "/intro", "title": "Company Introduction" }
}
```

### Catalog

#### List Items
```http
GET /catalog?category=residential&status=active
```

#### Create Item
```http
POST /catalog
Content-Type: application/json

{
  "name": "3BHK Apartment in Andheri",
  "description": "Spacious 3BHK with sea view",
  "category": "residential",
  "price": 15000000,
  "currency": "INR",
  "properties": {
    "bedrooms": 3,
    "bathrooms": 2,
    "area_sqft": 1500
  },
  "images": ["url1", "url2"]
}
```

#### Sync to WhatsApp
```http
POST /catalog/:id/sync
```

### LMS (Learning Management)

#### List Modules
```http
GET /lms/modules
```

#### Get Progress
```http
GET /lms/progress
```

#### Complete Module
```http
POST /lms/complete-module
Content-Type: application/json

{
  "module_id": 1,
  "lesson_id": 3
}
```

### Meta Ads

#### List Campaigns
```http
GET /meta-ads/campaigns
```

#### Create Campaign
```http
POST /meta-ads/campaigns
Content-Type: application/json

{
  "name": "Q1 Lead Generation",
  "budget": 50000,
  "objective": "LEAD_GENERATION"
}
```

#### Get Leads
```http
GET /meta-ads/leads?campaign_id=camp_123&date_from=2024-01-01
```

#### Analytics
```http
GET /meta-ads/analytics
```

---

## Payments (Razorpay)

### Verify Payment
```http
POST /payments/verify
Content-Type: application/json

{
  "razorpay_order_id": "order_xxx",
  "razorpay_payment_id": "pay_xxx",
  "razorpay_signature": "signature_xxx"
}
```

### Webhook (Razorpay)
```http
POST /payments/webhook/razorpay
Content-Type: application/json
X-Razorpay-Signature: <signature>

{
  "event": "payment.captured",
  "payload": { ... }
}
```

---

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "error": "Validation failed",
  "details": [
    { "field": "email", "message": "Invalid email format" }
  ]
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "error": "Invalid or expired token"
}
```

### 403 Forbidden
```json
{
  "success": false,
  "error": "Insufficient permissions"
}
```

### 404 Not Found
```json
{
  "success": false,
  "error": "Resource not found"
}
```

### 429 Too Many Requests
```json
{
  "success": false,
  "error": "Rate limit exceeded. Try again in 60 seconds"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "error": "Internal server error",
  "message": "An unexpected error occurred"
}
```

---

## Rate Limiting

- **Authentication endpoints**: 5 requests per minute per IP
- **General API**: 100 requests per minute per user
- **Webhooks**: No rate limit

---

## Pagination

List endpoints support pagination:

```http
GET /endpoint?page=1&limit=20
```

**Response:**
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

---

## Filtering & Sorting

```http
GET /leads?status=new&source=facebook&sort=created_at&order=desc
```

Common filters:
- `status` - Filter by status
- `search` - Search across multiple fields
- `from`, `to` - Date range filters
- `sort`, `order` - Sorting

---

## Feature Gates

Access to feature modules is controlled by subscription plans. If a feature is not included in your plan:

```json
{
  "success": false,
  "error": "Feature not available in your plan",
  "feature": "workflows",
  "upgrade_url": "/tenant/subscription"
}
```

---

## Testing Credentials

### Super Admin
- Email: `admin@realnext.com`
- Password: `RealnextAdmin2024!debug`

### Test Tenant (after registration)
- Create via `/auth/register`
- Automatically gets 14-day trial
