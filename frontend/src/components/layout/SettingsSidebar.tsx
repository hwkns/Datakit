import React from "react";
import { useTranslation } from 'react-i18next';
import { 
  ArrowLeft, 
  User, 
  Cpu, 
  Bell, 
  CreditCard, 
  Users, 
  Palette, 
  LogOut
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/auth/useAuth";
import { useNotifications } from "@/hooks/useNotifications";
import DuckDBIcon from '@/assets/duckdb.svg';

interface SettingsSidebarProps {
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

const SettingsSidebar: React.FC<SettingsSidebarProps> = ({
  activeTab,
  onTabChange,
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { showSuccess } = useNotifications();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
      
      // Show success notification for signout
      showSuccess(
        t('settings.signout.successTitle', { defaultValue: 'Signed out successfully' }),
        t('settings.signout.successMessage', { defaultValue: "You've been securely signed out of DataKit." }),
        { 
          icon: 'shield',
          duration: 3000
        }
      );
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const tabs = [
    { id: "profile", name: t('settings.tabs.profile', { defaultValue: 'Profile' }), icon: User },
    { id: "workspace", name: t('settings.tabs.workspace', { defaultValue: 'Workspace & Team' }), icon: Users },
    { id: "ai", name: t('settings.tabs.ai', { defaultValue: 'AI assistant settings' }), icon: Cpu },
    { id: "appearance", name: t('settings.tabs.appearance', { defaultValue: 'Appearance' }), icon: Palette },
    { id: "notifications", name: t('settings.tabs.notifications', { defaultValue: 'Notifications' }), icon: Bell },
    { id: "subscription", name: t('settings.tabs.subscription', { defaultValue: 'Subscription' }), icon: CreditCard },
  ];

  return (
    <div className="bg-darkNav flex flex-col h-full border-r border-gray-500/20 overflow-hidden w-56">
      {/* Header with title - matching main sidebar style */}
      <div className="px-5 py-4 border-b border-gray-500/20 bg-black/20 flex items-center gap-3">
        <button
          onClick={() => navigate("/")}
          className="text-white/70 hover:text-white transition-colors p-1 cursor-pointer hover:bg-white/5 rounded"
          aria-label="Back to DataKit"
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-white font-heading font-medium text-lg">
            {t('settings.header.title', { defaultValue: 'Settings' })}
          </h1>
          <p className="text-xs text-white/50">{t('settings.header.subtitle', { defaultValue: 'Manage your account' })}</p>
        </div>
      </div>

      {/* Settings Navigation */}
      <div className="px-5 pt-2 pb-2 flex-1">
        <div className="space-y-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors ${
                  activeTab === tab.id
                    ? "bg-primary/20 text-white"
                    : "text-white/80 hover:bg-white/5 hover:text-white"
                }`}
              >
                <Icon
                  size={16}
                  className={`flex-shrink-0 ${
                    activeTab === tab.id ? "text-primary" : "text-white/70"
                  }`}
                />
                <span className="font-medium">{tab.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Footer area - Enhanced */}
      <div className="border-t border-gray-500/20 bg-black/30">
        {/* Sign Out Button */}
        <div className="px-3 py-2.5 border-b border-gray-400/15">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2.5 px-2 py-1.5 text-xs hover:bg-white/5 rounded transition-all duration-200 group text-red-400/80 hover:text-red-400"
          >
            <LogOut size={14} className="flex-shrink-0" />
            <span className="font-medium">{t('settings.signout.button', { defaultValue: 'Sign Out' })}</span>
          </button>
        </div>

        {/* Attribution footer */}
        <div className="px-2 py-2 border-t border-gray-400/15 bg-black/40">
          <div className="text-[9px] text-white text-opacity-30">
            <div className="flex items-center justify-center gap-1">
              <span>Powered by</span>
              <a
                href="https://duckdb.org/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center"
              >
                <img
                  src={DuckDBIcon}
                  className="h-2.5 w-2.5 transition-colors hover:opacity-80"
                  alt="DuckDB"
                />
              </a>
              <span>•</span>
              <a
                href="https://amin.contact"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                {t('settings.footer.built', { defaultValue: 'built' })}
              </a>
              <span>@</span>
              <a
                href="https://www.linkedin.com/company/datakitpage"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                {t('settings.footer.company', { defaultValue: 'DataKit' })}
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsSidebar;
