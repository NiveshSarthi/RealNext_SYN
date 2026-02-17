const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { CatalogItem } = require('../../models');
const { authenticate } = require('../../middleware/auth');
const { requireClientAccess } = require('../../middleware/roles');
const { enforceClientScope } = require('../../middleware/scopeEnforcer');
const { requireFeature } = require('../../middleware/featureGate');
const { auditAction } = require('../../middleware/auditLogger');
const { ApiError } = require('../../middleware/errorHandler');
const { validate, validators } = require('../../utils/validators');

// Public routes (no authentication required)
router.get('/template', (req, res) => {
  const templateData = `name,description,category,price,currency,bhk,area,image_url
"Sunrise Apartments","Whitefield, Bangalore","Apartment",15000000,INR,3,1850,"https://example.com/image1.jpg"
"Ocean View Villa","Juhu, Mumbai","Villa",50000000,INR,4,3500,"https://example.com/image2.jpg"
"Commercial Plot","Gurgaon","Plot",25000000,INR,,5000,"https://example.com/image3.jpg"
"Office Space","Connaught Place, Delhi","Commercial",75000000,INR,,2500,"https://example.com/image4.jpg"`;

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="property_catalog_template.csv"');
  res.send(templateData);
});

// Middleware (applied to all routes below)
router.use(authenticate, requireClientAccess, enforceClientScope);

// Multer configuration for CSV uploads
const upload = multer({
  dest: 'uploads/',
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'));
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

/**
 * @route GET /api/catalog
 * @desc Get catalog items
 */
router.get('/', requireFeature('catalog'), async (req, res, next) => {
    try {
        const { category, search, status } = req.query;
        const query = { client_id: req.client.id };

        if (status) query.status = status;
        if (category) query.category = category;
        if (search) {
            const searchRegex = new RegExp(search, 'i');
            query.$or = [
                { name: searchRegex },
                { description: searchRegex }
            ];
        }

        const items = await CatalogItem.find(query)
            .sort({ created_at: -1 });

        res.json({
            success: true,
            data: items
        });
    } catch (error) {
        next(error);
    }
});

/**
 * @route GET /api/catalog/:id
 * @desc Get catalog item details
 */
router.get('/:id', requireFeature('catalog'), async (req, res, next) => {
    try {
        const item = await CatalogItem.findOne({
            _id: req.params.id,
            client_id: req.client.id
        });

        if (!item) throw ApiError.notFound('Item not found');

        res.json({
            success: true,
            data: item
        });
    } catch (error) {
        next(error);
    }
});

/**
 * @route POST /api/catalog
 * @desc Create catalog item
 */
router.post('/',
    requireFeature('catalog'),
    [
        validators.requiredString('name')
    ],
    validate,
    auditAction('create', 'catalog_item'),
    async (req, res, next) => {
        try {
            const item = await CatalogItem.create({
                client_id: req.client.id,
                ...req.body,
                created_by: req.user.id
            });

            res.status(201).json({
                success: true,
                data: item
            });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * @route PUT /api/catalog/:id
 * @desc Update catalog item
 */
router.put('/:id',
    requireFeature('catalog'),
    auditAction('update', 'catalog_item'),
    async (req, res, next) => {
        try {
            const item = await CatalogItem.findOne({
                _id: req.params.id,
                client_id: req.client.id
            });

            if (!item) throw ApiError.notFound('Item not found');

            Object.assign(item, req.body);
            await item.save();

            res.json({
                success: true,
                data: item
            });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * @route DELETE /api/catalog/:id
 * @desc Delete catalog item
 */
router.delete('/:id',
    requireFeature('catalog'),
    auditAction('delete', 'catalog_item'),
    async (req, res, next) => {
        try {
            const item = await CatalogItem.findOne({
                _id: req.params.id,
                client_id: req.client.id
            });

            if (!item) throw ApiError.notFound('Item not found');

            await item.deleteOne();

            res.json({
                success: true,
                message: 'Item deleted'
            });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * @route POST /api/catalog/:id/sync
 * @desc Sync item to WhatsApp Catalog (Mock)
 */
router.post('/:id/sync',
    requireFeature('catalog'),
    auditAction('sync', 'catalog_item'),
    async (req, res, next) => {
        try {
            const item = await CatalogItem.findOne({
                _id: req.params.id,
                client_id: req.client.id
            });

            if (!item) throw ApiError.notFound('Item not found');

            // Mock sync logic
            item.wa_catalog_id = `wa_prod_${Date.now()}`;
            item.metadata = { ...item.metadata, last_sync: new Date() };
            await item.save();

            res.json({
                success: true,
                message: 'Item synced to WhatsApp'
            });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * @route GET /api/catalog/stats/overview
 * @desc Catalog stats
 */
router.get('/stats/overview', requireFeature('catalog'), async (req, res, next) => {
    try {
        const stats = await CatalogItem.aggregate([
            { $match: { client_id: new mongoose.Types.ObjectId(req.client.id) } },
            {
                $group: {
                    _id: null,
                    total_items: { $sum: 1 },
                    active_items: {
                        $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
                    }
                }
            }
        ]);

        res.json({
            success: true,
            data: {
                total_items: stats[0]?.total_items || 0,
                active_items: stats[0]?.active_items || 0,
                synced_items: 0 // Mock
            }
        });
    } catch (error) {
        next(error);
    }
});

/**
 * @route POST /api/catalog/bulk-import
 * @desc Bulk import catalog items from CSV
 */
router.post('/bulk-import',
  requireFeature('catalog'),
  upload.single('csvFile'),
  auditAction('bulk_import', 'catalog_items'),
  async (req, res, next) => {
    try {
      if (!req.file) {
        throw ApiError.badRequest('No CSV file uploaded');
      }

      const results = {
        success: 0,
        errors: [],
        total: 0
      };

      const items = [];

      // Parse CSV file
      await new Promise((resolve, reject) => {
        fs.createReadStream(req.file.path)
          .pipe(csv())
          .on('data', (row) => {
            results.total++;
            try {
              const item = processCsvRow(row, req.client.id, req.user.id);
              if (item) {
                items.push(item);
              }
            } catch (error) {
              results.errors.push({
                row: results.total,
                error: error.message,
                data: row
              });
            }
          })
          .on('end', () => {
            resolve();
          })
          .on('error', (error) => {
            reject(error);
          });
      });

      // Bulk insert valid items
      if (items.length > 0) {
        try {
          const insertedItems = await CatalogItem.insertMany(items, { ordered: false });
          results.success = insertedItems.length;
        } catch (bulkError) {
          // Handle partial failures
          if (bulkError.writeErrors) {
            bulkError.writeErrors.forEach(error => {
              results.errors.push({
                row: 'unknown',
                error: error.errmsg,
                data: items[error.index]
              });
            });
            results.success = items.length - bulkError.writeErrors.length;
          } else {
            throw bulkError;
          }
        }
      }

      // Clean up uploaded file
      fs.unlinkSync(req.file.path);

      res.json({
        success: true,
        data: results,
        message: `Imported ${results.success} items successfully${results.errors.length > 0 ? `, ${results.errors.length} errors` : ''}`
      });

    } catch (error) {
      // Clean up file on error
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      next(error);
    }
  }
);

/**
 * Process CSV row into catalog item
 */
function processCsvRow(row, clientId, userId) {
  // Validate required fields
  if (!row.name || !row.name.trim()) {
    throw new Error('Property name is required');
  }

  // Parse and validate price
  let price = null;
  if (row.price && row.price.trim()) {
    price = parseFloat(row.price.trim());
    if (isNaN(price) || price < 0) {
      throw new Error('Invalid price format');
    }
  }

  // Parse BHK and area
  let bhk = null;
  let area = null;

  if (row.bhk && row.bhk.trim()) {
    bhk = parseInt(row.bhk.trim());
    if (isNaN(bhk) || bhk < 0) {
      throw new Error('Invalid BHK format');
    }
  }

  if (row.area && row.area.trim()) {
    area = parseInt(row.area.trim());
    if (isNaN(area) || area < 0) {
      throw new Error('Invalid area format');
    }
  }

  // Validate category
  const validCategories = ['Apartment', 'Villa', 'Plot', 'Commercial'];
  const category = row.category && validCategories.includes(row.category.trim())
    ? row.category.trim()
    : 'Apartment';

  // Build properties object
  const properties = {};
  if (bhk !== null) properties.bhk = bhk;
  if (area !== null) properties.area = area;

  // Build images array
  const images = [];
  if (row.image_url && row.image_url.trim()) {
    images.push(row.image_url.trim());
  }

  return {
    client_id: clientId,
    name: row.name.trim(),
    description: row.description ? row.description.trim() : '',
    category: category,
    price: price,
    currency: row.currency && row.currency.trim() ? row.currency.trim() : 'INR',
    properties: properties,
    images: images,
    status: 'active',
    created_by: userId
  };
}

module.exports = router;
