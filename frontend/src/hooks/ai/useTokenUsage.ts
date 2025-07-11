import { useAIStore } from '@/store/aiStore';
import { aiService } from '@/lib/ai/aiService';

interface TokenUsage {
  input: number;
  output: number;
}

interface CostBreakdown {
  response: {
    tokens: number;
    cost: number;
  };
  visualization: {
    tokens: number;
    cost: number;
  };
  total: {
    tokens: number;
    cost: number;
  };
}

export const useTokenUsage = () => {
  const { 
    currentTokenUsage, 
    visualizationTokenUsage, 
    activeProvider,
    setCurrentTokenUsage,
    setVisualizationTokenUsage 
  } = useAIStore();

  const calculateCost = (usage: TokenUsage | null): number => {
    if (!usage || !activeProvider) return 0;

    return aiService.calculateCost(activeProvider, {
      promptTokens: usage.input,
      completionTokens: usage.output,
    });
  };

  const getCostBreakdown = (): CostBreakdown => {
    const responseTokens = currentTokenUsage 
      ? currentTokenUsage.input + currentTokenUsage.output 
      : 0;
    
    const visualizationTokens = visualizationTokenUsage 
      ? visualizationTokenUsage.input + visualizationTokenUsage.output 
      : 0;

    const responseCost = calculateCost(currentTokenUsage);
    const visualizationCost = calculateCost(visualizationTokenUsage);

    return {
      response: {
        tokens: responseTokens,
        cost: responseCost
      },
      visualization: {
        tokens: visualizationTokens,
        cost: visualizationCost
      },
      total: {
        tokens: responseTokens + visualizationTokens,
        cost: responseCost + visualizationCost
      }
    };
  };

  const clearUsage = () => {
    setCurrentTokenUsage(null);
    setVisualizationTokenUsage(null);
  };

  return {
    currentTokenUsage,
    visualizationTokenUsage,
    setCurrentTokenUsage,
    setVisualizationTokenUsage,
    getCostBreakdown,
    clearUsage,
    hasUsage: !!(currentTokenUsage || visualizationTokenUsage)
  };
};