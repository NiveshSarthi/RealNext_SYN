const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const bcrypt = require('bcryptjs');

const User = sequelize.define('users', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    email: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
        validate: {
            isEmail: true
        }
    },
    password_hash: {
        type: DataTypes.STRING(255),
        allowNull: true // Null for OAuth-only users
    },
    name: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    phone: {
        type: DataTypes.STRING(20),
        allowNull: true
    },
    avatar_url: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    google_id: {
        type: DataTypes.STRING(100),
        allowNull: true,
        unique: true
    },
    email_verified: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    system_role_id: {
        type: DataTypes.UUID,
        allowNull: true,
        comment: 'Role ID for Super Admin Team members'
    },
    is_super_admin: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    status: {
        type: DataTypes.STRING(20),
        defaultValue: 'active',
        validate: {
            isIn: [['active', 'suspended', 'pending']]
        }
    },
    last_login_at: {
        type: DataTypes.DATE,
        allowNull: true
    },
    metadata: {
        type: DataTypes.JSONB,
        defaultValue: {}
    }
}, {
    tableName: 'users',
    timestamps: true,
    paranoid: true, // Soft delete
    underscored: true,
    indexes: [
        { fields: ['email'] },
        { fields: ['google_id'] },
        { fields: ['status'] }
    ]
});

// Instance methods
User.prototype.validatePassword = async function (password) {
    if (!this.password_hash) return false;
    return bcrypt.compare(password, this.password_hash);
};

User.prototype.toSafeJSON = function () {
    const values = { ...this.get() };
    delete values.password_hash;
    return values;
};

// Hooks
User.beforeCreate(async (user) => {
    if (user.password_hash) {
        user.password_hash = await bcrypt.hash(user.password_hash, 12);
    }
});

User.beforeUpdate(async (user) => {
    if (user.changed('password_hash') && user.password_hash) {
        user.password_hash = await bcrypt.hash(user.password_hash, 12);
    }
});

module.exports = User;
