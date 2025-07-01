import React from "react";
import { ArrowLeft, User, Database, Bell, CreditCard } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

interface SettingsSidebarProps {
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

const SettingsSidebar: React.FC<SettingsSidebarProps> = ({
  activeTab,
  onTabChange,
}) => {
  const navigate = useNavigate();

  const tabs = [
    { id: "profile", name: "Profile", icon: User },
    { id: "ai", name: "AI Settings", icon: Database },
    { id: "notifications", name: "Notifications", icon: Bell },
    { id: "subscription", name: "Subscription", icon: CreditCard },
  ];

  return (
    <motion.div
      className="bg-darkNav flex flex-col h-full border-r border-white border-opacity-10 overflow-hidden w-64"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header with title - matching main sidebar style */}
      <div className="px-5 py-4 border-b border-white border-opacity-10 flex items-center gap-3">
        <button
          onClick={() => navigate("/")}
          className="text-white text-opacity-70 hover:text-opacity-100 transition-custom p-1 cursor-pointer hover:bg-white/5 rounded"
          aria-label="Back to main panel"
        >
          <ArrowLeft size={18} />
        </button>
        <h1 className="text-white font-heading font-medium text-lg">
          Settings
        </h1>
      </div>

      {/* Description text - matching main sidebar style */}
      <div className="px-5 py-4">
        <p className="text-sm text-white text-opacity-70">
          Manage your account settings, AI preferences, notifications, and
          subscription.
        </p>
      </div>

      {/* Settings Navigation */}
      <div className="px-5 pt-2 pb-2 flex-1">
        <h3 className="text-xs font-medium text-white text-opacity-50 tracking-wider mb-3 uppercase">
          Account Settings
        </h3>

        <div className="space-y-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`w-full text-left flex items-center p-3 rounded text-sm transition-custom ${
                  activeTab === tab.id
                    ? "border border-primary text-white"
                    : "text-white text-opacity-80 hover:bg-background hover:bg-opacity-30"
                }`}
              >
                <Icon
                  size={16}
                  className={`mr-3 flex-shrink-0 ${
                    activeTab === tab.id ? "text-white" : "text-primary"
                  }`}
                />
                <span className="font-medium">{tab.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="px-4 py-3 text-center border-t border-white border-opacity-5">
        <p className="text-xs text-white text-opacity-50">
          Powered by WebAssembly and DuckDB
          <br />
          <a
            href="https://amin.contact"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            by Amin
          </a>
          {" @ "}
          <a
            href="https://www.linkedin.com/company/datakitpage"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            DataKit
          </a>
        </p>
      </div>
    </motion.div>
  );
};

export default SettingsSidebar;
