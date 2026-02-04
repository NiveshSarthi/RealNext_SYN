const { sequelize } = require('../config/database');

// Import all models
const User = require('./User');
const Partner = require('./Partner');
const PartnerUser = require('./PartnerUser');
const Tenant = require('./Tenant');
const TenantUser = require('./TenantUser');
const Feature = require('./Feature');
const Plan = require('./Plan');
const PlanFeature = require('./PlanFeature');
const PartnerAllowedPlan = require('./PartnerAllowedPlan');
const Subscription = require('./Subscription');
const SubscriptionUsage = require('./SubscriptionUsage');
const Invoice = require('./Invoice');
const Payment = require('./Payment');
const Lead = require('./Lead');
const Campaign = require('./Campaign');
const Template = require('./Template');
const Workflow = require('./Workflow');
const QuickReply = require('./QuickReply');
const CatalogItem = require('./CatalogItem');
const NetworkConnection = require('./NetworkConnection');
const AuditLog = require('./AuditLog');
const EnvironmentFlag = require('./EnvironmentFlag');
const BrandingSetting = require('./BrandingSetting');
const RefreshToken = require('./RefreshToken');
const LoginHistory = require('./LoginHistory');

// =====================
// PARTNER ASSOCIATIONS
// =====================

// Partner has many Tenants
Partner.hasMany(Tenant, { foreignKey: 'partner_id', as: 'tenants' });
Tenant.belongsTo(Partner, { foreignKey: 'partner_id', as: 'partner' });

// Partner has many PartnerUsers (team members)
Partner.hasMany(PartnerUser, { foreignKey: 'partner_id', as: 'partnerUsers' });
PartnerUser.belongsTo(Partner, { foreignKey: 'partner_id' });

// Partner has many allowed plans
Partner.hasMany(PartnerAllowedPlan, { foreignKey: 'partner_id', as: 'partnerPlans' });
PartnerAllowedPlan.belongsTo(Partner, { foreignKey: 'partner_id' });

// =====================
// USER ASSOCIATIONS
// =====================

// User can be in multiple Partners
User.hasMany(PartnerUser, { foreignKey: 'user_id', as: 'partnerMemberships' });
PartnerUser.belongsTo(User, { foreignKey: 'user_id' });

// User can be in multiple Tenants
User.hasMany(TenantUser, { foreignKey: 'user_id', as: 'tenantMemberships' });
TenantUser.belongsTo(User, { foreignKey: 'user_id' });

// User has many refresh tokens
User.hasMany(RefreshToken, { foreignKey: 'user_id', as: 'refreshTokens' });
RefreshToken.belongsTo(User, { foreignKey: 'user_id' });

// User has many login history
User.hasMany(LoginHistory, { foreignKey: 'user_id', as: 'loginHistory' });
LoginHistory.belongsTo(User, { foreignKey: 'user_id' });

// =====================
// TENANT ASSOCIATIONS
// =====================

// Tenant has many TenantUsers (team members)
Tenant.hasMany(TenantUser, { foreignKey: 'tenant_id', as: 'tenantUsers' });
TenantUser.belongsTo(Tenant, { foreignKey: 'tenant_id', as: 'Tenant' });

// Tenant has many Subscriptions
Tenant.hasMany(Subscription, { foreignKey: 'tenant_id', as: 'subscriptions' });
Subscription.belongsTo(Tenant, { foreignKey: 'tenant_id', as: 'tenant' });

// Tenant has many Invoices
Tenant.hasMany(Invoice, { foreignKey: 'tenant_id', as: 'invoices' });
Invoice.belongsTo(Tenant, { foreignKey: 'tenant_id', as: 'tenant' });

// Tenant has many Leads
Tenant.hasMany(Lead, { foreignKey: 'tenant_id', as: 'leads' });
Lead.belongsTo(Tenant, { foreignKey: 'tenant_id', as: 'tenant' });

// Tenant has many Campaigns
Tenant.hasMany(Campaign, { foreignKey: 'tenant_id', as: 'campaigns' });
Campaign.belongsTo(Tenant, { foreignKey: 'tenant_id', as: 'tenant' });

// Tenant has many Templates
Tenant.hasMany(Template, { foreignKey: 'tenant_id', as: 'templates' });
Template.belongsTo(Tenant, { foreignKey: 'tenant_id', as: 'tenant' });

// Tenant has many Workflows
Tenant.hasMany(Workflow, { foreignKey: 'tenant_id', as: 'workflows' });
Workflow.belongsTo(Tenant, { foreignKey: 'tenant_id', as: 'tenant' });

// Tenant has many QuickReplies
Tenant.hasMany(QuickReply, { foreignKey: 'tenant_id', as: 'quickReplies' });
QuickReply.belongsTo(Tenant, { foreignKey: 'tenant_id', as: 'tenant' });

// Tenant has many CatalogItems
Tenant.hasMany(CatalogItem, { foreignKey: 'tenant_id', as: 'catalogItems' });
CatalogItem.belongsTo(Tenant, { foreignKey: 'tenant_id', as: 'tenant' });

// =====================
// PLAN ASSOCIATIONS
// =====================

// Plan has many PlanFeatures
Plan.hasMany(PlanFeature, { foreignKey: 'plan_id', as: 'planFeatures' });
PlanFeature.belongsTo(Plan, { foreignKey: 'plan_id' });

// Plan has many Subscriptions
Plan.hasMany(Subscription, { foreignKey: 'plan_id', as: 'subscriptions' });
Subscription.belongsTo(Plan, { foreignKey: 'plan_id', as: 'plan' });

// Plan has many PartnerAllowedPlans
Plan.hasMany(PartnerAllowedPlan, { foreignKey: 'plan_id', as: 'partnerAllowedPlans' });
PartnerAllowedPlan.belongsTo(Plan, { foreignKey: 'plan_id' });

// =====================
// FEATURE ASSOCIATIONS
// =====================

// Feature has many PlanFeatures
Feature.hasMany(PlanFeature, { foreignKey: 'feature_id', as: 'planFeatures' });
PlanFeature.belongsTo(Feature, { foreignKey: 'feature_id' });

// =====================
// SUBSCRIPTION ASSOCIATIONS
// =====================

// Subscription has usage tracking
Subscription.hasMany(SubscriptionUsage, { foreignKey: 'subscription_id', as: 'usages' });
SubscriptionUsage.belongsTo(Subscription, { foreignKey: 'subscription_id' });

// Subscription has invoices
Subscription.hasMany(Invoice, { foreignKey: 'subscription_id', as: 'invoices' });
Invoice.belongsTo(Subscription, { foreignKey: 'subscription_id', as: 'subscription' });

// Subscription belongs to partner (for attribution)
Subscription.belongsTo(Partner, { foreignKey: 'partner_id', as: 'partner' });
Partner.hasMany(Subscription, { foreignKey: 'partner_id', as: 'subscriptions' });

// =====================
// INVOICE ASSOCIATIONS
// =====================

// Invoice has many Payments
Invoice.hasMany(Payment, { foreignKey: 'invoice_id', as: 'payments' });
Payment.belongsTo(Invoice, { foreignKey: 'invoice_id', as: 'invoice' });

// Invoice belongs to Partner (for commission tracking)
Invoice.belongsTo(Partner, { foreignKey: 'partner_id', as: 'partner' });
Partner.hasMany(Invoice, { foreignKey: 'partner_id', as: 'invoices' });

// =====================
// LEAD ASSOCIATIONS
// =====================

// Lead assigned to User
Lead.belongsTo(User, { foreignKey: 'assigned_to', as: 'assignedUser' });
User.hasMany(Lead, { foreignKey: 'assigned_to', as: 'assignedLeads' });

// =====================
// CAMPAIGN ASSOCIATIONS
// =====================

// Campaign created by User
Campaign.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });
User.hasMany(Campaign, { foreignKey: 'created_by', as: 'createdCampaigns' });

// =====================
// TEMPLATE ASSOCIATIONS
// =====================

// Template created by User
Template.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });
User.hasMany(Template, { foreignKey: 'created_by', as: 'createdTemplates' });

// =====================
// WORKFLOW ASSOCIATIONS
// =====================

// Workflow created by User
Workflow.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });
User.hasMany(Workflow, { foreignKey: 'created_by', as: 'createdWorkflows' });

// =====================
// QUICK REPLY ASSOCIATIONS
// =====================

// QuickReply created by User
QuickReply.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });
User.hasMany(QuickReply, { foreignKey: 'created_by', as: 'quickReplies' });

// =====================
// CATALOG ITEM ASSOCIATIONS
// =====================

// CatalogItem created by User
CatalogItem.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });
User.hasMany(CatalogItem, { foreignKey: 'created_by', as: 'catalogItems' });

// =====================
// NETWORK CONNECTIONS
// =====================

// Connection from Tenant/User
NetworkConnection.belongsTo(Tenant, { foreignKey: 'from_tenant_id', as: 'fromTenant' });
NetworkConnection.belongsTo(Tenant, { foreignKey: 'to_tenant_id', as: 'toTenant' });
NetworkConnection.belongsTo(User, { foreignKey: 'from_user_id', as: 'fromUser' });
NetworkConnection.belongsTo(User, { foreignKey: 'to_user_id', as: 'toUser' });

// =====================
// AUDIT LOG ASSOCIATIONS
// =====================

// AuditLog belongs to User, Tenant, Partner
AuditLog.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
AuditLog.belongsTo(Tenant, { foreignKey: 'tenant_id', as: 'tenant' });
AuditLog.belongsTo(Partner, { foreignKey: 'partner_id', as: 'partner' });

// =====================
// ENVIRONMENT FLAGS
// =====================

// EnvironmentFlag updated by User
EnvironmentFlag.belongsTo(User, { foreignKey: 'updated_by', as: 'updatedBy' });

// Export all models and sequelize instance
module.exports = {
    sequelize,
    User,
    Partner,
    PartnerUser,
    Tenant,
    TenantUser,
    Feature,
    Plan,
    PlanFeature,
    PartnerAllowedPlan,
    Subscription,
    SubscriptionUsage,
    Invoice,
    Payment,
    Lead,
    Campaign,
    Template,
    Workflow,
    QuickReply,
    CatalogItem,
    NetworkConnection,
    AuditLog,
    EnvironmentFlag,
    BrandingSetting,
    RefreshToken,
    LoginHistory
};
