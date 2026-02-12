const express = require('express');
const router = express.Router();

// Admin sub-routes
// router.use('/partners', require('./partners'));
router.use('/plans', require('./plans'));
router.use('/clients', require('./clients'));
router.use('/subscriptions', require('./subscriptions'));
router.use('/analytics', require('./analytics'));
router.use('/team', require('./team'));
router.use('/roles', require('./roles'));
router.use('/lms', require('./lms'));
router.use('/wa-marketing', require('./wa-marketing'));
// router.use('/inventory', require('./inventory'));

// Admin root - overview dashboard
router.get('/', async (req, res) => {
    res.json({
        success: true,
        message: 'Admin API',
        endpoints: [
            '/api/admin/clients',
            '/api/admin/plans',
            '/api/admin/analytics',
            '/api/admin/lms',
            '/api/admin/wa-marketing',
            '/api/admin/subscriptions',
            '/api/admin/team',
            '/api/admin/roles'
        ]
    });
});

module.exports = router;
