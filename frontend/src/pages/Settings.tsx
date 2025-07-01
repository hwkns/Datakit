import React, { useState, useEffect } from "react";
import { User, Mail, Lock, Bell, Palette, Database, CreditCard, Shield } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/hooks/auth/useAuth";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import SettingsSidebar from "@/components/layout/SettingsSidebar";
import { SEO } from "@/components/common/SEO";

const Settings: React.FC = () => {
  const { user, updateProfile, updateSettings, settings, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
  });

  const [preferencesData, setPreferencesData] = useState({
    defaultAIProvider: settings?.defaultAIProvider || 'openai',
    defaultModel: settings?.defaultModel || 'gpt-4',
    theme: settings?.theme || 'dark',
    emailNotifications: settings?.emailNotifications ?? true,
    usageAlerts: settings?.usageAlerts ?? true,
  });

  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || '',
        email: user.email || '',
      });
    }
  }, [user]);

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateProfile({
        name: profileData.name,
      });
    } catch (error) {
      console.error('Failed to update profile:', error);
    }
  };

  const handlePreferencesUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateSettings(preferencesData);
    } catch (error) {
      console.error('Failed to update preferences:', error);
    }
  };


  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-white mb-4">Profile Information</h3>
              <form onSubmit={handleProfileUpdate} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white/90 mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={profileData.name}
                    onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 bg-background/20 border border-white/20 rounded-md text-white placeholder-white/50 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-white/90 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={profileData.email}
                    disabled
                    className="w-full px-3 py-2 bg-background/10 border border-white/10 rounded-md text-white/60 cursor-not-allowed"
                  />
                  <p className="text-xs text-white/50 mt-1">
                    Email cannot be changed. Contact support if needed.
                  </p>
                </div>

                <Button variant="outline" type="submit" disabled={isLoading}>
                  {isLoading ? 'Saving...' : 'Save Changes'}
                </Button>
              </form>
            </div>
          </div>
        );


      case 'ai':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-white mb-4">AI Configuration</h3>
              <form onSubmit={handlePreferencesUpdate} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white/90 mb-2">
                    Default AI Provider
                  </label>
                  <select
                    value={preferencesData.defaultAIProvider}
                    onChange={(e) => setPreferencesData(prev => ({ ...prev, defaultAIProvider: e.target.value as any }))}
                    className="w-full px-3 py-2 bg-background/20 border border-white/20 rounded-md text-white"
                  >
                    <option value="datakit">DataKit AI (Recommended)</option>
                    <option value="openai">OpenAI (Your API Key)</option>
                    <option value="anthropic">Anthropic (Your API Key)</option>
                  </select>
                  <p className="text-xs text-white/60 mt-1">
                    DataKit AI uses our credits and provides the best integration experience.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/90 mb-2">
                    Default Model
                  </label>
                  <select
                    value={preferencesData.defaultModel}
                    onChange={(e) => setPreferencesData(prev => ({ ...prev, defaultModel: e.target.value }))}
                    className="w-full px-3 py-2 bg-background/20 border border-white/20 rounded-md text-white"
                  >
                    {preferencesData.defaultAIProvider === 'datakit' && (
                      <>
                        <option value="datakit-smart">DataKit Smart</option>
                        <option value="datakit-fast">DataKit Fast</option>
                      </>
                    )}
                    {preferencesData.defaultAIProvider === 'openai' && (
                      <>
                        <option value="gpt-4">GPT-4</option>
                        <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                      </>
                    )}
                    {preferencesData.defaultAIProvider === 'anthropic' && (
                      <>
                        <option value="claude-3-opus">Claude 3 Opus</option>
                        <option value="claude-3-sonnet">Claude 3 Sonnet</option>
                      </>
                    )}
                  </select>
                </div>

                <Button variant="outline" type="submit" disabled={isLoading}>
                  {isLoading ? 'Saving...' : 'Save AI Settings'}
                </Button>
              </form>
            </div>
          </div>
        );

      case 'notifications':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-white mb-4">Notification Preferences</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-white">Email Notifications</div>
                    <div className="text-xs text-white/60">Receive updates about new features and announcements</div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={preferencesData.emailNotifications}
                      onChange={(e) => setPreferencesData(prev => ({ ...prev, emailNotifications: e.target.checked }))}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-white">Usage Alerts</div>
                    <div className="text-xs text-white/60">Get notified when you're close to your credit limit</div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={preferencesData.usageAlerts}
                      onChange={(e) => setPreferencesData(prev => ({ ...prev, usageAlerts: e.target.checked }))}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <Button variant="outline" onClick={handlePreferencesUpdate} disabled={isLoading}>
                  {isLoading ? 'Saving...' : 'Save Notification Settings'}
                </Button>
              </div>
            </div>
          </div>
        );

      case 'subscription':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-white mb-4">Subscription & Usage</h3>
              <div className="bg-background/10 border border-white/10 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="text-sm font-medium text-white">Current Plan</div>
                    <div className="text-2xl font-bold text-primary">
                      {user?.subscription?.tier || 'FREE'}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-white/60">Credits Remaining</div>
                    <div className="text-lg font-semibold text-white">
                      {user?.credits?.remaining || 0}
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Button variant="primary" className="w-full">
                    Upgrade Plan
                  </Button>
                  <Button variant="outline" className="w-full">
                    View Usage History
                  </Button>
                </div>
              </div>
            </div>
          </div>
        );


      default:
        return null;
    }
  };

  return (
    <ProtectedRoute>
      <>
        <SEO
          title="Settings - DataKit"
          description="Manage your DataKit account settings, AI preferences, notifications, and subscription"
          keywords="settings, profile, ai settings, notifications, subscription, datakit"
        />

        <div className="flex h-screen bg-background overflow-hidden">
          {/* Settings Sidebar */}
          <SettingsSidebar 
            activeTab={activeTab} 
            onTabChange={setActiveTab} 
          />

          {/* Main Content Area */}
          <div className="flex-1 h-full overflow-hidden flex items-center justify-center">
            <div className="w-full max-w-2xl p-8">
              <div className="bg-darkNav rounded-lg p-8">
                {renderTabContent()}
              </div>
            </div>
          </div>
        </div>
      </>
    </ProtectedRoute>
  );
};

export default Settings;
