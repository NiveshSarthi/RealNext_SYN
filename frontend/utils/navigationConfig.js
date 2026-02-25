
import {
    HomeIcon,
    UsersIcon,
    ChatBubbleLeftRightIcon,
    BuildingStorefrontIcon,
    DocumentTextIcon,
    Cog6ToothIcon,
    ChartBarIcon,
    UserGroupIcon,
    CreditCardIcon,
    ShoppingBagIcon,
    ChatBubbleBottomCenterTextIcon,
    BoltIcon,
    QueueListIcon,
    MegaphoneIcon,
    AcademicCapIcon
} from '@heroicons/react/24/outline';

export const USER_NAVIGATION = [
    { id: 'dashboard', label: 'Dashboard', href: '/dashboard', icon: HomeIcon },
    {
        id: 'lms',
        label: 'LMS',
        icon: AcademicCapIcon,
        children: [
            { id: 'lms.leads', label: 'Leads', href: '/lms/leads', icon: UsersIcon },
            { id: 'lms.followups', label: 'Follow-Ups', href: '/lms/followups', icon: QueueListIcon },
            { id: 'lms.lead_center', label: 'Lead Center', href: '/lms/lead-center', icon: UserGroupIcon },
            { id: 'lms.lms', label: 'LMS', href: '/lms', icon: AcademicCapIcon },
            { id: 'lms.network', label: 'Network', href: '/network', icon: UserGroupIcon },
        ]
    },
    {
        id: 'wa_marketing',
        label: 'WA Marketing',
        icon: ChatBubbleLeftRightIcon,
        children: [
            // { id: 'wa_marketing.contacts', label: 'Audience & Contacts', href: '/wa-marketing/contacts', icon: UsersIcon },
            // { id: 'wa_marketing.live_chat', label: 'Shared Inbox', href: '/wa-marketing/live-chat', icon: ChatBubbleLeftRightIcon },
            { id: 'wa_marketing.campaigns', label: 'Campaigns', href: '/wa-marketing/campaigns', icon: MegaphoneIcon },
            { id: 'wa_marketing.flows', label: 'Flows', href: '/wa-marketing/flows', icon: BoltIcon },
            { id: 'wa_marketing.templates', label: 'Templates', href: '/wa-marketing/templates', icon: DocumentTextIcon },
            // { id: 'wa_marketing.settings', label: 'Settings', href: '/wa-marketing/settings', icon: Cog6ToothIcon },
            // { id: 'wa_marketing.quick_replies', label: 'Quick Replies', href: '/wa-marketing/quick-replies', icon: ChatBubbleBottomCenterTextIcon },
            // { id: 'wa_marketing.meta_ads', label: 'Meta Ads', href: '/wa-marketing/meta-ads', icon: MegaphoneIcon },
        ]
    },
    {
        id: 'inventory',
        label: 'Inventory',
        icon: ShoppingBagIcon,
        children: [
            { id: 'inventory.catalog', label: 'Catalog', href: '/inventory', icon: ShoppingBagIcon },
        ]
    },
    { id: 'drip_matrix', label: 'Drip Matrix', href: '/drip-sequences', icon: QueueListIcon },
    { id: 'analytics', label: 'Analytics', href: '/analytics', icon: ChartBarIcon },
    {
        id: 'team',
        label: 'Team',
        icon: UserGroupIcon,
        children: [
            { id: 'team.members', label: 'Members', href: '/team', icon: UsersIcon },
            { id: 'team.roles', label: 'Roles', href: '/team/roles', icon: Cog6ToothIcon },
        ]
    },
    { id: 'payments', label: 'Payments', href: '/payments', icon: CreditCardIcon },
    { id: 'settings', label: 'Settings', href: '/settings', icon: Cog6ToothIcon },
];

export const ADMIN_NAVIGATION = [
    { id: 'admin.overview', label: 'Overview', href: '/admin', icon: HomeIcon },
    { id: 'admin.clients', label: 'Clients', href: '/admin/clients', icon: BuildingStorefrontIcon },
    { id: 'admin.plans', label: 'Plans', href: '/admin/plans', icon: CreditCardIcon },
    // Add feature modules for Super Admin convenience
    {
        id: 'lms',
        label: 'LMS',
        icon: AcademicCapIcon,
        children: [
            { id: 'lms.leads', label: 'Leads', href: '/lms/leads', icon: UsersIcon },
            { id: 'lms.followups', label: 'Follow-Ups', href: '/lms/followups', icon: QueueListIcon },
            { id: 'lms.lead_center', label: 'Lead Center', href: '/lms/lead-center', icon: UserGroupIcon },
            { id: 'lms.lms', label: 'LMS', href: '/lms', icon: AcademicCapIcon },
            { id: 'lms.network', label: 'Network', href: '/network', icon: UserGroupIcon },
        ]
    },
    {
        id: 'wa_marketing',
        label: 'WA Marketing',
        icon: ChatBubbleLeftRightIcon,
        children: [
            // { id: 'wa_marketing.contacts', label: 'Audience & Contacts', href: '/wa-marketing/contacts', icon: UsersIcon },
            // { id: 'wa_marketing.live_chat', label: 'Shared Inbox', href: '/wa-marketing/live-chat', icon: ChatBubbleLeftRightIcon },
            { id: 'wa_marketing.campaigns', label: 'Campaigns', href: '/wa-marketing/campaigns', icon: MegaphoneIcon },
            { id: 'wa_marketing.flows', label: 'Flows', href: '/wa-marketing/flows', icon: BoltIcon },
            { id: 'wa_marketing.templates', label: 'Templates', href: '/wa-marketing/templates', icon: DocumentTextIcon },
            // { id: 'wa_marketing.settings', label: 'Settings', href: '/wa-marketing/settings', icon: Cog6ToothIcon },
            // { id: 'wa_marketing.quick_replies', label: 'Quick Replies', href: '/wa-marketing/quick-replies', icon: ChatBubbleBottomCenterTextIcon },
            // { id: 'wa_marketing.meta_ads', label: 'Meta Ads', href: '/wa-marketing/meta-ads', icon: MegaphoneIcon },
        ]
    },
    {
        id: 'inventory',
        label: 'Inventory',
        icon: ShoppingBagIcon,
        children: [
            { id: 'inventory.catalog', label: 'Catalog', href: '/inventory', icon: ShoppingBagIcon },
        ]
    },
    { id: 'admin.analytics', label: 'Analytics', href: '/admin/analytics', icon: ChartBarIcon },
    {
        id: 'admin.team',
        label: 'Team',
        icon: UserGroupIcon,
        children: [
            { id: 'admin.team.members', label: 'Members', href: '/admin/team', icon: UsersIcon },
            { id: 'admin.team.roles', label: 'Roles', href: '/admin/roles', icon: Cog6ToothIcon },
        ]
    },
    { id: 'admin.settings', label: 'Settings', href: '/admin/settings', icon: Cog6ToothIcon },
];

// Helper to get raw config for mapping
export const getNavigationConfig = () => USER_NAVIGATION;
