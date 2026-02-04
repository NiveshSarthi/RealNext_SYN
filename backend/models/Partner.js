const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Partner = sequelize.define('partners', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
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
        unique: true,
        validate: {
            isEmail: true
        }
    },
    domain: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    subdomain: {
        type: DataTypes.STRING(100),
        allowNull: true,
        unique: true
    },
    referral_code: {
        type: DataTypes.STRING(50),
        allowNull: true,
        unique: true
    },
    logo_url: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    primary_color: {
        type: DataTypes.STRING(7),
        defaultValue: '#F97316'
    },
    secondary_color: {
        type: DataTypes.STRING(7),
        allowNull: true
    },
    status: {
        type: DataTypes.STRING(20),
        defaultValue: 'active',
        validate: {
            isIn: [['active', 'suspended', 'inactive']]
        }
    },
    commission_rate: {
        type: DataTypes.DECIMAL(5, 2),
        defaultValue: 0
    },
    settings: {
        type: DataTypes.JSONB,
        defaultValue: {}
    }
}, {
    tableName: 'partners',
    timestamps: true,
    paranoid: true,
    underscored: true,
    indexes: [
        { fields: ['slug'] },
        { fields: ['email'] },
        { fields: ['referral_code'] },
        { fields: ['status'] }
    ]
});

// Generate unique slug from name
Partner.beforeValidate(async (partner) => {
    if (!partner.slug && partner.name) {
        let baseSlug = partner.name.toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '');

        let slug = baseSlug;
        let counter = 1;

        while (await Partner.findOne({ where: { slug } })) {
            slug = `${baseSlug}-${counter}`;
            counter++;
        }

        partner.slug = slug;
    }

    // Generate referral code if not provided
    if (!partner.referral_code) {
        partner.referral_code = `REF-${partner.slug.toUpperCase().substring(0, 6)}-${Date.now().toString(36).toUpperCase()}`;
    }
});

module.exports = Partner;
