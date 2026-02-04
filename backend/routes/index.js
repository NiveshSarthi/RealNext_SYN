const express = require('express');
const router = express.Router();

// Public routes
router.use('/auth', require('./auth'));

// Subscription routes (partially public)
router.use('/subscription', require('./subscription'));

// Admin routes (Super Admin only)
router.use('/admin', require('./admin'));

// Partner routes
router.use('/partner', require('./partner'));

// Tenant management routes
router.use('/tenant', require('./tenant'));

// Feature module routes
router.use('/leads', require('./leads'));
router.use('/campaigns', require('./campaigns'));
router.use('/templates', require('./templates'));
router.use('/workflows', require('./workflows'));
router.use('/analytics', require('./analytics'));
router.use('/network', require('./network'));
router.use('/quick-replies', require('./quickReplies'));
router.use('/catalog', require('./catalog'));
router.use('/lms', require('./lms'));
router.use('/meta-ads', require('./metaAds'));
router.use('/payments', require('./payments'));

// Health check
router.get('/health', (req, res) => {
    res.json({
        success: true,
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || '1.0.0'
    });
});

// API info
router.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'Multi-Tenant SaaS Backend API',
        version: '1.0.0',
        endpoints: {
            auth: '/api/auth',
            subscription: '/api/subscription',
            admin: '/api/admin (Super Admin)',
            partner: '/api/partner (Partner Admin)',
            tenant: '/api/tenant (Tenant)',
            leads: '/api/leads',
            campaigns: '/api/campaigns',
            templates: '/api/templates',
            workflows: '/api/workflows'
        }
    });
});

// External API Proxy
router.use('/external-proxy', require('./externalProxy'));

module.exports = router;
