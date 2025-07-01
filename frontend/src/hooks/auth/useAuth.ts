import { useAuthStore } from '@/store/authStore';

export const useAuth = () => {
  const auth = useAuthStore();

  // No need for auth checking here - it's handled globally in App.tsx

  return {
    // State
    user: auth.user,
    isAuthenticated: auth.isAuthenticated,
    isLoading: auth.isLoading,
    error: auth.error,
    settings: auth.settings,
    
    // Actions
    login: auth.login,
    signup: auth.signup,
    logout: auth.logout,
    updateProfile: auth.updateProfile,
    updateSettings: auth.updateSettings,
    
    // Helpers
    setError: auth.setError,
    clearError: auth.clearError,
  };
};

export default useAuth;