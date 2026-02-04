// Role hierarchy constants
const ROLES = {
    SUPER_ADMIN: 'super_admin',
    PARTNER_ADMIN: 'partner_admin',
    PARTNER_MANAGER: 'partner_manager',
    PARTNER_VIEWER: 'partner_viewer',
    TENANT_ADMIN: 'tenant_admin',
    TENANT_MANAGER: 'tenant_manager',
    TENANT_USER: 'tenant_user'
};

// Subscription statuses
const SUBSCRIPTION_STATUS = {
    TRIAL: 'trial',
    ACTIVE: 'active',
    PAST_DUE: 'past_due',
    SUSPENDED: 'suspended',
    CANCELLED: 'cancelled',
    EXPIRED: 'expired'
};

// Partner statuses
const PARTNER_STATUS = {
    ACTIVE: 'active',
    SUSPENDED: 'suspended',
    INACTIVE: 'inactive'
};

// Tenant statuses
const TENANT_STATUS = {
    ACTIVE: 'active',
    SUSPENDED: 'suspended',
    CANCELLED: 'cancelled'
};

// User statuses
const USER_STATUS = {
    ACTIVE: 'active',
    SUSPENDED: 'suspended',
    PENDING: 'pending'
};

// Environment types
const ENVIRONMENTS = {
    PRODUCTION: 'production',
    DEMO: 'demo',
    STAGING: 'staging'
};

// Feature codes (must match database)
const FEATURES = {
    LEADS: 'leads',
    CAMPAIGNS: 'campaigns',
    TEMPLATES: 'templates',
    WORKFLOWS: 'workflows',
    ANALYTICS: 'analytics',
    NETWORK: 'network',
    QUICK_REPLIES: 'quick_replies',
    CATALOG: 'catalog',
    LMS: 'lms',
    META_ADS: 'meta_ads',
    DRIP_SEQUENCES: 'drip_sequences',
    WHITE_LABEL: 'white_label',
    API_ACCESS: 'api_access'
};

// Lead statuses
const LEAD_STATUS = {
    NEW: 'new',
    CONTACTED: 'contacted',
    QUALIFIED: 'qualified',
    PROPOSAL: 'proposal',
    NEGOTIATION: 'negotiation',
    WON: 'won',
    LOST: 'lost'
};

// Campaign statuses
const CAMPAIGN_STATUS = {
    DRAFT: 'draft',
    SCHEDULED: 'scheduled',
    RUNNING: 'running',
    COMPLETED: 'completed',
    FAILED: 'failed',
    PAUSED: 'paused'
};

// Workflow statuses
const WORKFLOW_STATUS = {
    ACTIVE: 'active',
    INACTIVE: 'inactive',
    DRAFT: 'draft'
};

// Payment statuses
const PAYMENT_STATUS = {
    PENDING: 'pending',
    COMPLETED: 'completed',
    FAILED: 'failed',
    REFUNDED: 'refunded'
};

// Invoice statuses
const INVOICE_STATUS = {
    PENDING: 'pending',
    PAID: 'paid',
    FAILED: 'failed',
    REFUNDED: 'refunded'
};

// Network connection statuses
const CONNECTION_STATUS = {
    PENDING: 'pending',
    ACCEPTED: 'accepted',
    REJECTED: 'rejected',
    BLOCKED: 'blocked'
};

// Permission actions
const PERMISSIONS = {
    READ: 'read',
    WRITE: 'write',
    DELETE: 'delete',
    ADMIN: 'admin'
};

// Audit action types
const AUDIT_ACTIONS = {
    CREATE: 'create',
    UPDATE: 'update',
    DELETE: 'delete',
    LOGIN: 'login',
    LOGOUT: 'logout',
    LOGIN_FAILED: 'login_failed',
    PASSWORD_CHANGE: 'password_change',
    PASSWORD_RESET: 'password_reset',
    SUBSCRIPTION_CHANGE: 'subscription_change',
    PAYMENT: 'payment'
};

module.exports = {
    ROLES,
    SUBSCRIPTION_STATUS,
    PARTNER_STATUS,
    TENANT_STATUS,
    USER_STATUS,
    ENVIRONMENTS,
    FEATURES,
    LEAD_STATUS,
    CAMPAIGN_STATUS,
    WORKFLOW_STATUS,
    PAYMENT_STATUS,
    INVOICE_STATUS,
    CONNECTION_STATUS,
    PERMISSIONS,
    AUDIT_ACTIONS
};
