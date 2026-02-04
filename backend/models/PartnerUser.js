const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const PartnerUser = sequelize.define('partner_users', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    partner_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'partners',
            key: 'id'
        }
    },
    user_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id'
        }
    },
    role: {
        type: DataTypes.STRING(50),
        defaultValue: 'admin',
        validate: {
            isIn: [['admin', 'manager', 'viewer']]
        }
    },
    permissions: {
        type: DataTypes.JSONB,
        defaultValue: []
    },
    is_owner: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    }
}, {
    tableName: 'partner_users',
    timestamps: true,
    underscored: true,
    indexes: [
        { fields: ['partner_id'] },
        { fields: ['user_id'] },
        { unique: true, fields: ['partner_id', 'user_id'] }
    ]
});

module.exports = PartnerUser;
