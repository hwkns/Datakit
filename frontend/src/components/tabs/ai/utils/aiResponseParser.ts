export interface ParsedAIResponse {
  title: string;
  queryDescription: string;
  queryName: string;
  detailedAnalysis: string;
  stepByStepExplanation: ThinkingStep[];
}

export interface ThinkingStep {
  title: string;
  subtitle: string;
  explanation: string;
}

export interface StreamingStatusPair {
  title: string;
  subtitle: string;
}

export interface ParsedStreamingResponse {
  title: string;
  subtitle: string;
  statusPairs: StreamingStatusPair[];
  insightTitle?: string; // The persistent insight title
}

/**
 * Parse structured AI response for clean UI display
 */
export const parseAIResponse = (text: string): ParsedAIResponse => {
  if (!text) return { 
    title: 'Data Analysis', 
    queryDescription: '',
    queryName: 'Analysis', 
    detailedAnalysis: '',
    stepByStepExplanation: []
  };
  
  // Extract INSIGHT_TITLE
  const titleMatch = text.match(/\*\*INSIGHT_TITLE:\*\*\s*(.+?)$/m);
  const title = titleMatch ? titleMatch[1].trim() : 'Data Analysis Complete';
  
  // Extract QUERY_DESCRIPTION
  const descriptionMatch = text.match(/\*\*QUERY_DESCRIPTION:\*\*\s*(.+?)$/m);
  const queryDescription = descriptionMatch ? descriptionMatch[1].trim() : '';
  
  // Extract QUERY_NAME
  const queryNameMatch = text.match(/\*\*QUERY_NAME:\*\*\s*(.+?)$/m);
  const queryName = queryNameMatch ? queryNameMatch[1].trim() : 'Analysis';
  
  // Extract DETAILED_ANALYSIS
  const detailedMatch = text.match(/\*\*DETAILED_ANALYSIS:\*\*\s*([\s\S]*?)(?=\n\*\*|$)/);
  const detailedAnalysis = detailedMatch ? detailedMatch[1].trim() : text;
  
  // Extract step-by-step thinking process
  const stepByStepExplanation = extractThinkingSteps(text);
  
  return { title, queryDescription, queryName, detailedAnalysis, stepByStepExplanation };
};

/**
 * Extract thinking steps from AI response text
 */
export const extractThinkingSteps = (text: string): ThinkingStep[] => {
  const steps: ThinkingStep[] = [];
  
  // Find all STATUS_TITLE and STATUS_SUBTITLE pairs with their explanations
  const statusRegex = /\*\*STATUS_TITLE:\*\*\s*(.+?)\n\*\*STATUS_SUBTITLE:\*\*\s*(.+?)\n([\s\S]*?)(?=\*\*STATUS_TITLE:\*\*|\*\*INSIGHT_TITLE:\*\*|```|$)/g;
  
  let match;
  while ((match = statusRegex.exec(text)) !== null) {
    const title = match[1].trim();
    const subtitle = match[2].trim();
    const explanation = match[3].trim();
    
    // Clean up explanation - remove extra markdown markers and empty lines
    const cleanExplanation = explanation
      .replace(/^\*\*.*?\*\*$/gm, '') // Remove any remaining markdown headers
      .replace(/^\s*$/gm, '') // Remove empty lines
      .split('\n')
      .filter(line => line.trim().length > 0)
      .join('\n')
      .trim();
    
    if (title && subtitle && cleanExplanation) {
      steps.push({ title, subtitle, explanation: cleanExplanation });
    }
  }
  
  return steps;
};

/**
 * Extract completed thinking steps from streaming response text
 * Returns steps that have complete explanations (not just titles)
 */
export const extractCompletedThinkingSteps = (text: string): ThinkingStep[] => {
  if (!text) return [];
  
  const steps: ThinkingStep[] = [];
  
  // Split text by STATUS_TITLE markers to find complete step blocks
  const titleMarkers = text.split(/\*\*STATUS_TITLE:\*\*/);
  
  // Skip the first element (before any STATUS_TITLE)
  for (let i = 1; i < titleMarkers.length; i++) {
    const block = titleMarkers[i];
    
    // Extract title (first line)
    const lines = block.split('\n');
    const title = lines[0]?.trim();
    if (!title) continue;
    
    // Find STATUS_SUBTITLE
    const subtitleMatch = block.match(/\*\*STATUS_SUBTITLE:\*\*\s*(.+)/);
    const subtitle = subtitleMatch ? subtitleMatch[1].trim() : '';
    if (!subtitle) continue;
    
    // Extract explanation (content after subtitle, before next marker or end)
    const afterSubtitle = block.substring(block.indexOf('**STATUS_SUBTITLE:**') + subtitle.length + 20);
    const explanation = afterSubtitle
      .split(/\*\*(?:STATUS_TITLE|INSIGHT_TITLE|QUERY_NAME):/)[0] // Stop at next marker
      .replace(/```[\s\S]*?```/g, '') // Remove code blocks
      .replace(/^\*\*.*?\*\*$/gm, '') // Remove markdown headers
      .split('\n')
      .filter(line => line.trim().length > 0)
      .join('\n')
      .trim();
    
    // Only include steps with substantial explanations (more than just the title/subtitle)
    if (title && subtitle && explanation && explanation.length > 20) {
      steps.push({ title, subtitle, explanation });
    }
  }
  
  return steps;
};

/**
 * Parse AI response for status updates and dynamic titles during streaming
 */
export const parseStreamingResponse = (text: string): ParsedStreamingResponse => {
  
  // Extract STATUS_TITLE and STATUS_SUBTITLE pairs
  const statusTitles = text.match(/\*\*STATUS_TITLE:\*\*\s*(.+?)$/gm);
  const statusSubtitles = text.match(/\*\*STATUS_SUBTITLE:\*\*\s*(.+?)$/gm);
  
  const statusPairs: StreamingStatusPair[] = [];
  if (statusTitles && statusSubtitles) {
    const titles = statusTitles.map(match => match.replace(/\*\*STATUS_TITLE:\*\*\s*/, '').trim());
    const subtitles = statusSubtitles.map(match => match.replace(/\*\*STATUS_SUBTITLE:\*\*\s*/, '').trim());
    
    // Pair them up (take the minimum length to avoid mismatched pairs)
    const pairCount = Math.min(titles.length, subtitles.length);
    for (let i = 0; i < pairCount; i++) {
      statusPairs.push({ title: titles[i], subtitle: subtitles[i] });
    }
  }
  
  // Extract INSIGHT_TITLE if available during streaming
  const insightTitleMatch = text.match(/\*\*INSIGHT_TITLE:\*\*\s*(.+?)$/m);
  const insightTitle = insightTitleMatch ? insightTitleMatch[1].trim() : undefined;
  
  // For the dynamic title, use the latest status or fallback
  const dynamicTitle = statusPairs.length > 0 ? statusPairs[statusPairs.length - 1].title : '';
  const dynamicSubtitle = statusPairs.length > 0 ? statusPairs[statusPairs.length - 1].subtitle : '';
  
  return { 
    title: dynamicTitle, 
    subtitle: dynamicSubtitle, 
    statusPairs,
    insightTitle 
  };
};

/**
 * Determine current title and subtitle to show during streaming with dual-title system
 */
export const getCurrentStreamingDisplay = (
  title: string, 
  subtitle: string, 
  statusPairs: StreamingStatusPair[],
  insightTitle?: string
): { currentTitle: string; currentSubtitle: string; insightTitle?: string } => {
  // Always return the dynamic status title/subtitle as the main display
  const currentTitle = title;
  const currentSubtitle = subtitle;
  
  // Return both the dynamic status and the persistent insight title
  return { 
    currentTitle, 
    currentSubtitle, 
    insightTitle 
  };
};

/**
 * Check if a message appears to be requesting clarification
 */
export const isRequestingClarification = (content: string): boolean => {
  return content.includes('?') || 
         content.toLowerCase().includes('clarify') || 
         content.toLowerCase().includes('need more') || 
         content.toLowerCase().includes('which');
};