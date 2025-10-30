import React, { useState, useEffect } from "react";
import { useTranslation } from 'react-i18next';
import { useAuthStore } from "@/store/authStore";
import { useAIStore } from "@/store/aiStore";
import { AIProvider } from "@/types/ai";
import { useCredits } from "@/hooks/useCredits";
import { useNavigate } from "react-router-dom";

// Import provider logos
import OpenAILogo from "@/assets/openai.webp";
import AnthropicLogo from "@/assets/anthropic.webp";
import GroqLogo from "@/assets/groq.png";

const PROVIDER_CONFIG = {
  datakit: {
    name: "DataKit Model",
    icon: <></>,
    color: "primary",
    bgGradient: "from-blue-500/20 to-purple-500/20",
    borderGradient: "from-blue-500/40 to-purple-500/40",
    description: "Optimized AI models for data analysis",
    helpText:
      "DataKit model uses your credits and provides optimized prompts for data analysis tasks.",
    keyFormat: null,
    websiteUrl: null,
    models: ["DataKit Smart (Claude 3.5 Sonnet)", "DataKit Fast (Claude 3.5 Haiku)"],
    features: [
      "Optimized for data analysis",
      "No API key required",
      "Uses workspace credits",
    ],
  },
  openai: {
    name: "OpenAI",
    icon: <img src={OpenAILogo} className="h-5 w-5" alt="OpenAI" />,
    color: "green",
    bgGradient: "from-green-500/20 to-emerald-500/20",
    borderGradient: "from-green-500/40 to-emerald-500/40",
    description: "Industry-leading GPT models",
    helpText:
      "Most capable models for complex reasoning and analysis. Perfect for sophisticated data insights and advanced analytics.",
    keyFormat: "sk-...",
    websiteUrl: "https://platform.openai.com/api-keys",
    models: ["GPT-4o", "GPT-4o Mini"],
    features: ["Advanced reasoning", "Large context window", "$5 free credits"],
  },
  anthropic: {
    name: "Anthropic",
    icon: <img src={AnthropicLogo} className="h-4 w-4" alt="Anthropic" />,
    color: "orange",
    bgGradient: "from-orange-500/20 to-amber-500/20",
    borderGradient: "from-orange-500/40 to-amber-500/40",
    description: "Claude models for thoughtful analysis",
    helpText:
      "Excellent for detailed explanations and careful analysis. Known for producing well-structured, comprehensive responses.",
    keyFormat: "sk-ant-...",
    websiteUrl: "https://console.anthropic.com/",
    models: ["Claude 3.5 Sonnet", "Claude 3.5 Haiku"],
    features: ["Detailed explanations", "Safety focused", "Free trial credits"],
  },
  groq: {
    name: "Groq",
    icon: <img src={GroqLogo} className="h-4 w-4" alt="Groq" />,
    color: "purple",
    bgGradient: "from-purple-500/20 to-violet-500/20",
    borderGradient: "from-purple-500/40 to-violet-500/40",
    description: "Lightning-fast open source models",
    helpText:
      "Blazing fast inference with Llama models. Ideal for rapid prototyping and real-time data exploration.",
    keyFormat: "gsk_...",
    websiteUrl: "https://console.groq.com/keys",
    models: ["Llama 3.1 70B", "Llama 3.1 8B"],
    features: ["Ultra-fast inference", "Open source models", "Completely free"],
  },
} as const;

interface AISettingsProps {
  onTabChange?: (tabId: string) => void;
}

const AISettings: React.FC<AISettingsProps> = ({ onTabChange }) => {
  const { t } = useTranslation();
  const { currentWorkspace } = useAuthStore();
  const {
    apiKeys,
    activeProvider,
    autoExecuteSQL,
    setActiveProvider: setActiveProviderToStore,
    setApiKey,
    updateSettings,
  } = useAIStore();

  const { creditsRemaining, isLoading: creditsLoading } = useCredits();
  const navigate = useNavigate();

  const [keyInputs, setKeyInputs] = useState<Map<AIProvider, string>>(
    new Map()
  );

  const [editingProvider, setEditingProvider] = useState<AIProvider | null>(
    null
  );

  const isProOrTeam =
    currentWorkspace?.subscription?.planType === "pro" ||
    currentWorkspace?.subscription?.planType === "team";

  const handleUpgrade = () => {
    if (onTabChange) {
      // Use the passed tab change function if available
      onTabChange("subscription");
    } else {
      // Fallback to navigation
      navigate("/settings#subscription");
    }
  };

  const formatCredits = (credits: number): string => {
    if (credits === -1) return t('settings.ai.unlimited', { defaultValue: 'Unlimited' });
    return credits.toLocaleString();
  };


  // Initialize form with existing keys
  useEffect(() => {
    const newInputs = new Map();
    for (const [provider, key] of apiKeys) {
      newInputs.set(provider, key);
    }
    setKeyInputs(newInputs);
  }, [apiKeys]);

  const handleKeyChange = (provider: AIProvider, value: string) => {
    setKeyInputs(new Map(keyInputs.set(provider, value)));
  };

  const handleSaveKey = (provider: AIProvider) => {
    const key = keyInputs.get(provider);
    if (key?.trim()) {
      setApiKey(provider, key.trim());
      setActiveProviderToStore(provider);
    }
  };

  const maskApiKey = (key: string) => {
    if (key.length <= 12) return "•".repeat(key.length);
    // Always show first 6 chars + 20 dots + last 4 chars for consistency
    return key.slice(0, 6) + "•".repeat(20) + key.slice(-4);
  };



  return (
    <div className="p-6 space-y-8">
      {/* DataKit Models */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <img src={AnthropicLogo} className="h-4 w-4" alt="Anthropic" />
          <div className="text-white">DataKit Models</div>
        </div>
        <div className="text-white/60 text-sm mb-3">
          DataKit Smart (Claude 4.5 Sonnet) & DataKit Fast (Claude 4 Sonnert)
        </div>
        
        <div className="text-white/50 text-sm">
          {!creditsLoading && (
            creditsRemaining === -1 
              ? 'Unlimited credits'
              : `${formatCredits(creditsRemaining)} of 300 credits`
          )}
          {!isProOrTeam && (
            <div className="mt-1">
              <button 
                onClick={handleUpgrade}
                className="text-white/60 text-sm hover:text-white underline"
              >
                Upgrade for unlimited
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Providers */}
      <div>
        <div className="text-white mb-4">Providers</div>
        
        <div className="space-y-3">
            {(["openai", "anthropic", "groq"] as AIProvider[]).map((provider) => {
              const config = PROVIDER_CONFIG[provider];
              const isActive = activeProvider === provider;
              const hasKey = apiKeys.has(provider) && !!apiKeys.get(provider);
              const isEditing = editingProvider === provider;

              const handleUpdateKey = () => {
                setEditingProvider(provider);
                setKeyInputs(
                  new Map(keyInputs.set(provider, apiKeys.get(provider) || ""))
                );
              };

              const handleSaveUpdate = () => {
                const key = keyInputs.get(provider);
                if (key?.trim()) {
                  setApiKey(provider, key.trim());
                  setActiveProviderToStore(provider);
                }
                setEditingProvider(null);
              };

              const handleCancelUpdate = () => {
                setKeyInputs(
                  new Map(keyInputs.set(provider, apiKeys.get(provider) || ""))
                );
                setEditingProvider(null);
              };

              const handleSelectProvider = () => {
                if (hasKey) {
                  setActiveProviderToStore(provider);
                }
              };

              return (
                <div key={provider} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-white/80 text-sm">{config.name}</span>
                      {isActive && <span className="text-white/40 text-xs">active</span>}
                    </div>
                    {config.websiteUrl && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(config.websiteUrl!, "_blank");
                        }}
                        className="text-white/40 hover:text-white/80 text-xs underline"
                      >
                      {t('settings.ai.providers.getApiKey', { defaultValue: 'Get key' })}
                      </button>
                    )}
                  </div>

                  {hasKey && !isEditing ? (
                    <div className="space-y-2">
                      <div className="text-xs font-mono text-white/40 truncate">
                        {maskApiKey(apiKeys.get(provider) || "")}
                      </div>
                      <div className="flex gap-2 text-xs">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectProvider();
                          }}
                          className={`text-white/60 hover:text-white ${
                            isActive ? "underline" : ""
                          }`}
                        >
                          {isActive ? 'Active' : 'Use'}
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleUpdateKey();
                          }}
                          className="text-white/40 hover:text-white/60"
                        >
                           {t('settings.ai.providers.edit', { defaultValue: 'Edit' })}
                        </button>
                      </div>
                    </div>
                  ) : isEditing ? (
                    <div className="space-y-2">
                      <input
                        type="password"
                        value={keyInputs.get(provider) || ""}
                        onChange={(e) => handleKeyChange(provider, e.target.value)}
                        placeholder={`${config.keyFormat || 'API key'}`}
                        className="w-full px-2 py-1 bg-transparent border-b border-white/20 text-white text-sm placeholder-white/40 focus:outline-none focus:border-white/50"
                        autoFocus
                      />
                      <div className="flex gap-2 text-xs">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSaveUpdate();
                          }}
                          className="text-white/60 hover:text-white underline"
                        >
                          {t('settings.ai.providers.save', { defaultValue: 'Save' })}
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCancelUpdate();
                          }}
                          className="text-white/40 hover:text-white/60"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <input
                        type="password"
                        value={keyInputs.get(provider) || ""}
                        onChange={(e) => handleKeyChange(provider, e.target.value)}
                        placeholder={`${config.keyFormat || 'API key'}`}
                        className="w-full px-2 py-1 bg-transparent border-b border-white/20 text-white text-sm placeholder-white/40 focus:outline-none focus:border-white/50"
                      />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSaveKey(provider);
                        }}
                        disabled={!keyInputs.get(provider)?.trim()}
                        className="text-white/60 hover:text-white text-xs underline disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        Save
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          
        </div>

        {/* Settings */}
        <div>
          <div className="text-white mb-4">Settings</div>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-white text-sm">Auto-execute SQL</div>
                <div className="text-white/50 text-xs">Automatically run AI-generated SQL queries</div>
              </div>
              <button
                onClick={() => updateSettings({ autoExecuteSQL: !autoExecuteSQL })}
                className={`relative inline-flex h-4 w-7 items-center rounded-full transition-colors ${
                  autoExecuteSQL ? "bg-white/30" : "bg-white/10"
                }`}
              >
                <span
                  className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                    autoExecuteSQL ? "translate-x-4" : "translate-x-0.5"
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
    </div>
  );
};

export default AISettings;