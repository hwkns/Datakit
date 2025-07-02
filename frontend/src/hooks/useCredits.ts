import { useState, useEffect, useCallback } from 'react';
import { creditsService, CreditStats, CreditUsage } from '@/services/creditsService';
import { useAuth } from '@/hooks/auth/useAuth';

export const useCredits = () => {
  const [creditsRemaining, setCreditsRemaining] = useState<number>(-1);
  const [stats, setStats] = useState<CreditStats | null>(null);
  const [usageHistory, setUsageHistory] = useState<CreditUsage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { isAuthenticated } = useAuth();

  const fetchCreditsRemaining = useCallback(async () => {
    if (!isAuthenticated) return;
    
    try {
      setIsLoading(true);
      const response = await creditsService.getRemainingCredits();
      setCreditsRemaining(response.creditsRemaining);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch remaining credits:', err);
      setError('Failed to fetch credits');
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  const fetchStats = useCallback(async () => {
    if (!isAuthenticated) return;
    
    try {
      const response = await creditsService.getUsageStats();
      setStats(response);
    } catch (err) {
      console.error('Failed to fetch credit stats:', err);
    }
  }, [isAuthenticated]);

  const fetchUsageHistory = useCallback(async (limit = 50, offset = 0) => {
    if (!isAuthenticated) return;
    
    try {
      const response = await creditsService.getUsageHistory(limit, offset);
      setUsageHistory(response.usages);
    } catch (err) {
      console.error('Failed to fetch usage history:', err);
    }
  }, [isAuthenticated]);

  const estimateCredits = useCallback(async (modelId: string, inputTokens: number, outputTokens?: number) => {
    try {
      const response = await creditsService.estimateCredits(modelId, inputTokens, outputTokens);
      return response.estimatedCredits;
    } catch (err) {
      console.error('Failed to estimate credits:', err);
      return 0;
    }
  }, []);

  const checkCredits = useCallback(async (estimatedCredits: number) => {
    try {
      const response = await creditsService.checkCredits(estimatedCredits);
      return response.hasCredits;
    } catch (err) {
      console.error('Failed to check credits:', err);
      return false;
    }
  }, []);

  const refreshCredits = useCallback(async () => {
    await fetchCreditsRemaining();
  }, [fetchCreditsRemaining]);

  // Initial fetch on mount
  useEffect(() => {
    if (isAuthenticated) {
      fetchCreditsRemaining();
      fetchStats();
    }
  }, [isAuthenticated, fetchCreditsRemaining, fetchStats]);

  return {
    creditsRemaining,
    stats,
    usageHistory,
    isLoading,
    error,
    fetchCreditsRemaining,
    fetchStats,
    fetchUsageHistory,
    estimateCredits,
    checkCredits,
    refreshCredits,
  };
};