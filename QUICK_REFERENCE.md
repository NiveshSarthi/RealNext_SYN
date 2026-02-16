# Synditech RealNext - Quick Reference Guide

## 🔑 Core Concepts

### Multi-Tenancy Model
```
App Instance (1)
  └── Super Admin User (1) - Has is_super_admin: true
        └── Client/Organization (Many)
             ├── Client Admin (User assigned to org)
             ├── Client Team Members (Users)
             └── Data (Isolated by client_id)
```

### User Context Flow
```
User → ClientUser → Client → Subscription → Plan → Features
      └─ Role ─────────────────────────────────── Permissions
```

## 🛡️ Security Layers

### Authentication (Who are you?)
```
1. User submits email/password
2. System verifies password hash
3. JWT token generated with user context
4. Token includes: user_id, client_id, is_super_admin
5. Token stored in Authorization header
```

### Authorization (What can you do?)
```
1. Super Admin? → Full access, bypass all checks
2. Client Owner? → Full client access
3. Client Admin? → Role-based permissions
4. Regular User? → Permission-specific access
5. Feature Gated? → Check subscription plan
6. Usage Limit? → Check current period usage
```

## 🚀 Common API Workflows

### New Organization Onboarding
```
1. User registers via POST /api/auth/register
   ├─ Creates User record
   ├─ Sets is_super_admin: false or true (based on config)
   └─ Returns JWT token

2. Admin creates Client via POST /api/clients
   ├─ Sets client_id
   └─ Sets initial settings

3. Admin assigns User to Client via POST /api/users
   ├─ Creates ClientUser record
   ├─ Sets role: admin|manager|user
   └─ Sets permissions array

4. Optional: Create Subscription via POST /api/subscription/activate
   ├─ Selects Plan
   ├─ Sets billing_cycle: monthly|yearly
   └─ Subscription becomes active
```

### Feature Access Pattern
```
1. User hits protected endpoint
2. Middleware checks: authenticate (req.user)
3. Middleware checks: feature gate (req.features)
4. Middleware checks: permissions (req.permissions)
5. Middleware checks: usage limits (req.usageInfo)
6. Controller executes business logic
```

### Plan Upgrade Flow
```
1. User calls POST /api/subscription/activate with new_plan_id
2. System calls subscriptionService.upgradePlan()
3. System calculates proration if applicable
4. System creates proration invoice
5. System updates Subscription record
6. Plan features immediately available
```

## 📊 Key Databases Tables

### Essential Tables
| Table | Purpose | Key Fields |
|-------|---------|-----------|
| users | User accounts | email, password_hash, is_super_admin |
| clients | Organizations | name, slug, status, settings |
| client_users | User-Org mapping | client_id, user_id, role, is_owner |
| subscriptions | Active plans | client_id, plan_id, status, current_period_* |
| plans | Plan definitions | code, name, price_monthly, is_active |
| plan_features | Features per plan | plan_id, feature_id, limits |
| features | Feature definitions | code, name, is_enabled |
| audit_logs | Action tracking | client_id, user_id, action, resource_type |

## 🔌 API Response Format

### Success Response
```json
{
  "success": true,
  "data": { /* Resource data */ },
  "message": "Optional message"
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message",
  "statusCode": 400,
  "details": { /* Additional error info */ }
}
```

## 🧪 Testing Common Scenarios

### Test Super Admin Access
```
1. Login as super admin: SUPER_ADMIN_EMAIL / SUPER_ADMIN_PASSWORD
2. Token should have is_super_admin: true
3. Can access /api/admin/* routes
4. Can create organizations via POST /api/admin/organizations
```

### Test Trial Subscription
```
1. New user registers
2. Auto-created subscription with trial plan (14 days)
3. Features limited by trial plan's limits
4. Leads feature available
5. Meta Ads feature NOT available (pro+ only)
```

### Test Feature Gating
```
GET /api/leads (requires 'leads' feature in subscription)
├─ Trial Plan → 200 OK
├─ Professional Plan → 200 OK (with higher limit)
└─ Starter Plan (no leads) → 403 Forbidden

GET /api/meta-ads/campaigns (requires 'meta_ads' feature)
├─ Trial Plan → 403 Forbidden
├─ Professional Plan → 200 OK
└─ Enterprise Plan → 200 OK
```

### Test Usage Limits
```
POST /api/leads (max_contacts limit: 1000)
├─ Current usage: 900 → Accept
├─ Current usage: 1000 → 403 Forbidden
└─ Error: "You have reached your contacts limit"
```

## 🔐 Token Management

### JWT Token Structure
```javascript
// Access Token (15 minutes)
{
  sub: "user_id",
  email: "user@example.com",
  is_super_admin: false,
  client_id: "org_id",
  iat: 1234567890,
  exp: 1234568790
}

// Refresh Token (7 days, stored in DB)
{
  sub: "user_id",
  tokenFamily: "uuid",
  userAgent: "browser_info",
  ipAddress: "user_ip"
}
```

## 📝 Common Configuration

### Plan Hierarchy
```
Starter (Free Trial 14 days)
├─ Leads: max 100
├─ Templates: max 5
├─ Campaigns: max 1
└─ Features: Basic WhatsApp only

Professional ($999/month)
├─ Leads: max 10,000
├─ Templates: max 100
├─ Campaigns: max unlimited
└─ Features: WhatsApp + Meta Ads + Analytics

Enterprise (Custom)
├─ Leads: unlimited
├─ Templates: unlimited
├─ Campaigns: unlimited
└─ Features: All + Priority support
```

### Default Features
```javascript
[
  'leads',              // Lead capture & management
  'campaigns',          // Campaign creation
  'templates',          // Message templates
  'workflows',          // Automation workflows
  'analytics',          // Dashboard analytics
  'meta_ads',           // Facebook/Meta ads integration
  'white_label',        // Branding customization
  'api_access',         // External API access
  'team_collaboration', // Multiple user support
  'advanced_reporting'  // Detailed reports
]
```

## 🔍 Debugging Tips

### Check User Context
```javascript
// In request handler
console.log({
  user: req.user,           // User object
  client: req.client,       // Organization object
  subscription: req.subscription, // Active subscription
  features: req.features,   // Available features
  permissions: req.user.permissions // User permissions
});
```

### Check Feature Availability
```javascript
// User has feature?
if (req.features['leads']) {
  // Can access leads
}

// Get feature limits
const limit = req.featureLimits['leads']?.max_contacts;

// Get current usage
const usage = req.usageInfo?.currentUsage;
const remaining = req.usageInfo?.remaining;
```

### Common Error Codes
| Code | Meaning |
|------|---------|
| 401 | Unauthorized (no token or invalid) |
| 403 | Forbidden (no permission or feature gated) |
| 404 | Not found (resource doesn't exist) |
| 429 | Rate limited (too many requests) |
| 409 | Conflict (duplicate unique field) |

## 🚀 Deployment Checklist

### Before Deployment
- [ ] Set all environment variables in deployment platform
- [ ] Configure SSL/HTTPS certificates
- [ ] Set FRONTEND_URL in backend environment
- [ ] Set NEXT_PUBLIC_API_URL in frontend environment
- [ ] Configure MongoDB connection string
- [ ] Generate JWT secrets (use random 32-char strings)
- [ ] Set SUPER_ADMIN_EMAIL and SUPER_ADMIN_PASSWORD
- [ ] Set NODE_ENV=production
- [ ] Review allowed CORS origins
- [ ] Set up monitoring and logging

### After Deployment
- [ ] Test super admin login
- [ ] Test user registration
- [ ] Test subscription creation
- [ ] Test feature gating
- [ ] Verify audit logging
- [ ] Check database connectivity
- [ ] Monitor error logs
- [ ] Test payment webhook (if configured)

## 📚 File Organization

### Must Know Files
```
backend/
  server.js                      # Main entry point
  config/database.js             # DB connection
  middleware/auth.js             # Authentication magic
  middleware/featureGate.js      # Feature access control
  routes/subscription.js         # Plan/subscription logic
  services/subscriptionService.js # Subscription business logic

frontend/
  pages/_app.js                  # App initialization
  contexts/AuthContext.js        # User state
  pages/payments.js              # Pricing/billing UI
```

## 🎯 Next Steps for Development

1. **Understand Multi-Tenancy**: Review Client → ClientUser → Subscription flow
2. **Add Endpoint**: Review existing route, add to routes/*, add auth middleware
3. **Add Permission**: Add code to permissions list, assign to roles
4. **Add Feature**: Create Feature record, add to PlanFeature for plans, gate with @requireFeature
5. **Add Test**: Create test to verify the scenario

---

**Last Updated**: February 16, 2026
