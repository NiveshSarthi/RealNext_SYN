# Role Verification & Testing Guide

This guide provides step-by-step instructions for testing all user roles in the multi-tenant SaaS platform.

---

## Prerequisites

- Backend server running on `http://localhost:5000`
- Frontend server running on `http://localhost:3000`
- Database seeded with plans (`node scripts/seedPlans.js`)
- API client (Postman, Insomnia, or curl)

---

## 1. Super Admin Verification

### 1.1 Login as Super Admin

**Expected Behavior:** Redirect to `/admin` dashboard

```bash
# Using curl
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@realnext.com",
    "password": "RealnextAdmin2024!debug"
  }'
```

Save the `access_token` from response.

### 1.2 Test Partner CRUD

**Create Partner**
```bash
curl -X POST http://localhost:5000/api/admin/partners \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Acme Resellers",
    "email": "partner@acme.com",
    "subdomain": "acme",
    "commission_rate": 15.5
  }'
```

✅ **Verify:** Partner created successfully  
✅ **Check:** Partner appears in partner list  
✅ **Test:** Update partner details  
✅ **Test:** Change partner status

**List Partners**
```bash
curl http://localhost:5000/api/admin/partners \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 1.3 Test Plan CRUD

**List Plans**
```bash
curl http://localhost:5000/api/admin/plans \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

✅ **Verify:** 4 seeded plans visible (Free Trial, Starter, Professional, Enterprise)

**Create Custom Plan**
```bash
curl -X POST http://localhost:5000/api/admin/plans \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "custom_plan",
    "name": "Custom Enterprise",
    "price_monthly": 29999,
    "price_yearly": 299990,
    "trial_days": 30,
    "is_public": false
  }'
```

### 1.4 Test Tenant Management

**List All Tenants (System-wide)**
```bash
curl http://localhost:5000/api/admin/tenants \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Update Tenant Status**
```bash
curl -X PUT http://localhost:5000/api/admin/tenants/TENANT_ID \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "active"}'
```

### 1.5 Test Analytics

**Platform Analytics**
```bash
curl http://localhost:5000/api/admin/analytics/overview \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

✅ **Verify:** Stats show total partners, tenants, revenue

---

## 2. Partner Admin Verification

### 2.1 Create Partner Admin User

**Option A: Via Super Admin API**
```bash
# Get partner ID from previous step
curl -X POST http://localhost:5000/api/admin/partners/PARTNER_ID/users \
  -H "Authorization: Bearer SUPER_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@acme.com",
    "name": "Partner Admin",
    "password": "PartnerPass123!",
    "role": "admin"
  }'
```

**Option B: Manual Database Insert**
```sql
-- Create user
INSERT INTO users (id, email, name, password_hash, status)
VALUES (gen_random_uuid(), 'admin@acme.com', 'Partner Admin', '$2a$10$...', 'active');

-- Link to partner
INSERT INTO partner_users (partner_id, user_id, role, is_owner)
VALUES ('partner_uuid', 'user_uuid', 'admin', true);
```

### 2.2 Login as Partner Admin

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@acme.com",
    "password": "PartnerPass123!"
  }'
```

✅ **Verify:** Login successful  
✅ **Verify:** Token contains `partner_id`  
✅ **Expected Redirect:** `/partner/dashboard`

### 2.3 Test Partner Dashboard

**Get Partner Profile**
```bash
curl http://localhost:5000/api/partner/profile \
  -H "Authorization: Bearer PARTNER_TOKEN"
```

**Get Partner Stats**
```bash
curl http://localhost:5000/api/partner/stats \
  -H "Authorization: Bearer PARTNER_TOKEN"
```

✅ **Verify:** Stats show partner's tenants, subscriptions, revenue

### 2.4 Test Tenant Onboarding

**Create Tenant (as Partner)**
```bash
curl -X POST http://localhost:5000/api/partner/tenants \
  -H "Authorization: Bearer PARTNER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Client Corp",
    "email": "admin@client.com",
    "phone": "+919876543210",
    "plan_id": "STARTER_PLAN_UUID",
    "owner_email": "owner@client.com",
    "owner_name": "Jane Smith"
  }'
```

✅ **Verify:** Tenant created under this partner  
✅ **Verify:** Subscription assigned  
✅ **Verify:** Owner user created

**List Partner's Tenants**
```bash
curl http://localhost:5000/api/partner/tenants \
  -H "Authorization: Bearer PARTNER_TOKEN"
```

✅ **Verify:** Only shows tenants belonging to this partner  
✅ **Verify:** Cannot see other partners' tenants

### 2.5 Test Subscription Assignment

**Assign Plan to Tenant**
```bash
curl -X PUT http://localhost:5000/api/partner/tenants/TENANT_ID/subscription \
  -H "Authorization: Bearer PARTNER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "plan_id": "PROFESSIONAL_PLAN_UUID",
    "billing_cycle": "yearly"
  }'
```

✅ **Verify:** Subscription updated  
✅ **Verify:** Previous subscription marked as cancelled

---

## 3. Tenant Admin Verification

### 3.1 Test Registration Flow (Self-Serve)

**Frontend:** Navigate to `/auth/register`

**API Request:**
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@newcompany.com",
    "company_name": "New Company Ltd",
    "phone": "+919876543210",
    "password": "SecurePass123!"
  }'
```

✅ **Verify:** User created  
✅ **Verify:** Tenant created  
✅ **Verify:** Trial subscription assigned (14 days)  
✅ **Verify:** Access token returned  
✅ **Expected Redirect:** `/dashboard`

### 3.2 Test Dashboard Access

**Login as Tenant Admin**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@newcompany.com",
    "password": "SecurePass123!"
  }'
```

**Get Dashboard Data**
```bash
curl http://localhost:5000/api/analytics/dashboard \
  -H "Authorization: Bearer TENANT_TOKEN"
```

✅ **Verify:** Dashboard loads with tenant-specific data  
✅ **Verify:** Shows leads, campaigns, workflows metrics

### 3.3 Test Settings & Team Management

**View Tenant Profile**
```bash
curl http://localhost:5000/api/tenant/profile \
  -H "Authorization: Bearer TENANT_TOKEN"
```

**Update Settings**
```bash
curl -X PUT http://localhost:5000/api/tenant/settings \
  -H "Authorization: Bearer TENANT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "timezone": "Asia/Kolkata",
    "settings": {
      "whatsapp_number": "+919876543210"
    }
  }'
```

**Invite Team Member**
```bash
curl -X POST http://localhost:5000/api/tenant/users \
  -H "Authorization: Bearer TENANT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "member@newcompany.com",
    "name": "Team Member",
    "role": "user"
  }'
```

✅ **Verify:** User invited  
✅ **Verify:** Email notification sent (if configured)

### 3.4 Test Feature Access

**Test Workflows**
```bash
curl http://localhost:5000/api/workflows \
  -H "Authorization: Bearer TENANT_TOKEN"
```

✅ **Verify:** Can access if feature in plan  
✅ **Verify:** 403 error if feature not in plan

**Test Quick Replies**
```bash
curl http://localhost:5000/api/quick-replies \
  -H "Authorization: Bearer TENANT_TOKEN"
```

### 3.5 Test Subscription Upgrade

**View Current Plan**
```bash
curl http://localhost:5000/api/tenant/subscription \
  -H "Authorization: Bearer TENANT_TOKEN"
```

**Upgrade to Professional**
```bash
curl -X POST http://localhost:5000/api/tenant/subscription/upgrade \
  -H "Authorization: Bearer TENANT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "plan_id": "PROFESSIONAL_PLAN_UUID"
  }'
```

✅ **Verify:** Subscription upgraded  
✅ **Verify:** Can now access previously locked features

---

## 4. Tenant User Verification

### 4.1 Create Tenant User

**As Tenant Admin:**
```bash
curl -X POST http://localhost:5000/api/tenant/users \
  -H "Authorization: Bearer TENANT_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@newcompany.com",
    "name": "Regular User",
    "role": "user",
    "permissions": ["leads.view", "campaigns.view"]
  }'
```

### 4.2 Login as Tenant User

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@newcompany.com",
    "password": "TempPass123!"
  }'
```

✅ **Expected Redirect:** `/dashboard` (limited access)

### 4.3 Test Access Restrictions

**Try to Access Tenant Settings (Should Fail)**
```bash
curl http://localhost:5000/api/tenant/settings \
  -H "Authorization: Bearer USER_TOKEN"
```

✅ **Verify:** 403 Forbidden (insufficient permissions)

**Try to Create Team Members (Should Fail)**
```bash
curl -X POST http://localhost:5000/api/tenant/users \
  -H "Authorization: Bearer USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"email": "another@test.com", "name": "Test"}'
```

✅ **Verify:** 403 Forbidden

**Access Allowed Features**
```bash
# Can view leads
curl http://localhost:5000/api/leads \
  -H "Authorization: Bearer USER_TOKEN"

# Can view campaigns
curl http://localhost:5000/api/campaigns \
  -H "Authorization: Bearer USER_TOKEN"
```

✅ **Verify:** Can access features within permissions

---

## 5. Role-Based Redirect Testing

### Frontend Testing Checklist

#### Super Admin
- [ ] Login redirects to `/admin`
- [ ] Can access `/admin/partners`
- [ ] Can access `/admin/plans`
- [ ] Can access `/admin/tenants`
- [ ] Cannot access tenant-specific pages

#### Partner Admin
- [ ] Login redirects to `/partner`
- [ ] Can access `/partner/tenants`
- [ ] Can access `/partner/dashboard`
- [ ] Cannot access super admin pages
- [ ] Cannot access other partners' data

#### Tenant Admin
- [ ] Login/Registration redirects to `/dashboard`
- [ ] Can access `/settings`
- [ ] Can access `/team`
- [ ] Can access all feature modules (if in plan)
- [ ] Can manage team members

#### Tenant User
- [ ] Login redirects to `/dashboard`
- [ ] Cannot access `/settings`
- [ ] Cannot access `/team`
- [ ] Can only access permitted features
- [ ] Limited navigation menu

---

## 6. Data Isolation Testing

### Test Tenant Scoping

**As Tenant A Admin:** Create lead
```bash
curl -X POST http://localhost:5000/api/leads \
  -H "Authorization: Bearer TENANT_A_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Lead from Tenant A",
    "email": "lead@tenantA.com",
    "phone": "+919876543211"
  }'
```

**As Tenant B Admin:** List leads
```bash
curl http://localhost:5000/api/leads \
  -H "Authorization: Bearer TENANT_B_TOKEN"
```

✅ **Verify:** Tenant B cannot see Tenant A's lead  
✅ **Verify:** Each tenant sees only their own data

### Test Partner Scoping

**As Partner A Admin:** List tenants
```bash
curl http://localhost:5000/api/partner/tenants \
  -H "Authorization: Bearer PARTNER_A_TOKEN"
```

✅ **Verify:** Only shows Partner A's tenants  
✅ **Verify:** Cannot see Partner B's tenants

---

## 7. Feature Gate Testing

### Test with Trial Plan

**As New Tenant (Trial):**
```bash
# Should work - Leads are in trial
curl http://localhost:5000/api/leads \
  -H "Authorization: Bearer TRIAL_TOKEN"

# Should work - Workflows are in trial
curl http://localhost:5000/api/workflows \
  -H "Authorization: Bearer TRIAL_TOKEN"
```

### Test with Starter Plan

**Upgrade to Starter, then test:**
```bash
# Should work - Leads in starter
curl http://localhost:5000/api/leads \
  -H "Authorization: Bearer STARTER_TOKEN"

# May fail - Meta Ads only in Professional+
curl http://localhost:5000/api/meta-ads/campaigns \
  -H "Authorization: Bearer STARTER_TOKEN"
```

✅ **Verify:** 403 error with upgrade message for unavailable features

---

## 8. Security Testing

### Test JWT Expiration

1. Login and get token
2. Wait for token to expire (1 hour)
3. Try to access protected endpoint

✅ **Verify:** 401 Unauthorized

### Test Refresh Token

```bash
curl -X POST http://localhost:5000/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refresh_token": "YOUR_REFRESH_TOKEN"}'
```

✅ **Verify:** New access token returned

### Test Rate Limiting

Make 100+ requests in 1 minute:
```bash
for i in {1..150}; do
  curl http://localhost:5000/api/leads -H "Authorization: Bearer TOKEN"
done
```

✅ **Verify:** 429 Too Many Requests after limit exceeded

---

## 9. Payment Flow Testing (Mock)

### Create Payment Order

```bash
curl -X POST http://localhost:5000/api/tenant/subscription/payment \
  -H "Authorization: Bearer TENANT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "plan_id": "PROFESSIONAL_PLAN_UUID",
    "billing_cycle": "yearly"
  }'
```

✅ **Verify:** Razorpay order created (mock)

### Verify Payment

```bash
curl -X POST http://localhost:5000/api/payments/verify \
  -H "Content-Type: application/json" \
  -d '{
    "razorpay_order_id": "order_xxx",
    "razorpay_payment_id": "pay_xxx",
    "razorpay_signature": "sig_xxx"
  }'
```

✅ **Verify:** Payment marked as completed (mock mode)

---

## 10. Automated Testing Script

Save as `test-roles.sh`:

```bash
#!/bin/bash

BASE_URL="http://localhost:5000/api"

echo "=== Testing Super Admin ==="
SUPER_TOKEN=$(curl -s -X POST $BASE_URL/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@realnext.com","password":"RealnextAdmin2024!debug"}' \
  | jq -r '.data.access_token')

echo "Token: $SUPER_TOKEN"
curl -s $BASE_URL/admin/partners -H "Authorization: Bearer $SUPER_TOKEN" | jq

echo "\n=== Testing Tenant Registration ==="
curl -s -X POST $BASE_URL/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name":"Test User",
    "email":"test@example.com",
    "company_name":"Test Corp",
    "phone":"+919876543210",
    "password":"TestPass123!"
  }' | jq

# Add more tests...
```

---

## Testing Checklist Summary

- [ ] Super Admin can manage partners
- [ ] Super Admin can manage plans
- [ ] Super Admin can view all tenants
- [ ] Partner Admin can onboard tenants
- [ ] Partner Admin can assign subscriptions
- [ ] Partner Admin sees only their tenants
- [ ] Tenant registration creates trial subscription
- [ ] Tenant Admin can access dashboard
- [ ] Tenant Admin can manage team
- [ ] Tenant User has restricted access
- [ ] Feature gates work correctly
- [ ] Data isolation per tenant confirmed
- [ ] Data isolation per partner confirmed
- [ ] Role-based redirects working
- [ ] JWT authentication functional
- [ ] Rate limiting active
- [ ] Payment webhooks handled (mock)

---

**All tests passed? ✅ System is ready for production!**
