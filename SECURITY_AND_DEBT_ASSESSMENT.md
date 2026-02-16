# Synditech RealNext - Security Audit & Technical Debt Assessment

## 🔒 Security Audit

### Critical Issues

#### 1. 🔴 CORS Origins Hardcoded
**Severity**: MEDIUM  
**File**: `backend/server.js` (lines 31-41)  
**Issue**: Allowed origins are hardcoded with specific domains
```javascript
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  process.env.FRONTEND_URL,
  'https://test.niveshsarthi.com',
  'https://testbd.niveshsarthi.com',
  'https://realnext.syndicate.niveshsarthi.com',
  'https://realnext.in',
  /\.realnext\.in$/,
  /^(https?:\/\/)?(www\.)?niveshsarthi\.com$/,
  /^(https?:\/\/)?(www\.)?realnext\.in$/,
  /\.niveshsarthi\.com$/,
  /\.realnext\.in$/
];
```
**Risk**: 
- Changing domains requires code deployment
- Mix of test and production domains
- Localhost included in production code

**Recommendation**:
```javascript
const allowedOrigins = (process.env.ALLOWED_ORIGINS || '').split(',');
// Set in .env: ALLOWED_ORIGINS=https://domain1.com,https://domain2.com
```

#### 2. 🔴 Environment Variables in Git
**Severity**: MEDIUM  
**Issue**: `.env` file may be committed (though .gitignore should prevent)
**Risk**: Database credentials, JWT secrets exposed
**Recommendation**:
- Ensure `.env` is in `.gitignore`
- Use `.env.example` template only
- Rotate secrets if ever committed

#### 3. 🔴 Duplicate Index Warnings
**Severity**: LOW  
**File**: Models compilation
**Message**: 
```
Mongoose Warning: Duplicate schema index on {"code":1} for model "Plan"
Mongoose Warning: Duplicate schema index on {"invoice_number":1} for model "Invoice"
```
**Risk**: Performance impact, unclear which index is used
**Solution**: Remove duplicate index declarations from models

#### 4. 🟡 External Database Connection
**Severity**: MEDIUM  
**Issue**: MongoDB at external IP `72.61.248.175:5443`
**Risk**: 
- Network exposure
- Credential in connection string
- Single point of failure

**Recommendations**:
- Use private network/VPN tunnel
- Implement connection pooling
- Add connection timeout and retry logic
- Enable MongoDB authentication
- Implement backups strategy

#### 5. 🟡 Payment Gateway Incomplete
**Severity**: MEDIUM  
**File**: `backend/routes/subscription.js` (line 82)
**Issue**: 
```javascript
// TODO: Integrate with payment gateway (Razorpay)
// For now, return checkout details
```
**Risk**: 
- No payment processing in production
- Subscriptions can be created without payment
- Revenue leakage

**Status**: Requires implementation before production

### High Priority Issues

#### 6. 🟡 Rate Limiting Limited Scope
**Severity**: LOW  
**Status**: Applied only to `/auth/login`, `/auth/register`, `/password/reset`
**Risk**: Other sensitive endpoints unprotected
**Solution**:
```javascript
// Add rate limiting to:
router.post('/admin/*', adminLimiter, ...);
router.post('/payments/*', paymentLimiter, ...);
router.get('/sensitive-data/*', dataLimiter, ...);
```

#### 7. 🟡 No HTTPS Enforcement
**Severity**: MEDIUM (in production)
**Issue**: HTTP connections accepted in docker setup
**Risk**: Man-in-the-middle attacks, credential theft
**Solution**: 
- Force HTTPS in production middleware
- Set secure cookie flag
- HSTS header

#### 8. 🟡 Incomplete Audit Logging
**Severity**: LOW  
**Issue**: Some actions not fully logged
**Files**: 
- Facebook integration actions
- Payment processing
- Admin API calls
**Solution**: Standardize @auditAction decorator usage

#### 9. 🟡 No Request Signing/Verification
**Severity**: LOW  
**External API Risk**: 
- Facebook webhooks unreliable
- No signature verification visible
**Solution**: Implement HMAC-SHA256 signature verification

#### 10. 🟡 Sensitive Data Exposure Risk
**Severity**: MEDIUM  
**Files**: Audit logs, API responses
**Issue**: User passwords, tokens in responses
**Example Needed**: Verify no sensitive data in logs
```javascript
// In logger configuration, add sensitive field filter
app.use(morgan(function (tokens, req, res) {
  // Remove Authorization header from logs
  const auth = req.headers.authorization;
  req.headers.authorization = '[REDACTED]';
  // ... proceed
}));
```

### Medium Priority Issues

#### 11. 🟠 Missing Input Validation Edge Cases
**Severity**: MEDIUM  
**Examples**:
- Phone number format (international?)
- Email domain validation
- URL validation for profile pictures
- File upload size limits

**File**: `backend/utils/validators.js`  
**Recommendation**: Add comprehensive validation rules

#### 12. 🟠 No SQL Injection Prevention (MongoDB)
**Severity**: LOW (MongoDB is less vulnerable to "SQL injection")
**Note**: Mongoose provides good protection
**Recommendation**: Still validate and sanitize all inputs

#### 13. 🟠 CORS Preflight Caching
**Severity**: LOW  
**Status**: Using `maxAge: 86400` (24 hours)
**Risk**: Updated CORS origins take 24 hours to apply
**Solution**: Reduce to 3600 (1 hour) or implement cache busting

#### 14. 🟠 Missing Helmet Configuration
**Severity**: LOW  
**Current**:
```javascript
app.use(helmet({
  crossOriginResourcePolicy: false,
}));
```
**Improvement**:
```javascript
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "trusted-cdn.com"],
    },
  },
  hsts: { maxAge: 31536000, includeSubDomains: true },
}));
```

#### 15. 🟠 No Rate Limiting on Subscription APIs
**Severity**: MEDIUM  
**Risk**: Abuse potential on `/api/subscription/*`
**Solution**: Apply subscription-specific rate limiter

### Low Priority Issues

#### 16. 🟢 Admin Panel Exposed
**Severity**: LOW  
**Files**: Files in `backend/public/admin/`
**Risk**: Potential information disclosure
**Solution**: Restrict access or serve from restricted route

#### 17. 🟢 Missing CSRF Protection
**Severity**: LOW  
**Status**: Using JWT (immune to CSRF by design)
**Note**: API-first architecture doesn't need traditional CSRF tokens

#### 18. 🟢 Missing Content Security Policy
**Severity**: LOW  
**Risk**: XSS attacks on frontend
**Solution**: Add CSP headers in Next.js middleware

#### 19. 🟢 No API Versioning
**Severity**: LOW  
**Current**: `/api/v1/` prefix exists but not enforced
**Risk**: Breaking changes confuse clients
**Solution**: Implement strict API versioning policy

#### 20. 🟢 Missing API Key Support
**Severity**: LOW  
**Use Case**: Server-to-server integrations
**Current**: Only JWT supported
**Solution**: Add API key authentication for third-party integrations

---

## 📊 Technical Debt Assessment

### Category 1: Code Quality Debt

#### A. Testing
**Status**: ❌ No visible test suite
**Impact**: HIGH
**Effort**: MEDIUM
**Debt Items**:
- No unit tests for services
- No integration tests for API routes
- No e2e tests for user flows
- Jest configured but not used

**Recommendation**: 
```
Priority: HIGH
Start with service tests:
- authService.js tests
- subscriptionService.js tests
- Feature gate logic tests
```

#### B. Error Handling
**Status**: ⚠️ Partial
**Impact**: MEDIUM
**Debt Items**:
- Generic error messages in some places
- Inconsistent error response format in edge cases
- Missing try-catch in some async operations

**Example Issue**:
```javascript
// ❌ Generic
throw new Error('Operation failed');

// ✅ Better
throw ApiError.badRequest(
  'Subscription already exists',
  { attempted_plan: planId }
);
```

#### C. Input Sanitization
**Status**: ⚠️ Partial
**Impact**: MEDIUM
**Debt Items**:
- Some inputs not validated (strings, URLs)
- Missing phone number format validation
- No file upload content type checking

**Example**:
```javascript
// In validators.js - add sanitization
const phone = validator.isMobilePhone(req.body.phone, 'any');
const url = validator.isURL(req.body.avatar_url);
```

#### D. Code Comments & Documentation
**Status**: ✅ Decent
**Impact**: LOW
**Debt Items**:
- Some TODO comments left (Razorpay integration)
- Complex business logic could use more explanation
- No JSDoc for most functions

#### E. Magic Numbers
**Status**: ⚠️ Several found
**Impact**: MEDIUM
**Examples**:
```javascript
// Hard-coded values scattered
12  // bcrypt salt rounds
14  // trial days
15  // JWT expiry minutes
7   // refresh token days
5001 // default port
```

**Solution**: Move to constants file
```javascript
// config/constants.js
const BCRYPT_ROUNDS = 12;
const TRIAL_DAYS = 14;
const JWT_ACCESS_EXPIRY = '15m';
const JWT_REFRESH_EXPIRY = '7d';
const DEFAULT_PORT = process.env.PORT || 5001;
```

### Category 2: Architecture Debt

#### A. Database Design
**Status**: ✅ Good
**Issues**:
- No denormalization for frequently joined data
- Missing soft delete logic in some places
- Could benefit from caching layer

**Improvement**: Add Redis cache for frequently accessed data
```javascript
// Cache subscription features
const cacheKey = `subscription:${clientId}:features`;
const cached = await redis.get(cacheKey);
if (cached) return JSON.parse(cached);
```

#### B. Missing Service Layer Functions
**Status**: ⚠️ Partial
**Issues**:
- Some business logic in route handlers
- Should centralize complex operations

**Example**: Lead deduplication logic should be in service
```javascript
// ❌ Current: In route
app.post('/leads', (req, res) => {
  const existing = await Lead.findOne({ email });
  if (existing) return res.json(existing);
  // ...
});

// ✅ Better: In service
class LeadService {
  async createOrUpdate(data) { /* ... */ }
}
```

#### C. Missing Caching Strategy
**Severity**: MEDIUM
**Impact**: Performance
**Missing**:
- Plan/Feature caching (changes rarely)
- User permission caching
- Subscription feature map caching

**Recommendation**: Implement Redis layer

#### D. No Message Queue
**Severity**: MEDIUM  
**Impact**: Scalability
**Missing**:
- Async email notifications
- SMS delivery queue
- Webhook retry logic
- Campaign scheduling

**Recommendation**: Add Bull/Redis queue for async tasks

### Category 3: DevOps/Deployment Debt

#### A. No Health Checks
**Status**: ❌ Missing
**Impact**: HIGH
**Missing**:
```javascript
// Should have
app.get('/health', (req, res) => {
  res.json({ status: 'ok', db: 'connected', timestamp: new Date() });
});
```

#### B. No Graceful Shutdown
**Status**: ❌ Missing
**Impact**: MEDIUM
- Server doesn't handle SIGTERM
- Open connections not closed
- Could cause data corruption

**Solution**:
```javascript
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(async () => {
    await mongoose.connection.close();
    process.exit(0);
  });
});
```

#### C. No Database Migrations
**Status**: ⚠️ Partial
**Issue**: Schema changes require code updates
**Solution**: Add migration tool (mongoose-migrate)

#### D. Missing Environment Validation
**Status**: ⚠️ Partial
**Issue**: Missing env vars cause cryptic errors
**Solution**:
```javascript
// At startup
const requiredEnv = [
  'MONGODB_URI',
  'JWT_ACCESS_SECRET',
  'JWT_REFRESH_SECRET',
  'FRONTEND_URL'
];
requiredEnv.forEach(env => {
  if (!process.env[env]) {
    throw new Error(`Missing required env: ${env}`);
  }
});
```

#### E. No Monitoring/Observability
**Status**: ❌ Missing
**Impact**: HIGH
**Missing**:
- Application Performance Monitoring (APM)
- Error tracking (Sentry)
- Log aggregation (ELK, Datadog)
- Metrics (Prometheus)

**Recommendation**: Add Sentry for error tracking
```javascript
const Sentry = require("@sentry/node");
Sentry.init({ dsn: process.env.SENTRY_DSN });
app.use(Sentry.Handlers.errorHandler());
```

### Category 4: Feature Debt

#### A. Incomplete Payment Processing
**Status**: ❌ Not implemented
**Impact**: CRITICAL
**Missing**:
- Razorpay webhook handling
- Payment verification
- Invoice generation
- Refund processing
- Payment retry logic

#### B. Missing Email Notifications
**Status**: ⚠️ Not visible
**Missing**:
- Welcome emails
- Subscription confirmation
- Payment receipts
- Renewal reminders
- Password reset emails

#### C. No Webhook Support
**Status**: ⚠️ Partial
**Missing**:
- Outgoing webhooks for integrations
- Reliable delivery mechanism
- Retry logic
- Signature verification

#### D. Limited Analytics
**Status**: ⚠️ Partial
**Missing**:
- Real-time dashboards
- Trend analysis
- Predictive analytics
- Custom reports
- Data export

---

## 🎯 Remediation Roadmap

### Phase 1: Security (Week 1-2)
- [ ] Fix CORS hardcoding
- [ ] Add environment validation
- [ ] Fix duplicate indexes
- [ ] Implement request signing for webhooks
- [ ] Add rate limiting to sensitive endpoints
- [ ] Remove hardcoded origins

**Impact**: Reduce vulnerabilities from 20 to 12

### Phase 2: Stability (Week 3-4)
- [ ] Add health checks
- [ ] Implement graceful shutdown
- [ ] Add error tracking (Sentry)
- [ ] Complete input validation
- [ ] Add comprehensive logging

**Impact**: Improve reliability

### Phase 3: Testing (Week 5-6)
- [ ] Write unit tests for services
- [ ] Write integration tests for API routes
- [ ] Aim for 80% code coverage
- [ ] Set up CI/CD pipeline for tests

**Impact**: Reduce bugs, improve confidence

### Phase 4: Features (Week 7-8)
- [ ] Complete Razorpay integration
- [ ] Add email notifications
- [ ] Implement webhooks
- [ ] Add async task queue

**Impact**: Complete core functionality

---

## 📋 Issue Priority Matrix

```
HIGH IMPACT, HIGH EFFORT
├─ Test Suite Implementation
├─ Payment Gateway Integration
└─ Message Queue System

HIGH IMPACT, LOW EFFORT
├─ Fix CORS Hardcoding
├─ Add Health Checks
├─ Environment Validation
└─ Graceful Shutdown

LOW IMPACT, HIGH EFFORT
├─ API Versioning Strategy
├─ Admin Panel Redesign
└─ Custom Reporting

LOW IMPACT, LOW EFFORT
├─ Fix Index Duplicates
├─ Add JSDoc Comments
├─ Extract Magic Numbers
└─ Add HSTS Headers
```

---

## 🚨 Pre-Production Checklist

### Security
- [ ] CORS properly configured per environment
- [ ] No hardcoded secrets
- [ ] HTTPS/TLS enabled
- [ ] Rate limiting on all sensitive endpoints
- [ ] CSRF tokens (if applicable)
- [ ] SQL/NoSQL injection prevention verified
- [ ] XSS protection in frontend

### Stability
- [ ] Health check endpoint working
- [ ] Error tracking configured (Sentry)
- [ ] Graceful shutdown implemented
- [ ] Database backups automated
- [ ] Monitoring/alerts set up
- [ ] Log aggregation working

### Testing
- [ ] Critical paths tested
- [ ] Error scenarios handled
- [ ] Load testing done
- [ ] Security testing completed
- [ ] Penetration testing (optional)

### Deployment
- [ ] Environment variables documented
- [ ] Database migrations tested
- [ ] Rollback plan documented
- [ ] Team trained on deployment
- [ ] Staging environment mirrors production
- [ ] SSL certificates ready

---

**Assessment Date**: February 16, 2026  
**Assessment Version**: 1.0  
**Overall Status**: 🟡 PRODUCTION-READY WITH CONDITIONS

**Summary**: The codebase is well-structured and mostly production-ready. Key issues are security hardcoding, incomplete payment integration, and missing observability. Address Phase 1 & 2 items before going live.
