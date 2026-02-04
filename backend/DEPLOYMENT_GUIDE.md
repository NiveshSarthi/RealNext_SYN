# Production Deployment Guide

This guide covers deploying the Multi-Tenant SaaS backend to production.

---

## Prerequisites

- Node.js 18+ LTS
- PostgreSQL 14+ (managed service recommended)
- Redis (for session management - optional but recommended)
- Domain name with SSL certificate
- Cloud hosting (AWS, GCP, Azure, DigitalOcean, etc.)

---

## 1. Database Setup

### PostgreSQL Configuration

**Option A: Managed Database (Recommended)**
- AWS RDS, Google Cloud SQL, Azure Database, or DigitalOcean Managed Database
- Benefits: Automated backups, scaling, high availability

**Option B: Self-Hosted**
```bash
# Install PostgreSQL
sudo apt update
sudo apt install postgresql postgresql-contrib

# Create database
sudo -u postgres psql
CREATE DATABASE realnext_production;
CREATE USER realnext_user WITH ENCRYPTED PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE realnext_production TO realnext_user;
```

### Database Optimization

**postgresql.conf settings:**
```conf
max_connections = 100
shared_buffers = 256MB
effective_cache_size = 1GB
maintenance_work_mem = 64MB
checkpoint_completion_target = 0.9
wal_buffers = 16MB
default_statistics_target = 100
random_page_cost = 1.1
work_mem = 2621kB
```

### Connection Pooling

Install pg-pool or use built-in Sequelize pooling:

```javascript
// backend/config/database.js
pool: {
  max: 20,
  min: 5,
  acquire: 60000,
  idle: 10000
}
```

---

## 2. Environment Configuration

### Production .env

Create `.env.production`:

```env
# Environment
NODE_ENV=production
PORT=5000

# Database
DB_HOST=your-db-host.rds.amazonaws.com
DB_PORT=5432
DB_NAME=realnext_production
DB_USER=realnext_user
DB_PASSWORD=your_secure_password
DB_SSL=true

# JWT Secrets (Generate strong random strings)
JWT_SECRET=generate_with_openssl_rand_base64_64
JWT_REFRESH_SECRET=generate_different_secret_openssl_rand_base64_64
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d

# Super Admin (Change default password!)
SUPER_ADMIN_EMAIL=admin@yourdomain.com
SUPER_ADMIN_PASSWORD=VerySecurePassword123!@#

# Google OAuth
GOOGLE_CLIENT_ID=your_production_client_id
GOOGLE_CLIENT_SECRET=your_production_secret
GOOGLE_REDIRECT_URI=https://api.yourdomain.com/api/auth/google/callback

# Frontend URL
FRONTEND_URL=https://app.yourdomain.com

# Razorpay (Production Keys)
RAZORPAY_KEY_ID=rzp_live_xxxxxxxxxx
RAZORPAY_KEY_SECRET=your_razorpay_secret
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret

# Email (Optional - for notifications)
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=your_sendgrid_api_key
EMAIL_FROM=noreply@yourdomain.com

# File Storage (Optional - for uploads)
AWS_ACCESS_KEY_ID=your_aws_key
AWS_SECRET_ACCESS_KEY=your_aws_secret
AWS_S3_BUCKET=realnext-uploads
AWS_REGION=ap-south-1

# Redis (Optional - for caching/sessions)
REDIS_URL=redis://your-redis-host:6379

# Logging
LOG_LEVEL=info
```

### Generate Secrets

```bash
# JWT Secret
openssl rand -base64 64

# Refresh Token Secret
openssl rand -base64 64
```

---

## 3. Application Setup

### Install Dependencies

```bash
cd backend
npm ci --production
```

### Database Migrations

```bash
# Initialize Sequelize CLI (if not done)
npx sequelize-cli init

# Generate migrations from models (one-time)
# Note: You may need to manually create migration files
# or use sequelize-auto-migrations

# Run migrations
npx sequelize-cli db:migrate --env production

# Seed plans and features
node scripts/seedPlans.js
```

### Build Process

If using TypeScript or build step:
```bash
npm run build
```

---

## 4. Process Management

### Using PM2 (Recommended)

```bash
# Install PM2 globally
npm install -g pm2

# Start application
pm2 start index.js --name realnext-api \
  --instances max \
  --exec-mode cluster \
  --env production

# Save PM2 configuration
pm2 save

# Setup auto-restart on server reboot
pm2 startup systemd
```

**PM2 Configuration File** (`ecosystem.config.js`):

```javascript
module.exports = {
  apps: [{
    name: 'realnext-api',
    script: './index.js',
    instances: 'max',
    exec_mode: 'cluster',
    env_production: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    max_memory_restart: '1G',
    autorestart: true,
    watch: false
  }]
};
```

Start with:
```bash
pm2 start ecosystem.config.js --env production
```

---

## 5. Reverse Proxy (Nginx)

### Install Nginx

```bash
sudo apt update
sudo apt install nginx
```

### Configure Nginx

Create `/etc/nginx/sites-available/realnext-api`:

```nginx
upstream realnext_backend {
    least_conn;
    server 127.0.0.1:5000;
    server 127.0.0.1:5001;
    server 127.0.0.1:5002;
    server 127.0.0.1:5003;
}

server {
    listen 80;
    server_name api.yourdomain.com;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.yourdomain.com;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/api.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.yourdomain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Logging
    access_log /var/log/nginx/realnext-api-access.log;
    error_log /var/log/nginx/realnext-api-error.log;

    # Rate Limiting (additional layer)
    limit_req_zone $binary_remote_addr zone=api_limit:10m rate=30r/s;
    limit_req zone=api_limit burst=50 nodelay;

    location / {
        proxy_pass http://realnext_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;

        # Body size for file uploads
        client_max_body_size 50M;
    }

    # Health check endpoint (no auth required)
    location /api/health {
        proxy_pass http://realnext_backend;
        access_log off;
    }
}
```

Enable site:
```bash
sudo ln -s /etc/nginx/sites-available/realnext-api /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## 6. SSL Certificate (Let's Encrypt)

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d api.yourdomain.com

# Auto-renewal (runs twice daily)
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer
```

---

## 7. Monitoring & Logging

### Application Monitoring

**Option A: PM2 Monitor**
```bash
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 100M
pm2 set pm2-logrotate:retain 10
```

**Option B: External Services**
- New Relic
- Datadog
- AppSignal

### Error Tracking

Install Sentry:

```bash
npm install @sentry/node
```

Add to `index.js`:
```javascript
const Sentry = require('@sentry/node');

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV
});

// Before other middleware
app.use(Sentry.Handlers.requestHandler());

// After routes, before error handlers
app.use(Sentry.Handlers.errorHandler());
```

### Log Rotation

```bash
# Create logrotate config
sudo nano /etc/logrotate.d/realnext

# Add configuration:
/var/www/realnext/backend/logs/*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 www-data www-data
    sharedscripts
    postrotate
        pm2 reloadLogs
    endscript
}
```

---

## 8. Database Backups

### Automated Backups

Create backup script `/usr/local/bin/backup-realnext-db.sh`:

```bash
#!/bin/bash
BACKUP_DIR="/backups/realnext"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="realnext_production"
DB_USER="realnext_user"

mkdir -p $BACKUP_DIR

# Dump database
PGPASSWORD=$DB_PASSWORD pg_dump -h $DB_HOST -U $DB_USER $DB_NAME | gzip > $BACKUP_DIR/backup_$DATE.sql.gz

# Keep only last 7 days
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +7 -delete

# Upload to S3 (optional)
aws s3 cp $BACKUP_DIR/backup_$DATE.sql.gz s3://your-backup-bucket/
```

Add to crontab:
```bash
0 2 * * * /usr/local/bin/backup-realnext-db.sh
```

---

## 9. Security Checklist

- [ ] Strong database passwords
- [ ] JWT secrets are random and secure
- [ ] SSL/TLS enabled (HTTPS only)
- [ ] Security headers configured
- [ ] Rate limiting active
- [ ] CORS properly configured
- [ ] Database access restricted to application servers only
- [ ] Regular security updates (`apt update && apt upgrade`)
- [ ] Firewall configured (UFW or cloud security groups)
- [ ] SSH key-based authentication (disable password auth)
- [ ] Audit logs enabled
- [ ] Backup strategy in place

---

## 10. Performance Optimization

### Database Indexing

Ensure all foreign keys and frequently queried fields are indexed (already done in models).

### Caching with Redis

```bash
# Install Redis
sudo apt install redis-server

# Configure Redis
sudo nano /etc/redis/redis.conf
# Set: maxmemory 256mb
# Set: maxmemory-policy allkeys-lru

sudo systemctl restart redis
```

Add to application:
```javascript
const redis = require('redis');
const client = redis.createClient({ url: process.env.REDIS_URL });

// Cache example
app.get('/api/analytics/dashboard', async (req, res) => {
  const cacheKey = `dashboard:${req.tenant.id}`;
  const cached = await client.get(cacheKey);
  
  if (cached) return res.json(JSON.parse(cached));
  
  const data = await getDashboardData(req.tenant.id);
  await client.setEx(cacheKey, 300, JSON.stringify(data)); // 5 min cache
  res.json(data);
});
```

---

## 11. Scaling Considerations

### Horizontal Scaling

- Use load balancer (Nginx, AWS ALB, GCP Load Balancer)
- Run multiple application instances with PM2 cluster mode
- Shared session storage (Redis)
- Read replicas for database

### Vertical Scaling

- Increase server resources (CPU, RAM)
- Optimize database query performance
- Monitor and adjust PM2 instance count

---

## 12. Health Checks

Configure health check endpoint monitoring:

```bash
# Add to monitoring service (UptimeRobot, Pingdom, etc.)
GET https://api.yourdomain.com/api/health
```

Expected response:
```json
{
  "success": true,
  "status": "healthy",
  "timestamp": "2024-02-04T14:00:00.000Z"
}
```

---

## 13. Rollback Strategy

### Backup Before Deployment

```bash
# Tag current version
git tag -a v1.0.0 -m "Production release 1.0.0"

# Create database backup
/usr/local/bin/backup-realnext-db.sh
```

### Rollback Process

```bash
# PM2 rollback
pm2 reload ecosystem.config.js --update-env

# Database rollback (if migrations failed)
npx sequelize-cli db:migrate:undo --env production

# Code rollback
git checkout v1.0.0
npm ci
pm2 restart realnext-api
```

---

## 14. Post-Deployment Verification

1. **Test Super Admin Login**
```bash
curl -X POST https://api.yourdomain.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@yourdomain.com","password":"your_password"}'
```

2. **Test User Registration**
3. **Verify Database Connectivity**
4. **Check Error Logs**
```bash
pm2 logs realnext-api --lines 100
```

5. **Monitor Resource Usage**
```bash
pm2 monit
htop
```

---

## Support & Troubleshooting

### Common Issues

**Database Connection Failed**
- Check firewall rules
- Verify database credentials
- Ensure SSL certificates are valid

**High Memory Usage**
- Adjust PM2 max_memory_restart
- Check for memory leaks with profiling

**Slow API Response**
- Enable query logging to identify slow queries
- Add database indexes
- Implement Redis caching

### Useful Commands

```bash
# Check PM2 status
pm2 status

# View logs
pm2 logs realnext-api

# Restart application
pm2 restart realnext-api

# Check Nginx status
sudo systemctl status nginx

# Test Nginx config
sudo nginx -t

# View Nginx access logs
tail -f /var/log/nginx/realnext-api-access.log
```

---

## Maintenance Schedule

- **Daily**: Automated database backups
- **Weekly**: Security updates, log review
- **Monthly**: Performance review, dependency updates
- **Quarterly**: Security audit, disaster recovery test
