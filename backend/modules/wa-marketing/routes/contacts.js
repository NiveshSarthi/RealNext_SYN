const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs');
const csv = require('csv-parser');
const { WaContact } = require('../../../models');
const { authenticate } = require('../../../middleware/auth');
const { requireFeature } = require('../../../middleware/featureGate');
const { requireClientAccess } = require('../../../middleware/roles');
const { enforceClientScope, setClientContext } = require('../../../middleware/scopeEnforcer');
const { ApiError } = require('../../../middleware/errorHandler');
const { getPaginatedResponse } = require('../../../utils/helpers');
const logger = require('../../../config/logger');

// Temporarily store uploads
const upload = multer({ dest: 'uploads/' });

// All routes require authentication, client context, and WA Marketing feature
router.use(authenticate, requireClientAccess, setClientContext, enforceClientScope);
router.use(requireFeature('campaigns')); // Uses Campaigns feature flag as proxy for WA Contacts

const ensureClient = (req) => {
    // Super admins can skip client context check for GET
    if (req.user?.is_super_admin && req.method === 'GET') {
        return;
    }

    if (!req.client || !req.client.id) {
        throw new ApiError(400, 'Client context is required.');
    }
};

/**
 * @route GET /api/wa-marketing/contacts
 * @desc Get contacts from local DB scoped by tenant
 */
router.get('/', async (req, res, next) => {
    try {
        ensureClient(req);

        let query = {};
        if (req.client?.id) {
            query.client_id = req.client.id;
        }
        if (req.query.search) {
            query.$or = [
                { name: { $regex: req.query.search, $options: 'i' } },
                { phone: { $regex: req.query.search, $options: 'i' } }
            ];
        }

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        const count = await WaContact.countDocuments(query);
        const contacts = await WaContact.find(query)
            .sort({ created_at: -1 })
            .skip(skip)
            .limit(limit);

        res.json({
            success: true,
            data: {
                data: contacts,
                pagination: {
                    current_page: page,
                    total_pages: Math.ceil(count / limit),
                    total_count: count,
                    limit
                }
            }
        });
    } catch (error) {
        logger.error('[WA Contacts] Failed to fetch local contacts:', error);
        next(error);
    }
});

/**
 * @route POST /api/wa-marketing/contacts
 * @desc Create a single contact in local DB
 */
router.post('/', async (req, res, next) => {
    try {
        ensureClient(req);
        const { name, phone, tags, custom_attributes } = req.body;
        if (!phone) {
            return res.status(400).json({ success: false, message: 'Phone number is required' });
        }

        // Check if exists
        const clientFilter = req.client?.id ? { client_id: req.client.id } : {};
        const exists = await WaContact.findOne({ ...clientFilter, phone });
        if (exists) {
            return res.status(409).json({ success: false, message: 'Phone number already exists in your audience' });
        }

        const contact = await WaContact.create({
            client_id: req.client.id,
            name: name || '',
            phone: phone,
            tags: tags || [],
            custom_attributes: custom_attributes || {}
        });

        res.status(201).json({
            success: true,
            message: 'Contact created successfully',
            data: contact
        });
    } catch (error) {
        logger.error('[WA Contacts] Failed to create local contact:', error);
        next(error);
    }
});

/**
 * @route DELETE /api/wa-marketing/contacts/:id
 * @desc Delete a contact from local DB
 */
router.delete('/:id', async (req, res, next) => {
    try {
        ensureClient(req);
        const query = { _id: req.params.id };
        if (req.client?.id) {
            query.client_id = req.client.id;
        }
        const contact = await WaContact.findOneAndDelete(query);

        if (!contact) {
            return res.status(404).json({ success: false, message: 'Contact not found' });
        }

        res.json({
            success: true,
            message: 'Contact deleted successfully',
            data: contact
        });
    } catch (error) {
        logger.error(`[WA Contacts] Failed to delete local contact ${req.params.id}:`, error);
        next(error);
    }
});

/**
 * @route POST /api/wa-marketing/contacts/upload
 * @desc Upload CSV of contacts and import into local DB
 */
router.post('/upload', upload.single('file'), async (req, res, next) => {
    try {
        ensureClient(req);
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No file uploaded' });
        }

        const results = [];
        let skipped = 0;
        let processed = 0;

        fs.createReadStream(req.file.path)
            .pipe(csv())
            .on('data', (data) => {
                const phone = data.phone || data.number || data.PhoneNumber || data['Phone Number'];
                const name = data.name || data.Name || data.first_name || '';

                if (phone) {
                    results.push({
                        client_id: req.client.id,
                        phone: phone.replace(/[^0-9]/g, ''), // Sanitize phone to digits only
                        name: name,
                        tags: ['CSV Import'],
                        custom_attributes: {}
                    });
                }
            })
            .on('end', async () => {
                // Bulk operation ignoring duplicates (phone + client_id index)
                const bulkOps = results.map(contact => ({
                    updateOne: {
                        filter: { client_id: req.client.id, phone: contact.phone },
                        update: { $setOnInsert: contact },
                        upsert: true
                    }
                }));

                try {
                    if (bulkOps.length > 0) {
                        const bulkResult = await WaContact.bulkWrite(bulkOps, { ordered: false });
                        processed = bulkResult.upsertedCount + bulkResult.modifiedCount;
                        skipped = results.length - processed;
                    }

                    // Cleanup temp file
                    fs.unlink(req.file.path, () => { });

                    res.json({
                        success: true,
                        message: 'Contacts uploaded successfully',
                        data: {
                            processed_records: processed,
                            failed_records: skipped,
                            total_submitted: results.length
                        }
                    });
                } catch (bulkError) {
                    fs.unlink(req.file.path, () => { });
                    logger.error('[WA Contacts] Bulk write failed:', bulkError);
                    next(bulkError);
                }
            })
            .on('error', (err) => {
                fs.unlink(req.file.path, () => { });
                logger.error('[WA Contacts] CSV parse failed:', err);
                next(err);
            });

    } catch (error) {
        if (req.file) {
            fs.unlink(req.file.path, () => { });
        }
        logger.error('[WA Contacts] Failed to upload CSV locally:', error);
        next(error);
    }
});

module.exports = router;
