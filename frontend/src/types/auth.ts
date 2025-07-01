export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
  subscription?: UserSubscription;
  credits?: UserCredits;
}

export interface UserSubscription {
  id: string;
  tier: 'FREE' | 'PRO' | 'ENTERPRISE';
  status: 'active' | 'cancelled' | 'past_due';
  monthlyCredits: number;
  currentPeriodEnd?: string;
  cancelAtPeriodEnd: boolean;
}

export interface UserCredits {
  remaining: number;
  used: number;
  total: number;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupCredentials {
  email: string;
  password: string;
  name: string;
}

export interface AuthResponse {
  user: User;
}

export interface UpdateProfileData {
  name?: string;
  avatarUrl?: string;
}

export interface UserSettings {
  defaultAIProvider?: 'openai' | 'anthropic' | 'datakit';
  defaultModel?: string;
  theme?: 'light' | 'dark' | 'system';
  emailNotifications?: boolean;
  usageAlerts?: boolean;
  dataExportFormat?: 'csv' | 'json' | 'parquet';
}