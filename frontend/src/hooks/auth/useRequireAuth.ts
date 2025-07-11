import { useEffect } from 'react';
import { useAuth } from './useAuth';

interface UseRequireAuthOptions {
  redirectTo?: string;
  onUnauthorized?: () => void;
}

export const useRequireAuth = (options: UseRequireAuthOptions = {}) => {
  const { isAuthenticated, isLoading, error } = useAuth();
  const { onUnauthorized } = options;

  useEffect(() => {
    if (!isLoading && !isAuthenticated && !error) {
      onUnauthorized?.();
    }
  }, [isAuthenticated, isLoading, error, onUnauthorized]);

  return {
    isAuthenticated,
    isLoading,
    error,
    isReady: !isLoading,
  };
};

export default useRequireAuth;