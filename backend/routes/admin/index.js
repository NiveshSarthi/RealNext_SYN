const express = require('express');
const router = express.Router();

// Admin sub-routes
// router.use('/partners', require('./partners'));
router.use('/plans', require('./plans'));
router.use('/features', require('./features'));
router.use('/clients', require('./clients'));
router.use('/subscriptions', require('./subscriptions'));
router.use('/analytics', require('./analytics'));
router.use('/team', require('./team'));
router.use('/roles', require('./roles'));

// Admin root - overview dashboard
router.get('/', async (req, res) => {
    res.json({
        success: true,
        message: 'Admin API',
        endpoints: [
            '/api/admin/clients',
            '/api/admin/plans',
            '/api/admin/features',
            '/api/admin/analytics'
        ]
    });
});

module.exports = router;
