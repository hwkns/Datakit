// TODO: To be configuered properly
import { useCallback } from "react";

declare global {
  interface Window {
    plausible?: (
      event: string,
      options?: {
        props?: Record<string, string | number | boolean>;
        revenue?: { currency: string; amount: number };
        callback?: () => void;
      }
    ) => void;
  }
}

interface AnalyticsEvent {
  name: string;
  props?: Record<string, string | number | boolean>;
}

export const useAnalytics = () => {
  const track = useCallback((event: AnalyticsEvent) => {
    // Only track if user has consented and plausible is loaded
    if (window.plausible && typeof window.plausible === "function") {
      try {
        window.plausible(event.name, {
          props: event.props,
        });
      } catch (error) {
        console.warn("Analytics tracking failed:", error);
      }
    }
  }, []);

  // Convenience methods for common events
  const trackFileUpload = useCallback(
    (result: any) => {
      track({
        name: "File Upload",
        props: { ...result },
      });
    },
    [track]
  );

  const trackQuery = useCallback(
    (queryType: string, executionTime?: number) => {
      track({
        name: "Query Executed",
        props: {
          query_type: queryType,
          execution_time_ms: executionTime,
        },
      });
    },
    [track]
  );

  const trackVisualization = useCallback(
    (chartType: string, dataPoints: number) => {
      track({
        name: "Visualization Created",
        props: {
          chart_type: chartType,
          data_points: dataPoints,
        },
      });
    },
    [track]
  );

  const trackTabChange = useCallback(
    (fromTab: string, toTab: string) => {
      track({
        name: "Tab Changed",
        props: {
          from_tab: fromTab,
          to_tab: toTab,
        },
      });
    },
    [track]
  );

  const trackFeatureUsage = useCallback(
    (feature: string, context?: string) => {
      track({
        name: "Feature Used",
        props: {
          feature_name: feature,
          context: context || "unknown",
        },
      });
    },
    [track]
  );

  return {
    track,
    trackFileUpload,
    trackQuery,
    trackVisualization,
    trackTabChange,
    trackFeatureUsage,
  };
};
