import React, { useRef, useState } from 'react';
import { Download, Copy, Check, Save } from 'lucide-react';
import { toPng } from 'html-to-image';

import { useChartsStore } from '@/store/chartsStore';
import { Button } from '@/components/ui/Button';

/**
 * Component for chart controls like export, save, and download
 */
const ChartControls: React.FC = () => {
  const { currentChart, saveCurrentChart } = useChartsStore();
  const [copied, setCopied] = useState(false);
  const chartRef = useRef<HTMLDivElement>(null);
  
  // Don't show controls if no chart
  if (!currentChart) {
    return null;
  }
  
  // Get reference to the chart element (parent chart container)
  const getChartElement = (): HTMLElement | null => {
    if (chartRef.current) {
      return chartRef.current.parentElement; 
    }
    
    // Fallback to querying the DOM
    return document.querySelector('.recharts-wrapper')?.parentElement || null;
  };
  
  // Export chart as PNG
  const exportAsPNG = async () => {
    const chartElement = getChartElement();
    if (!chartElement) return;
    
    try {
      const dataUrl = await toPng(chartElement, { 
        backgroundColor: '#1a1b26',
        quality: 0.95
      });
      
      // Create a download link
      const link = document.createElement('a');
      link.download = `${currentChart.title.replace(/\s+/g, '_')}_${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error('Error exporting chart:', error);
    }
  };
  
  // Copy chart to clipboard
  const copyToClipboard = async () => {
    const chartElement = getChartElement();
    if (!chartElement) return;
    
    try {
      const dataUrl = await toPng(chartElement, { 
        backgroundColor: '#1a1b26',
        quality: 0.95
      });
      
      // Convert data URL to Blob
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      
      // Copy to clipboard using Clipboard API
      await navigator.clipboard.write([
        new ClipboardItem({
          [blob.type]: blob
        })
      ]);
      
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Error copying chart:', error);
    }
  };
  
  return (
    <div ref={chartRef} className="flex justify-between items-center">
      <div className="text-sm text-white/70">
        {currentChart.data.length} data points
      </div>
      
      <div className="flex space-x-2">
        <Button variant="ghost" onClick={copyToClipboard}>
          {copied ? (
            <>
              <Check size={16} className="mr-1 text-primary" />
              Copied!
            </>
          ) : (
            <>
              <Copy size={16} className="mr-1" />
              Copy
            </>
          )}
        </Button>
        
        <Button variant="ghost" onClick={exportAsPNG}>
          <Download size={16} className="mr-1" />
          Download
        </Button>
        
        <Button variant="primary" onClick={saveCurrentChart}>
          <Save size={16} className="mr-1" />
          Save Chart
        </Button>
      </div>
    </div>
  );
};

export default ChartControls;