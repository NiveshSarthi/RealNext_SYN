import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import { whiteLabelAPI } from '../utils/api';
import { PhotoIcon, SwatchIcon, GlobeAltIcon, DevicePhoneMobileIcon } from '@heroicons/react/24/outline';

const WhiteLabelSettings = () => {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasAccess, setHasAccess] = useState(false);
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/');
    } else if (user) {
      fetchWhiteLabelConfig();
    }
  }, [user, authLoading]);

  const fetchWhiteLabelConfig = async () => {
    try {
      const [configResponse, accessResponse] = await Promise.all([
        whiteLabelAPI.getConfig(),
        whiteLabelAPI.checkAccess()
      ]);

      setConfig(configResponse.data.data);
      setHasAccess(accessResponse.data.data.hasWhiteLabelAccess);
    } catch (error) {
      console.error('Failed to fetch white-label config:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateConfig = async (updates) => {
    setSaving(true);
    try {
      const response = await whiteLabelAPI.updateConfig(updates);
      setConfig(response.data.data);
      // Show success message
    } catch (error) {
      console.error('Failed to update config:', error);
      // Show error message
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field, value) => {
    setConfig(prev => ({ ...prev, [field]: value }));
  };

  if (loading || authLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  if (!hasAccess) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto py-8">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <div className="flex items-center">
              <SwatchIcon className="h-8 w-8 text-yellow-600 mr-3" />
              <div>
                <h3 className="text-lg font-medium text-yellow-800">White-Label Features Not Available</h3>
                <p className="text-yellow-700 mt-1">
                  White-label customization features are available for Business and Enterprise plans.
                  Upgrade your subscription to access these features.
                </p>
              </div>
            </div>
            <div className="mt-4">
              <button className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition-colors">
                Upgrade Plan
              </button>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-6xl mx-auto py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">White-Label Settings</h1>
          <p className="text-gray-600 mt-2">
            Customize your platform branding and appearance
          </p>
        </div>

        <div className="space-y-8">
          {/* Company Branding */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center mb-6">
              <PhotoIcon className="h-6 w-6 text-blue-600 mr-3" />
              <h2 className="text-xl font-semibold text-gray-900">Company Branding</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Company Name
                </label>
                <input
                  type="text"
                  value={config?.company_name || ''}
                  onChange={(e) => handleInputChange('company_name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Your Company Name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Logo URL
                </label>
                <input
                  type="url"
                  value={config?.logo_url || ''}
                  onChange={(e) => handleInputChange('logo_url', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="https://example.com/logo.png"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Favicon URL
                </label>
                <input
                  type="url"
                  value={config?.favicon_url || ''}
                  onChange={(e) => handleInputChange('favicon_url', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="https://example.com/favicon.ico"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Dashboard Title
                </label>
                <input
                  type="text"
                  value={config?.custom_dashboard_title || ''}
                  onChange={(e) => handleInputChange('custom_dashboard_title', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Custom Dashboard Title"
                />
              </div>
            </div>
          </div>

          {/* Color Scheme */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center mb-6">
              <SwatchIcon className="h-6 w-6 text-purple-600 mr-3" />
              <h2 className="text-xl font-semibold text-gray-900">Color Scheme</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Primary Color
                </label>
                <div className="flex items-center space-x-3">
                  <input
                    type="color"
                    value={config?.primary_color || '#6c5ce7'}
                    onChange={(e) => handleInputChange('primary_color', e.target.value)}
                    className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={config?.primary_color || '#6c5ce7'}
                    onChange={(e) => handleInputChange('primary_color', e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Secondary Color
                </label>
                <div className="flex items-center space-x-3">
                  <input
                    type="color"
                    value={config?.secondary_color || '#00d4ff'}
                    onChange={(e) => handleInputChange('secondary_color', e.target.value)}
                    className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={config?.secondary_color || '#00d4ff'}
                    onChange={(e) => handleInputChange('secondary_color', e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Accent Color
                </label>
                <div className="flex items-center space-x-3">
                  <input
                    type="color"
                    value={config?.accent_color || '#00f593'}
                    onChange={(e) => handleInputChange('accent_color', e.target.value)}
                    className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={config?.accent_color || '#00f593'}
                    onChange={(e) => handleInputChange('accent_color', e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Custom Domain */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center mb-6">
              <GlobeAltIcon className="h-6 w-6 text-green-600 mr-3" />
              <h2 className="text-xl font-semibold text-gray-900">Custom Domain</h2>
            </div>

            <div className="max-w-md">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Custom Domain URL
              </label>
              <input
                type="url"
                value={config?.custom_domain || ''}
                onChange={(e) => handleInputChange('custom_domain', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="https://yourcompany.com"
              />
              <p className="text-sm text-gray-500 mt-2">
                Enter your custom domain URL. DNS configuration may be required.
              </p>
            </div>
          </div>

          {/* Mobile App Branding */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center mb-6">
              <DevicePhoneMobileIcon className="h-6 w-6 text-indigo-600 mr-3" />
              <h2 className="text-xl font-semibold text-gray-900">Mobile App Branding</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  App Name
                </label>
                <input
                  type="text"
                  value={config?.app_name || ''}
                  onChange={(e) => handleInputChange('app_name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Your App Name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  App Icon URL
                </label>
                <input
                  type="url"
                  value={config?.app_icon_url || ''}
                  onChange={(e) => handleInputChange('app_icon_url', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="https://example.com/app-icon.png"
                />
              </div>
            </div>
          </div>

          {/* Platform Branding Toggle */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Platform Branding</h2>

            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-gray-900">Hide Platform Branding</h3>
                <p className="text-gray-600 mt-1">
                  Remove &quot;Powered by WhatsApp Automation Platform&quot; branding from your interface
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={config?.hide_platform_branding || false}
                  onChange={(e) => handleInputChange('hide_platform_branding', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <button
              onClick={() => updateConfig(config)}
              disabled={saving}
              className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default WhiteLabelSettings;