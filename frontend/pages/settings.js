import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import { authAPI } from '../utils/api';
import toast from 'react-hot-toast';
import {
  UserIcon,
  Cog6ToothIcon,
  BellIcon,
  ShieldCheckIcon,
  KeyIcon
} from '@heroicons/react/24/outline';
import { Button } from '../components/ui/Button';

const TabButton = ({ active, onClick, children, icon: Icon }) => (
  <button
    onClick={onClick}
    className={`flex items-center px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${active
      ? 'bg-primary/10 text-primary border border-primary/20'
      : 'text-gray-400 hover:text-white hover:bg-white/5'
      }`}
  >
    <Icon className="h-5 w-5 mr-2" />
    {children}
  </button>
);

const InputField = ({ label, name, type = "text", value, onChange, placeholder, required, min }) => (
  <div>
    <label htmlFor={name} className="block text-sm font-medium text-gray-300 mb-1.5">
      {label}
    </label>
    <input
      type={type}
      name={name}
      id={name}
      required={required}
      min={min}
      className="block w-full bg-[#0E1117] border border-border/50 rounded-lg py-2.5 px-3 text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary/50 sm:text-sm transition-all"
      value={value}
      onChange={onChange}
      placeholder={placeholder}
    />
  </div>
);

const ProfileSettings = ({ user, onUpdate }) => {
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    businessName: user?.business_name || '',
    location: user?.location || '',
    experience_years: user?.experience_years || '',
    specializations: user?.specializations || []
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await onUpdate(formData);
      if (result.success) {
        toast.success('Profile updated successfully');
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSpecializationChange = (specialization) => {
    setFormData(prev => ({
      ...prev,
      specializations: prev.specializations.includes(specialization)
        ? prev.specializations.filter(s => s !== specialization)
        : [...prev.specializations, specialization]
    }));
  };

  const specializations = [
    'Residential', 'Commercial', 'Plot', 'Villa', 'Apartment',
    'Office Space', 'Retail', 'Industrial', 'Agricultural'
  ];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-white">Profile Information</h3>
        <p className="mt-1 text-sm text-gray-400">
          Update your personal and business information.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <InputField
            label="Full Name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
          />

          <InputField
            label="Email Address"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            required
          />

          <InputField
            label="Business Name"
            name="businessName"
            value={formData.businessName}
            onChange={handleChange}
            required
          />

          <InputField
            label="Location"
            name="location"
            value={formData.location}
            onChange={handleChange}
            placeholder="City, State"
          />

          <InputField
            label="Years of Experience"
            name="experience_years"
            type="number"
            value={formData.experience_years}
            onChange={handleChange}
            min="0"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-3">
            Specializations
          </label>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {specializations.map((spec) => (
              <label key={spec} className="flex items-center group cursor-pointer">
                <div className={`
                  w-4 h-4 rounded border flex items-center justify-center transition-colors
                  ${formData.specializations.includes(spec) ? 'bg-primary border-primary' : 'border-gray-600 bg-[#0E1117] group-hover:border-gray-500'}
                `}>
                  <input
                    type="checkbox"
                    checked={formData.specializations.includes(spec)}
                    onChange={() => handleSpecializationChange(spec)}
                    className="hidden"
                  />
                  {formData.specializations.includes(spec) && (
                    <svg className="w-3 h-3 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <span className="ml-2 text-sm text-gray-400 group-hover:text-gray-300 transition-colors">{spec}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="flex justify-end">
          <Button
            type="submit"
            isLoading={loading}
            variant="primary"
          >
            Save Changes
          </Button>
        </div>
      </form>
    </div>
  );
};

const SecuritySettings = () => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handlePasswordChange = async (e) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters long');
      return;
    }

    setLoading(true);
    try {
      // In a real implementation, this would call an API to change password
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      toast.success('Password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      toast.error('Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-white">Change Password</h3>
        <p className="mt-1 text-sm text-gray-400">
          Update your password to keep your account secure.
        </p>
      </div>

      <form onSubmit={handlePasswordChange} className="space-y-6">
        <InputField
          label="Current Password"
          name="currentPassword"
          type="password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          required
        />

        <InputField
          label="New Password"
          name="newPassword"
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
        />

        <InputField
          label="Confirm New Password"
          name="confirmPassword"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />

        <div className="flex justify-end">
          <Button
            type="submit"
            isLoading={loading}
            variant="primary"
          >
            Change Password
          </Button>
        </div>
      </form>
    </div>
  );
};

const NotificationSettings = () => {
  const [settings, setSettings] = useState({
    emailNotifications: true,
    campaignUpdates: true,
    leadAlerts: true,
    paymentReminders: true,
    weeklyReports: false
  });

  const handleSettingChange = (setting) => {
    setSettings(prev => ({
      ...prev,
      [setting]: !prev[setting]
    }));
  };

  const handleSave = () => {
    // In a real implementation, this would save to the backend
    toast.success('Notification settings saved');
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-white">Notification Preferences</h3>
        <p className="mt-1 text-sm text-gray-400">
          Choose what notifications you want to receive.
        </p>
      </div>

      <div className="space-y-4">
        {[
          { key: 'emailNotifications', label: 'Email Notifications', description: 'Receive notifications via email' },
          { key: 'campaignUpdates', label: 'Campaign Updates', description: 'Get notified about campaign performance' },
          { key: 'leadAlerts', label: 'Lead Alerts', description: 'Receive alerts for new leads and updates' },
          { key: 'paymentReminders', label: 'Payment Reminders', description: 'Get reminded about upcoming payments' },
          { key: 'weeklyReports', label: 'Weekly Reports', description: 'Receive weekly performance summaries' }
        ].map((item) => (
          <div key={item.key} className="flex items-center justify-between p-4 rounded-lg border border-border/30 bg-[#0E1117]">
            <div className="flex-1">
              <h4 className="text-sm font-medium text-white">{item.label}</h4>
              <p className="text-sm text-gray-500">{item.description}</p>
            </div>
            <div className="ml-4">
              <button
                onClick={() => handleSettingChange(item.key)}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ring-offset-[#0E1117] ${settings[item.key] ? 'bg-primary' : 'bg-gray-700'
                  }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${settings[item.key] ? 'translate-x-5' : 'translate-x-0'
                    }`}
                />
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          variant="primary"
        >
          Save Preferences
        </Button>
      </div>
    </div>
  );
};

export default function Settings() {
  const [activeTab, setActiveTab] = useState('profile');
  const { user, loading: authLoading, updateProfile } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/');
    }
  }, [user, authLoading]);

  if (authLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  const tabs = [
    { id: 'profile', name: 'Profile', icon: UserIcon, component: ProfileSettings },
    { id: 'security', name: 'Security', icon: ShieldCheckIcon, component: SecuritySettings },
    { id: 'notifications', name: 'Notifications', icon: BellIcon, component: NotificationSettings }
  ];

  const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component;

  return (
    <Layout>
      <div className="space-y-6 max-w-5xl mx-auto padding-container animate-fade-in content-container">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold font-display text-white">Settings</h1>
          <p className="mt-1 text-sm text-gray-400">
            Manage your account settings and preferences
          </p>
        </div>

        {/* Tabs */}
        <div className="border-b border-border/50">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => (
              <TabButton
                key={tab.id}
                active={activeTab === tab.id}
                onClick={() => setActiveTab(tab.id)}
                icon={tab.icon}
              >
                {tab.name}
              </TabButton>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="bg-card border border-border/50 rounded-xl overflow-hidden shadow-soft">
          <div className="px-6 py-8">
            {ActiveComponent && (
              <ActiveComponent
                user={user}
                onUpdate={updateProfile}
              />
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}