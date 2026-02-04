import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'next/router';
import { metaAdsAPI } from '../../utils/api';
import { ArrowLeftIcon, MegaphoneIcon } from '@heroicons/react/24/outline';

export default function NewCampaign() {
    const { user } = useAuth();
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [adAccounts, setAdAccounts] = useState([]);
    const [formData, setFormData] = useState({
        name: '',
        objective: 'LEADS',
        adAccount: '',
        dailyBudget: '',
        bidStrategy: 'LOWEST_COST_WITHOUT_CAP'
    });

    useEffect(() => {
        if (user) {
            fetchAdAccounts();
        }
    }, [user]);

    const fetchAdAccounts = async () => {
        try {
            const res = await metaAdsAPI.getAdAccounts();
            setAdAccounts(res.data.data || []);
            // Set default account if available
            if (res.data.data && res.data.data.length > 0) {
                setFormData(prev => ({ ...prev, adAccount: res.data.data[0].id }));
            }
        } catch (error) {
            console.error('Failed to fetch ad accounts:', error);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await metaAdsAPI.createCampaign(formData); // Note: api.js needs actual createCampaign method mapped
            // Wait, api.js has `getCampaigns` but `createCampaign` wasn't explicitly in the `api.js` file I customized earlier? 
            // Actually, I verified api.js and `metaAdsAPI` has `getCampaigns`. I need to ADD `createCampaign` to api.js?
            // Ah, my previous `api.js` read showed: 
            // getCampaigns, sendMessage, getCampaignPerformance, getAdAccounts... 
            // IT MISSES `createCampaign`. I must add it to api.js first or inline.
            // I will use `api.post` directly here if imports allow, or better, update `api.js` in next step.
            // For now I will assume I'll update api.js.
            router.push('/meta-ads');
        } catch (error) {
            console.error('Create failed:', error);
            alert('Failed to create campaign');
        } finally {
            setLoading(false);
        }
    };

    // Temporary helper until I update api.js
    const createCampaign = async (data) => {
        // This logical gap is handled by the fact I will update `api.js` in the next step.
        // But to make this file valid, I will import `api` (axios instance) if exported?
        // Actually `metaAdsAPI` acts as wrapper. I should update `api.js` BEFORE or AFTER.
        // Let's assume `metaAdsAPI.createCampaign` will exist.

        // Actually, let's look at `frontend/utils/api.js` again.
        // It DOES NOT have createCampaign.
        // I will use direct `axios` call here for safety or update `api.js` now.
        // I'll update `api.js` via tool in next step.
        await metaAdsAPI.createCampaign(data);
    };

    return (
        <Layout>
            <div className="max-w-3xl mx-auto space-y-8 animate-fade-in content-container pb-10">
                <div className="flex items-center space-x-4">
                    <button
                        onClick={() => router.back()}
                        className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                    >
                        <ArrowLeftIcon className="h-6 w-6" />
                    </button>
                    <h1 className="text-3xl font-bold font-display text-white">New Campaign</h1>
                </div>

                <div className="bg-[#161B22] border border-white/5 shadow-soft rounded-xl p-8">
                    <div className="flex items-center mb-8 pb-6 border-b border-white/10">
                        <div className="bg-blue-500/10 p-3 rounded-lg mr-4 border border-blue-500/20">
                            <MegaphoneIcon className="h-8 w-8 text-blue-500" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">Campaign Details</h2>
                            <p className="text-gray-400 text-sm">Configure your Meta Ads campaign settings.</p>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Ad Account */}
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">Ad Account</label>
                            <select
                                name="adAccount"
                                value={formData.adAccount}
                                onChange={handleChange}
                                className="block w-full rounded-lg border border-white/10 bg-black/30 text-white focus:border-primary focus:ring-1 focus:ring-primary sm:text-sm p-3 transition-colors"
                            >
                                {adAccounts.map(account => (
                                    <option key={account.id} value={account.id}>
                                        {account.name} ({account.currency})
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Campaign Name */}
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">Campaign Name</label>
                            <input
                                type="text"
                                name="name"
                                required
                                value={formData.name}
                                onChange={handleChange}
                                placeholder="e.g. Summer Sale Promotion"
                                className="block w-full rounded-lg border border-white/10 bg-black/30 text-white placeholder-gray-600 focus:border-primary focus:ring-1 focus:ring-primary sm:text-sm p-3 transition-colors"
                            />
                        </div>

                        {/* Objective */}
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">Campaign Objective</label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {['LEADS', 'TRAFFIC', 'SALES', 'AWARENESS'].map((obj) => (
                                    <div
                                        key={obj}
                                        onClick={() => setFormData(prev => ({ ...prev, objective: obj }))}
                                        className={`cursor-pointer rounded-lg border p-4 flex items-center justify-between transition-all ${formData.objective === obj
                                                ? 'bg-primary/10 border-primary text-white'
                                                : 'bg-black/30 border-white/10 text-gray-400 hover:border-white/20'
                                            }`}
                                    >
                                        <span className="font-medium">{obj}</span>
                                        {formData.objective === obj && (
                                            <div className="h-3 w-3 rounded-full bg-primary shadow-[0_0_8px_rgba(249,115,22,0.8)]"></div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Daily Budget */}
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">Daily Budget</label>
                            <div className="relative rounded-md shadow-sm">
                                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                    <span className="text-gray-500 sm:text-sm">₹</span>
                                </div>
                                <input
                                    type="number"
                                    name="dailyBudget"
                                    required
                                    value={formData.dailyBudget}
                                    onChange={handleChange}
                                    placeholder="500"
                                    className="block w-full rounded-lg border border-white/10 bg-black/30 text-white placeholder-gray-600 focus:border-primary focus:ring-1 focus:ring-primary sm:text-sm p-3 pl-8 transition-colors"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end space-x-4 pt-6 border-t border-white/10">
                            <button
                                type="button"
                                onClick={() => router.back()}
                                className="px-5 py-2.5 border border-white/10 rounded-lg text-sm font-medium text-gray-300 hover:bg-white/5 hover:text-white transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="px-5 py-2.5 border border-transparent rounded-lg shadow-glow-sm text-sm font-bold text-black bg-primary hover:bg-orange-600 disabled:opacity-50 transition-all transform hover:scale-[1.02]"
                            >
                                {loading ? 'Creating...' : 'Launch Campaign'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </Layout>
    );
}
