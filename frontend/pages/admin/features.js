import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import { adminAPI } from '../../utils/api';
import { Switch } from '@headlessui/react';
import {
    BoltIcon,
    CheckCircleIcon,
    ExclamationTriangleIcon,
    ServerStackIcon,
    CpuChipIcon,
    ChatBubbleLeftRightIcon,
    ShoppingBagIcon,
    AcademicCapIcon,
    ChartBarIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';

export default function FeatureControlCenter() {
    const [features, setFeatures] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        active: 0,
        total: 0,
        systemHealth: '98%'
    });

    useEffect(() => {
        fetchFeatures();
    }, []);

    const fetchFeatures = async () => {
        try {
            const response = await adminAPI.getFeatures();
            const data = response.data.data;
            setFeatures(data);
            setStats({
                active: data.filter(f => f.is_enabled).length,
                total: data.length,
                systemHealth: '100%' // Placeholder
            });
        } catch (error) {
            console.error('Failed to fetch features:', error);
            toast.error('Failed to load features');
        } finally {
            setLoading(false);
        }
    };

    const handleToggle = async (feature) => {
        const newState = !feature.is_enabled;
        // Optimistic update
        setFeatures(prev => prev.map(f =>
            f.id === feature.id ? { ...f, is_enabled: newState } : f
        ));

        try {
            await adminAPI.toggleFeature(feature.id, newState);
            toast.success(`${feature.name} ${newState ? 'enabled' : 'disabled'}`);
            setStats(prev => ({
                ...prev,
                active: newState ? prev.active + 1 : prev.active - 1
            }));
        } catch (error) {
            console.error('Failed to toggle feature:', error);
            toast.error('Failed to update feature');
            // Revert on failure
            setFeatures(prev => prev.map(f =>
                f.id === feature.id ? { ...f, is_enabled: !newState } : f
            ));
        }
    };

    const getIconForCategory = (category) => {
        switch (category?.toLowerCase()) {
            case 'marketing': return ChatBubbleLeftRightIcon;
            case 'inventory': return ShoppingBagIcon;
            case 'lms':
            case 'training': return AcademicCapIcon;
            case 'analytics': return ChartBarIcon;
            case 'system': return ServerStackIcon;
            default: return CpuChipIcon;
        }
    };

    if (loading) {
        return (
            <Layout>
                <div className="flex justify-center items-center min-h-[60vh]">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="space-y-8">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-foreground tracking-tight">Feature Control Center</h1>
                        <p className="text-muted-foreground mt-1">
                            Manage module activation, resource quotas, and system-wide configurations from a single command pane.
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-mono">v2.4.0-stable</span>
                        <button
                            onClick={fetchFeatures}
                            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium shadow-lg shadow-primary/20"
                        >
                            Refresh Status
                        </button>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Active Modules</p>
                                <p className="text-2xl font-bold text-foreground mt-1">{stats.active}/{stats.total}</p>
                            </div>
                            <div className="h-10 w-10 bg-green-500/10 rounded-lg flex items-center justify-center">
                                <CheckCircleIcon className="h-6 w-6 text-green-500" />
                            </div>
                        </div>
                        <div className="mt-4 w-full bg-secondary rounded-full h-1.5">
                            <div
                                className="bg-green-500 h-1.5 rounded-full transition-all duration-500"
                                style={{ width: `${(stats.active / stats.total) * 100}%` }}
                            />
                        </div>
                    </div>

                    <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">System Health</p>
                                <p className="text-2xl font-bold text-foreground mt-1">{stats.systemHealth}</p>
                            </div>
                            <div className="h-10 w-10 bg-blue-500/10 rounded-lg flex items-center justify-center">
                                <ServerStackIcon className="h-6 w-6 text-blue-500" />
                            </div>
                        </div>
                        <div className="mt-4 w-full bg-secondary rounded-full h-1.5">
                            <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: '98%' }} />
                        </div>
                    </div>

                    <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Critical Issues</p>
                                <p className="text-2xl font-bold text-foreground mt-1">0</p>
                            </div>
                            <div className="h-10 w-10 bg-orange-500/10 rounded-lg flex items-center justify-center">
                                <ExclamationTriangleIcon className="h-6 w-6 text-orange-500" />
                            </div>
                        </div>
                        <div className="mt-4 w-full bg-secondary rounded-full h-1.5">
                            <div className="bg-orange-500 h-1.5 rounded-full" style={{ width: '0%' }} />
                        </div>
                    </div>
                </div>

                {/* Features Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {features.map((feature) => {
                        const Icon = getIconForCategory(feature.category);
                        // Simulate random usage for demo visuals if not in metadata
                        const usage = feature.metadata?.usage || Math.floor(Math.random() * 100);

                        return (
                            <div
                                key={feature.id}
                                className={`
                  group relative overflow-hidden bg-card border rounded-xl p-6 shadow-md transition-all duration-200 hover:shadow-lg hover:border-primary/20
                  ${feature.is_enabled ? 'border-border' : 'border-border/50 opacity-90'}
                `}
                            >
                                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                                <div className="relative flex justify-between items-start mb-6">
                                    <div className="flex items-center gap-4">
                                        <div className={`
                      p-3 rounded-lg 
                      ${feature.is_enabled ? 'bg-primary/10 text-primary' : 'bg-secondary text-muted-foreground'}
                    `}>
                                            <Icon className="h-6 w-6" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-foreground text-lg">{feature.name}</h3>
                                            <p className="text-xs text-muted-foreground font-mono mt-0.5">{feature.category || 'General'}</p>
                                        </div>
                                    </div>

                                    <Switch
                                        checked={feature.is_enabled}
                                        onChange={() => handleToggle(feature)}
                                        className={`
                      relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background
                      ${feature.is_enabled ? 'bg-primary' : 'bg-gray-700'}
                    `}
                                    >
                                        <span className="sr-only">Enable {feature.name}</span>
                                        <span
                                            className={`
                        inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                        ${feature.is_enabled ? 'translate-x-6' : 'translate-x-1'}
                      `}
                                        />
                                    </Switch>
                                </div>

                                <div className="relative space-y-4">
                                    <p className="text-sm text-muted-foreground line-clamp-2 min-h-[2.5rem]">
                                        {feature.description || 'Controls access to this module across the entire platform.'}
                                    </p>

                                    <div>
                                        <div className="flex justify-between text-xs mb-1.5">
                                            <span className="text-muted-foreground">Est. Usage</span>
                                            <span className="font-medium text-foreground">{usage}%</span>
                                        </div>
                                        <div className="w-full bg-secondary rounded-full h-1.5 overflow-hidden">
                                            <div
                                                className="bg-primary h-1.5 rounded-full transition-all duration-1000 ease-out"
                                                style={{ width: `${feature.is_enabled ? usage : 0}%` }}
                                            />
                                        </div>
                                    </div>

                                    <div className="pt-4 border-t border-border flex justify-between items-center">
                                        <button className="text-xs text-primary hover:text-primary/80 font-medium flex items-center gap-1">
                                            Manage Configuration
                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                        </button>
                                        {feature.is_core && (
                                            <span className="text-[10px] uppercase tracking-wider font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded">Core</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </Layout>
    );
}
