import Link from 'next/link';
import {
    BuildingOfficeIcon,
    UsersIcon,
    CreditCardIcon,
    CpuChipIcon,
    ChartBarIcon,
    Cog6ToothIcon
} from '@heroicons/react/24/outline';
import Layout from '../../components/Layout';
import { Card } from '../../components/ui/Card';

const StatCard = ({ title, value, change, trend }) => (
    <Card className="p-6">
        <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
            {trend && (
                <span className={`text-xs px-2 py-1 rounded-full ${title === 'System Load' ? 'bg-yellow-500/10 text-yellow-500' : 'bg-green-500/10 text-green-500'}`}>
                    {change}
                </span>
            )}
        </div>
        <div className="mt-4 text-3xl font-bold text-foreground">{value}</div>
    </Card>
);

const QuickLinkCard = ({ title, description, icon: Icon, href }) => (
    <Link href={href} className="block group">
        <Card className="p-6 h-full hover:border-primary/50 transition-all duration-300 group-hover:shadow-lg">
            <div className="p-3 w-fit rounded-xl bg-primary/10 text-primary mb-4 group-hover:scale-110 transition-transform">
                <Icon className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">{title}</h3>
            <p className="text-sm text-muted-foreground">{description}</p>
        </Card>
    </Link>
);

export default function AdminDashboard() {
    // TODO: Fetch real stats from API
    const stats = [
        { title: 'Total Revenue', value: '$45,231', change: '+12.5%', trend: 'up' },
        { title: 'Active Tenants', value: '142', change: '+8', trend: 'up' },
        { title: 'Total Users', value: '1,234', change: '+24', trend: 'up' },
        { title: 'System Load', value: '34%', change: 'Normal', trend: 'flat' },
    ];

    const modules = [
        {
            title: 'Partner Management',
            description: 'Onboard and manage reseller partners, assign commissions, and track performance.',
            icon: UsersIcon,
            href: '/admin/partners'
        },
        {
            title: 'Tenant Overview',
            description: 'Monitor all tenant instances, manage subscriptions, and provide support.',
            icon: BuildingOfficeIcon,
            href: '/admin/tenants'
        },
        {
            title: 'Plans & Pricing',
            description: 'Configure subscription tiers, feature limits, and billing cycles.',
            icon: CreditCardIcon,
            href: '/admin/plans'
        },
        {
            title: 'Feature Control',
            description: 'Manage global feature flags, modules, and system-wide kill switches.',
            icon: CpuChipIcon,
            href: '/admin/features'
        },
        {
            title: 'System Analytics',
            description: 'Deep dive into platform usage, API performance, and error rates.',
            icon: ChartBarIcon,
            href: '/admin/analytics'
        },
        {
            title: 'Global Settings',
            description: 'Configure system environment, email servers, and security policies.',
            icon: Cog6ToothIcon,
            href: '/admin/settings'
        },
    ];

    return (
        <Layout>
            <div className="space-y-8 animate-fade-in container-custom py-8">
                <div>
                    <h1 className="text-3xl font-bold font-display tracking-tight text-foreground">Super Admin Dashboard</h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Overview of the entire platform ecosystem.
                    </p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {stats.map((stat, idx) => (
                        <StatCard key={idx} {...stat} />
                    ))}
                </div>

                {/* Quick Links / Modules */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {modules.map((module, idx) => (
                        <QuickLinkCard key={idx} {...module} />
                    ))}
                </div>
            </div>
        </Layout>
    );
}
