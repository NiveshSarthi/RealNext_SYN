// Import all models
const User = require('./User');
const Client = require('./Client');
const ClientUser = require('./ClientUser');
const Feature = require('./Feature');
const Plan = require('./Plan');
const PlanFeature = require('./PlanFeature');
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
const Role = require('./Role');
const Permission = require('./Permission');
const FacebookPageConnection = require('./FacebookPageConnection');
const FacebookLeadForm = require('./FacebookLeadForm');
const LeadStage = require('./LeadStage');
const FollowUp = require('./FollowUp');
const OTP = require('./OTP');

// New WFB Models
const WaSetting = require('./WaSetting');
const WaContact = require('./WaContact');
const WaConversation = require('./WaConversation');
const WaMessage = require('./WaMessage');

/**
 * Note: Associations in Mongoose are handled via 'ref' in schemas.
 * The index file now simply aggregates and exports all models.
 */

// Export all models
module.exports = {
    User,
    Client,
    ClientUser,
    Feature,
    Plan,
    PlanFeature,
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
    LoginHistory,
    Role,
    Permission,
    FacebookPageConnection,
    FacebookLeadForm,
    LeadStage,
    FollowUp,
    WaSetting,
    WaContact,
    WaConversation,
    WaMessage,
    OTP
};
