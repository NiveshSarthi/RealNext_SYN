const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Tenant = sequelize.define('tenants', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    partner_id: {
        type: DataTypes.UUID,
        allowNull: true, // Null for direct signups
        references: {
            model: 'partners',
            key: 'id'
        }
    },
    name: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    slug: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true
    },
    email: {
        type: DataTypes.STRING(255),
        allowNull: false,
        validate: {
            isEmail: true
        }
    },
    phone: {
        type: DataTypes.STRING(20),
        allowNull: true
    },
    logo_url: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    address: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    timezone: {
        type: DataTypes.STRING(50),
        defaultValue: 'UTC'
    },
    status: {
        type: DataTypes.STRING(20),
        defaultValue: 'active',
        validate: {
            isIn: [['active', 'suspended', 'cancelled']]
        }
    },
    environment: {
        type: DataTypes.STRING(20),
        defaultValue: 'production',
        validate: {
            isIn: [['production', 'demo', 'staging']]
        }
    },
    is_demo: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    settings: {
        type: DataTypes.JSONB,
        defaultValue: { features: {}, limits: {} }
    },
    metadata: {
        type: DataTypes.JSONB,
        defaultValue: {}
    }
}, {
    tableName: 'tenants',
    timestamps: true,
    paranoid: true,
    underscored: true,
    indexes: [
        { fields: ['partner_id'] },
        { fields: ['slug'] },
        { fields: ['status'] },
        { fields: ['environment'] }
    ]
});

// Generate unique slug from name
Tenant.beforeValidate(async (tenant) => {
    if (!tenant.slug && tenant.name) {
        let baseSlug = tenant.name.toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '');

        let slug = baseSlug;
        let counter = 1;

        while (await Tenant.findOne({ where: { slug } })) {
            slug = `${baseSlug}-${counter}`;
            counter++;
        }

        tenant.slug = slug;
    }
});

module.exports = Tenant;
