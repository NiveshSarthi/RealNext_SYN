import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'next/router';
import {
    QueueListIcon,
    PlayIcon,
    PauseIcon,
    ClockIcon,
    UserGroupIcon,
    PlusIcon
} from '@heroicons/react/24/outline';

export default function DripSequences() {
    const [sequences, setSequences] = useState([]);
    const [loading, setLoading] = useState(true);
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/');
        } else if (user) {
            fetchSequences();
        }
    }, [user, authLoading]);

    const fetchSequences = async () => {
        try {
            // const res = await dripSequencesAPI.getSequences();
            // setSequences(res.data.data || []);
            // Fallback mock data
            setSequences([
                { id: 1, name: 'New Lead Nurture', status: 'active', steps: 5, enrolled: 120 },
                { id: 2, name: 'Post-Visit Follow-up', status: 'active', steps: 3, enrolled: 45 },
                { id: 3, name: 'Cold Lead Revival', status: 'paused', steps: 4, enrolled: 0 }
            ]);
        } catch (error) {
            console.error("Drip fetch error", error);
            setSequences([]);
        } finally {
            setLoading(false);
        }
    };

    if (loading || authLoading) {
        return (
            <Layout>
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="space-y-6 animate-fade-in">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold font-display tracking-tight text-white">Drip Automation Sequences</h1>
                        <p className="mt-1 text-sm text-gray-400">Automate your lead nurturing with intelligent drip campaigns</p>
                    </div>
                    <button className="inline-flex items-center px-4 py-2.5 bg-primary text-black font-medium rounded-lg hover:bg-primary/90 transition-all shadow-glow-sm">
                        <PlusIcon className="h-5 w-5 mr-2" />
                        New Sequence
                    </button>
                </div>

                {/* Sequences List */}
                {sequences.length === 0 ? (
                    <div className="bg-card border border-border/50 rounded-xl p-12 text-center">
                        <QueueListIcon className="h-16 w-16 mx-auto text-gray-600 mb-4" />
                        <h3 className="text-lg font-semibold text-white mb-2">No sequences yet</h3>
                        <p className="text-gray-400 mb-6">Create your first drip sequence to start automating your lead nurturing</p>
                        <button className="inline-flex items-center px-4 py-2 bg-primary text-black font-medium rounded-lg hover:bg-primary/90 transition-all">
                            <PlusIcon className="h-5 w-5 mr-2" />
                            Create Sequence
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {sequences.map((seq) => (
                            <div
                                key={seq.id}
                                className="bg-card border border-border/50 rounded-xl p-6 hover:border-primary/30 transition-all duration-200 group cursor-pointer"
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-3">
                                            <h3 className="text-lg font-bold text-white group-hover:text-primary transition-colors">
                                                {seq.name}
                                            </h3>
                                            <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full ${seq.status === 'active'
                                                    ? 'bg-green-500/10 text-green-500 border border-green-500/20'
                                                    : 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20'
                                                }`}>
                                                {seq.status}
                                            </span>
                                        </div>

                                        <div className="flex flex-wrap items-center gap-6 text-sm">
                                            <div className="flex items-center text-gray-400">
                                                <QueueListIcon className="h-4 w-4 mr-1.5" />
                                                <span className="text-white font-medium mr-1">{seq.steps}</span>
                                                Step count
                                            </div>
                                            <div className="flex items-center text-gray-400">
                                                <UserGroupIcon className="h-4 w-4 mr-1.5" />
                                                <span className="text-white font-medium mr-1">{seq.enrolled}</span>
                                                Enrolled users
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 ml-4">
                                        {seq.status === 'active' ? (
                                            <div className="flex items-center text-green-500 text-sm font-medium">
                                                <PlayIcon className="h-4 w-4 mr-1.5" />
                                                Running
                                            </div>
                                        ) : (
                                            <div className="flex items-center text-yellow-500 text-sm font-medium">
                                                <PauseIcon className="h-4 w-4 mr-1.5" />
                                                Paused
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </Layout>
    );
}
