# ✅ WORKING TEST CREDENTIALS

## Account Successfully Created!

### 🏢 Tenant Admin
```
Email:    admin@testcompany.com
Password: Test123!
```

**Company:** Test Company  
**Status:** Active (14-day trial)  
**Expected Redirect:** `/dashboard`  
**Access Level:** Tenant Admin (full access to tenant features)

---

### Test Steps:

1. **Login** at `http://localhost:3000`
2. Use credentials above
3. Should redirect to `/dashboard`
4. Verify you can:
   - ✅ View analytics dashboard
   - ✅ Access workflows
   - ✅ Manage leads
   - ✅ Create campaigns
   - ✅ Manage team (invite users)
   - ✅ Update settings

---

### 🔐 Super Admin (System Access)

```
Email:    admin@realnext.com
Password: RealnextAdmin2024!debug
```

**Expected Redirect:** `/admin`  
**Access:** Full system - manage all partners, plans, tenants

---

### To Create More Test Users:

#### Register Another Tenant:
Go to `http://localhost:3000/auth/register` and sign up with different details.

#### Create Tenant User (Limited Access):
1. Login as admin@testcompany.com
2. Go to Team Management
3. Invite user with limited permissions
4. Test with that user login

---

## ✓ Ready to Test!

Your test account is now active. Try logging in with the credentials above!
