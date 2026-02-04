const express = require('express');
const router = express.Router();

// Admin sub-routes
router.use('/partners', require('./partners'));
router.use('/plans', require('./plans'));
router.use('/features', require('./features'));
router.use('/tenants', require('./tenants'));
router.use('/analytics', require('./analytics'));

// Admin root - overview dashboard
router.get('/', async (req, res) => {
    res.json({
        success: true,
        message: 'Admin API',
        endpoints: [
            '/api/admin/partners',
            '/api/admin/plans',
            '/api/admin/features',
            '/api/admin/tenants',
            '/api/admin/analytics'
        ]
    });
});

module.exports = router;
