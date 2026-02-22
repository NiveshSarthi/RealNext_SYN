import { useState, useEffect } from 'react';
import Head from 'next/head';
import Layout from '../../../components/Layout';
import Button from '../../../components/ui/Button';
import axios from '../../../utils/api';
import { toast } from 'react-hot-toast';
import { Cog6ToothIcon, PhoneIcon, PlusIcon } from '@heroicons/react/24/outline';

export default function WAMarketingSettings() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [waSettings, setWaSettings] = useState({
        business_account_id: '',
        app_id: '',
        access_token: '',
        webhook_verify_token: ''
    });

    const [phoneNumbers, setPhoneNumbers] = useState([]);
    const [showPhoneModal, setShowPhoneModal] = useState(false);
    const [addingPhone, setAddingPhone] = useState(false);
    const [phoneForm, setPhoneForm] = useState({
        phone_number_id: '',
        display_name: ''
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [waRes, phonesRes] = await Promise.all([
                axios.get('/api/wfb-settings/whatsapp').catch(() => ({ data: { data: {} } })),
                axios.get('/api/wfb-settings/phone-numbers').catch(() => ({ data: { data: [] } }))
            ]);

            if (waRes.data?.data) {
                setWaSettings({
                    business_account_id: waRes.data.data.business_account_id || '',
                    app_id: waRes.data.data.app_id || '',
                    access_token: waRes.data.data.access_token || '',
                    webhook_verify_token: waRes.data.data.webhook_verify_token || ''
                });
            }
            if (phonesRes.data?.data) {
                setPhoneNumbers(phonesRes.data.data);
            }
        } catch (error) {
            console.error('Failed to fetch settings:', error);
            toast.error('Failed to load settings data');
        } finally {
            setLoading(false);
        }
    };

    const handleSaveWaSettings = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            await axios.post('/api/wfb-settings/whatsapp', waSettings);
            toast.success('WhatsApp Meta Settings saved successfully');
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || 'Failed to save settings');
        } finally {
            setSaving(false);
        }
    };

    const handleAddPhoneSubmit = async (e) => {
        e.preventDefault();
        setAddingPhone(true);
        try {
            await axios.post('/api/wfb-settings/phone-numbers', phoneForm);
            toast.success('Phone Number added successfully');
            setShowPhoneModal(false);
            setPhoneForm({ phone_number_id: '', display_name: '' });

            // Refresh phone numbers
            const res = await axios.get('/api/wfb-settings/phone-numbers');
            setPhoneNumbers(res.data?.data || []);
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || 'Failed to add phone number');
        } finally {
            setAddingPhone(false);
        }
    };

    if (loading) {
        return (
            <Layout>
                <div className="p-12 text-center text-gray-500">Loading Configuration...</div>
            </Layout>
        );
    }

    return (
        <Layout>
            <Head>
                <title>WA Marketing Settings | RealNext</title>
            </Head>

            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <Cog6ToothIcon className="w-8 h-8 text-primary-600" />
                    WhatsApp Marketing Settings
                </h1>
                <p className="mt-2 text-sm text-gray-700">
                    Configure your official Meta WhatsApp Business API credentials and manage active Phone Numbers for campaigns and flows.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Meta Configuration Panel */}
                <div className="bg-white shadow rounded-lg overflow-hidden border border-gray-200">
                    <div className="px-6 py-5 border-b border-gray-200 bg-gray-50">
                        <h3 className="text-lg leading-6 font-medium text-gray-900">Meta API Credentials</h3>
                    </div>
                    <form onSubmit={handleSaveWaSettings} className="p-6 space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">WhatsApp Business Account ID</label>
                            <input
                                type="text"
                                required
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                                value={waSettings.business_account_id}
                                onChange={(e) => setWaSettings({ ...waSettings, business_account_id: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Meta App ID</label>
                            <input
                                type="text"
                                required
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                                value={waSettings.app_id}
                                onChange={(e) => setWaSettings({ ...waSettings, app_id: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">System User Access Token</label>
                            <textarea
                                required
                                rows={3}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm font-mono text-xs"
                                value={waSettings.access_token}
                                onChange={(e) => setWaSettings({ ...waSettings, access_token: e.target.value })}
                                placeholder="EAA..."
                            />
                            <p className="mt-1 text-xs text-gray-500">A permanent token generated from your Meta App Dashboard.</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Webhook Verify Token</label>
                            <input
                                type="text"
                                required
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                                value={waSettings.webhook_verify_token}
                                onChange={(e) => setWaSettings({ ...waSettings, webhook_verify_token: e.target.value })}
                            />
                        </div>

                        <div className="pt-4 flex justify-end">
                            <Button type="submit" isLoading={saving}>Save Credentials</Button>
                        </div>
                    </form>
                </div>

                {/* Phone Numbers Panel */}
                <div className="bg-white shadow rounded-lg overflow-hidden border border-gray-200">
                    <div className="px-6 py-5 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                        <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center gap-2">
                            <PhoneIcon className="w-5 h-5 text-gray-500" />
                            Registered Phone Numbers
                        </h3>
                        <Button onClick={() => setShowPhoneModal(true)} size="sm" icon={PlusIcon}>
                            Add Phone
                        </Button>
                    </div>
                    <div className="p-6">
                        {phoneNumbers.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                                No phone numbers configured yet.
                            </div>
                        ) : (
                            <ul className="divide-y divide-gray-200 border border-gray-200 rounded-md">
                                {phoneNumbers.map((phone) => (
                                    <li key={phone._id || phone.phone_number_id} className="p-4 flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-gray-900">{phone.display_name}</p>
                                            <p className="text-xs text-gray-500 font-mono mt-1">ID: {phone.phone_number_id}</p>
                                        </div>
                                        <div>
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                Active
                                            </span>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                        <p className="mt-4 text-xs text-gray-500">
                            Note: Webhooks must be configured in Meta Developer portal to receive incoming messages.
                        </p>
                    </div>
                </div>
            </div>

            {/* Add Phone Modal */}
            {showPhoneModal && (
                <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
                    <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowPhoneModal(false)}></div>

                        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                            <form onSubmit={handleAddPhoneSubmit}>
                                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                                    <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                                        Register Phone Number
                                    </h3>

                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Display Name</label>
                                            <input
                                                type="text"
                                                required
                                                placeholder="e.g. Sales Team"
                                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                                                value={phoneForm.display_name}
                                                onChange={(e) => setPhoneForm({ ...phoneForm, display_name: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Phone Number ID (from Meta)</label>
                                            <input
                                                type="text"
                                                required
                                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm font-mono"
                                                value={phoneForm.phone_number_id}
                                                onChange={(e) => setPhoneForm({ ...phoneForm, phone_number_id: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                                    <Button type="submit" isLoading={addingPhone} className="w-full sm:ml-3 sm:w-auto">
                                        Register
                                    </Button>
                                    <button
                                        type="button"
                                        className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                                        onClick={() => setShowPhoneModal(false)}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </Layout>
    );
}
