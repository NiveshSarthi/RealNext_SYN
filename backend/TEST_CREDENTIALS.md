# Test User Credentials

All test users have been created in the database. Use these credentials to test role-based access:

---

## 1️⃣ SUPER ADMIN

**Login Credentials:**
```
Email:    admin@realnext.com
Password: RealnextAdmin2024!debug
```

**Expected Behavior:**
- Redirect to: `/admin`
- Full system access
- Can manage: Partners, Plans, All Tenants

**Test Checklist:**
- [ ] Login successful
- [ ] Redirected to /admin dashboard
- [ ] Can view partners list
- [ ] Can view plans list
- [ ] Can view all tenants

---

## 2️⃣ PARTNER ADMIN

**Login Credentials:**
```
Email:    partner-admin@acme.com
Password: Test123!
```

**Partner Details:**
- Partner Name: Acme Resellers
- Subdomain: acme
- Commission Rate: 15%

**Expected Behavior:**
- Redirect to: `/partner`
- Can onboard tenants under Acme Resellers
- Can manage subscriptions for their tenants
- Can view partner dashboard analytics

**Test Checklist:**
- [ ] Login successful
- [ ] Redirected to /partner dashboard
- [ ] Can view partner's tenants
- [ ] Can create new tenant
- [ ] Can assign subscriptions
- [ ] Cannot see other partners' data

---

## 3️⃣ TENANT ADMIN

**Login Credentials:**
```
Email:    tenant-admin@testcompany.com
Password: Test123!
```

**Tenant Details:**
- Company Name: Test Company Ltd
-Status: Active (14-day trial)
- Partner: Acme Resellers

**Expected Behavior:**
- Redirect to: `/dashboard`
- Full access to tenant features
- Can manage team members
- Can access settings

**Test Checklist:**
- [ ] Login successful
- [ ] Redirected to /dashboard
- [ ] Can view analytics
- [ ] Can access workflows
- [ ] Can manage team
- [ ] Can update settings
- [ ] Cannot access admin endpoints

---

## 4️⃣ TENANT USER (Limited Access)

**Login Credentials:**
```
Email:    tenant-user@testcompany.com
Password: Test123!
```

**Tenant Details:**
- Company: Test Company Ltd
- Role: User (not admin)
- Permissions: View/Edit leads, View campaigns, View workflows

**Expected Behavior:**
- Redirect to: `/dashboard`
- LIMITED access to features
- Cannot manage team
- Cannot access settings

**Test Checklist:**
- [ ] Login successful
- [ ] Redirected to /dashboard (limited view)
- [ ] Can view leads (allowed)
- [ ] Can view campaigns (allowed)
- [ ] CANNOT access tenant settings (403 Forbidden)
- [ ] CANNOT manage team members (403 Forbidden)
- [ ] CANNOT access admin pages

---

## Quick Test Commands (API Level)

### Test Super Admin
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@realnext.com","password":"RealnextAdmin2024!debug"}'
```

### Test Partner Admin
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"partner-admin@acme.com","password":"Test123!"}'
```

### Test Tenant Admin
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"tenant-admin@testcompany.com","password":"Test123!"}'
```

### Test Tenant User
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"tenant-user@testcompany.com","password":"Test123!"}'
```

---

## Data Isolation Testing

After logging in as each role, verify data isolation:

1. **As Tenant A Admin**: Create a lead
2. **As Tenant B User**: Try to view leads (should NOT see Tenant A's lead)
3. **As Partner A Admin**: View tenants (should only see own tenants)
4. **As Super Admin**: View all tenants (should see everything)

---

## Role-Based Redirect Verification

| User Type | Expected Redirect | Navigation Access |
|-----------|------------------|-------------------|
| Super Admin | `/admin` | Partners, Plans, Tenants, System Settings |
| Partner Admin | `/partner` | Partner Dashboard, Tenant Management |
| Tenant Admin | `/dashboard` | All features, Team, Settings |
| Tenant User | `/dashboard` | Limited features only |

---

## Manual Creation Instructions

If you need to create these users manually through SQL:

### Create Partner Admin
```sql
-- Create user
INSERT INTO users (id, email, name, password_hash, status)
VALUES (gen_random_uuid(), 'partner@acme.com', 'Partner Admin', 
  '$2a$10$[bcrypt_hash]', 'active');

-- Link to partner  
INSERT INTO partner_users (partner_id, user_id, role, is_owner)
SELECT p.id, u.id, 'admin', true
FROM partners p, users u
WHERE p.email = 'partner@acme.com' AND u.email = 'partner@acme.com';
```

---

**Note**: These credentials are for development/testing only. Change all passwords before going to production!
