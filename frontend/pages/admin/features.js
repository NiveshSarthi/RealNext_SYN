import { useState } from 'react';
import Layout from '../../components/Layout';
import {
    CpuChipIcon,
    ChatBubbleLeftRightIcon,
    BoltIcon,
    BuildingOfficeIcon,
    ChartBarIcon,
    ShieldCheckIcon,
    ChevronDownIcon,
    ChevronUpIcon
} from '@heroicons/react/24/outline';
import Toggle from '../../components/ui/Switch';
import { Card } from '../../components/ui/Card';

const FeatureCard = ({ feature }) => {
    const [enabled, setEnabled] = useState(feature.enabled);
    const [expanded, setExpanded] = useState(false);

    return (
        <Card className={`group relative overflow-hidden transition-all duration-300 ${enabled ? 'border-primary/20' : 'border-border'}`}>
            {/* Top Level: Minimal Grid State */}
            <div className="p-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <div className={`p-3 rounded-xl transition-colors ${enabled ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                            <feature.icon className="h-6 w-6" />
                        </div>
                        <div>
                            <h3 className="text-lg font-display font-semibold text-foreground">{feature.name}</h3>
                            <p className="text-sm text-muted-foreground">{feature.plan} Tier</p>
                        </div>
                    </div>
                    <Toggle enabled={enabled} onChange={setEnabled} srTitle={`Enable ${feature.name}`} />
                </div>

                {/* Usage Bar (Always visible but compact) */}
                <div className="mt-6">
                    <div className="flex justify-between text-xs mb-2">
                        <span className="text-muted-foreground">Usage</span>
                        <span className="text-foreground font-medium">{feature.usage}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                        <div
                            className={`h-full rounded-full transition-all duration-500 ease-out ${enabled ? 'bg-primary' : 'bg-muted-foreground'}`}
                            style={{ width: `${feature.usage}%` }}
                        />
                    </div>
                </div>
            </div>

            {/* Expand/Collapse Trigger */}
            <button
                onClick={() => setExpanded(!expanded)}
                className="w-full py-2 flex items-center justify-center border-t border-border/50 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors"
            >
                {expanded ? (
                    <span className="flex items-center">Less Details <ChevronUpIcon className="h-3 w-3 ml-1" /></span>
                ) : (
                    <span className="flex items-center">Manage Configuration <ChevronDownIcon className="h-3 w-3 ml-1" /></span>
                )}
            </button>

            {/* Expanded Details (Intent-based) */}
            <div className={`
        bg-muted/10 border-t border-border/50 transition-all duration-500 ease-in-out overflow-hidden
        ${expanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}
      `}>
                <div className="p-6 space-y-6">
                    {/* Sub-features Grid */}
                    <div>
                        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Sub-features</h4>
                        <div className="space-y-3">
                            {feature.subFeatures.map((sub, idx) => (
                                <div key={idx} className="flex items-center justify-between text-sm">
                                    <span className="text-foreground">{sub.name}</span>
                                    <span className="text-xs px-2 py-0.5 rounded-full bg-border text-muted-foreground">{sub.limit || 'Unlimited'}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Quotas & Limits */}
                    <div>
                        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Rate Limits</h4>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-3 bg-background/50 rounded-lg border border-border/50">
                                <div className="text-xs text-muted-foreground">API Requests</div>
                                <div className="text-lg font-mono text-foreground mt-1">10k<span className="text-xs text-muted-foreground">/hr</span></div>
                            </div>
                            <div className="p-3 bg-background/50 rounded-lg border border-border/50">
                                <div className="text-xs text-muted-foreground">Concurrent</div>
                                <div className="text-lg font-mono text-foreground mt-1">50<span className="text-xs text-muted-foreground">/req</span></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Card>
    );
};

export default function FeatureControlCenter() {
    const features = [
        {
            id: 1,
            name: 'WhatsApp Automation',
            icon: ChatBubbleLeftRightIcon,
            plan: 'Business',
            enabled: true,
            usage: 78, // %
            subFeatures: [
                { name: 'Template Messages', limit: '10,000/mo' },
                { name: 'Unified Inbox', limit: '5 Seats' },
                { name: 'Auto-Replies', limit: 'Unlimited' }
            ]
        },
        {
            id: 2,
            name: 'Workflow Engine',
            icon: BoltIcon,
            plan: 'Enterprise',
            enabled: true,
            usage: 45,
            subFeatures: [
                { name: 'Active Flows', limit: '50' },
                { name: 'Steps per Flow', limit: 'Unlimited' },
                { name: 'Webhooks', limit: '100' }
            ]
        },
        {
            id: 3,
            name: 'Real Estate Cloud',
            icon: BuildingOfficeIcon,
            plan: 'Premium',
            enabled: false,
            usage: 0,
            subFeatures: [
                { name: 'Property Catalog', limit: '500 Listings' },
                { name: 'Lead Matching', limit: 'AI Powered' },
                { name: 'Site Visit Scheduler', limit: 'Unlimited' }
            ]
        },
        {
            id: 4,
            name: 'Advanced Analytics',
            icon: ChartBarIcon,
            plan: 'Pro',
            enabled: true,
            usage: 12,
            subFeatures: [
                { name: 'Custom Reports', limit: '10/mo' },
                { name: 'Data Export', limit: 'CSV, PDF' },
                { name: 'Retention', limit: '1 Year' }
            ]
        },
        {
            id: 5,
            name: 'Security Shield',
            icon: ShieldCheckIcon,
            plan: 'Enterprise',
            enabled: true,
            usage: 100,
            subFeatures: [
                { name: '2FA Enforcement', limit: 'Global' },
                { name: 'Audit Logs', limit: '90 Days' },
                { name: 'IP Whitelisting', limit: 'Enabled' }
            ]
        },
        {
            id: 6,
            name: 'API Gateway',
            icon: CpuChipIcon,
            plan: 'Business',
            enabled: true,
            usage: 64,
            subFeatures: [
                { name: 'Rate Limiting', limit: 'Standard' },
                { name: 'Custom Endpoints', limit: '5' },
                { name: 'Legacy Support', limit: 'Disabled' }
            ]
        }
    ];

    return (
        <Layout>
            <div className="space-y-8 animate-fade-in container-custom py-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold font-display tracking-tight text-foreground">Feature Control Center</h1>
                        <p className="mt-1 text-sm text-muted-foreground max-w-2xl">
                            Manage module activation, resource quotas, and system-wide configurations from a single command pane.
                        </p>
                    </div>
                    <div className="flex items-center space-x-3">
                        <span className="text-xs font-mono px-2 py-1 bg-muted rounded text-muted-foreground">v2.4.0-stable</span>
                        <button className="btn btn-primary">Save Changes</button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {features.map((feature) => (
                        <FeatureCard key={feature.id} feature={feature} />
                    ))}
                </div>
            </div>
        </Layout>
    );
}
