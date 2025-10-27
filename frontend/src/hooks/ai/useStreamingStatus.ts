import { useState, useEffect, useMemo } from 'react';
import { 
  getCurrentStreamingStatus, 
  parseAIResponse,
  detectQueryIntent 
} from '@/components/tabs/ai/utils/smartParsing';

interface StreamingState {
  currentStatus: string;
  progress: number;
  phase: 'initial' | 'processing' | 'finalizing' | 'complete';
  insight?: string;
  summary?: string;
  hasCode: boolean;
  queryIntent: ReturnType<typeof detectQueryIntent>;
}

export function useStreamingStatus(
  streamingResponse: string | null,
  isProcessing: boolean,
  userPrompt?: string
): StreamingState {
  const [state, setState] = useState<StreamingState>({
    currentStatus: '',
    progress: 0,
    phase: 'initial',
    hasCode: false,
    queryIntent: { type: 'general', confidence: 0.5 }
  });

  // Detect query intent once from user prompt
  const queryIntent = useMemo(() => {
    if (!userPrompt) return { type: 'general' as const, confidence: 0.5 };
    return detectQueryIntent(userPrompt);
  }, [userPrompt]);

  useEffect(() => {
    if (!streamingResponse) {
      if (isProcessing) {
        // Just started processing
        setState({
          currentStatus: 'Understanding your request',
          progress: 10,
          phase: 'initial',
          hasCode: false,
          queryIntent
        });
      } else {
        // Not processing, reset
        setState({
          currentStatus: '',
          progress: 0,
          phase: 'initial',
          hasCode: false,
          queryIntent
        });
      }
      return;
    }

    // Parse the streaming response
    const parsed = parseAIResponse(streamingResponse);
    const currentStreaming = getCurrentStreamingStatus(streamingResponse);

    setState({
      currentStatus: currentStreaming.status,
      progress: currentStreaming.progress,
      phase: currentStreaming.phase,
      insight: parsed.insight,
      summary: parsed.summary,
      hasCode: Boolean(parsed.sqlQuery || parsed.pythonCode),
      queryIntent
    });
  }, [streamingResponse, isProcessing, queryIntent]);

  return state;
}

/**
 * Hook for managing context pills based on streaming state
 */
export function useContextPills(streamingState: StreamingState): string[] {
  const { phase, queryIntent, progress } = streamingState;
  
  const pills: string[] = [];

  // Add intent-based pills
  if (queryIntent.confidence > 0.7) {
    switch (queryIntent.type) {
      case 'aggregation':
        pills.push('aggregating');
        break;
      case 'visualization':
        pills.push('visualizing');
        break;
      case 'exploration':
        pills.push('exploring');
        break;
      case 'transformation':
        pills.push('transforming');
        break;
    }
  }

  // Add phase-based pills
  if (phase === 'processing' || phase === 'finalizing') {
    if (progress > 50) pills.push('optimizing');
    if (progress > 75) pills.push('finalizing');
  }

  if (streamingState.hasCode) {
    pills.push('ready');
  }

  return pills;
}