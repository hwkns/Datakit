import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ 
  content, 
  className = '' 
}) => {
  return (
    <ReactMarkdown
      className={`prose prose-invert max-w-none ${className}`}
      remarkPlugins={[remarkGfm]}
      components={{
        // Style headings
        h1: ({ children }) => (
          <h1 className="text-lg font-semibold text-white mb-3 border-b border-white/20 pb-1">
            {children}
          </h1>
        ),
        h2: ({ children }) => (
          <h2 className="text-base font-semibold text-white mb-2">
            {children}
          </h2>
        ),
        h3: ({ children }) => (
          <h3 className="text-sm font-medium text-white/90 mb-2">
            {children}
          </h3>
        ),
        
        // Style paragraphs
        p: ({ children }) => (
          <p className="text-sm text-white/80 leading-relaxed mb-3">
            {children}
          </p>
        ),
        
        // Style lists
        ul: ({ children }) => (
          <ul className="list-disc list-inside text-sm text-white/80 space-y-1 mb-3 ml-2">
            {children}
          </ul>
        ),
        ol: ({ children }) => (
          <ol className="list-decimal list-inside text-sm text-white/80 space-y-1 mb-3 ml-2">
            {children}
          </ol>
        ),
        li: ({ children }) => (
          <li className="text-white/80">{children}</li>
        ),
        
        // Style strong/bold text
        strong: ({ children }) => (
          <strong className="font-semibold text-white">{children}</strong>
        ),
        
        // Style code
        code: ({ children, className }) => {
          const isInline = !className;
          if (isInline) {
            return (
              <code className="bg-white/10 text-white/90 px-1.5 py-0.5 rounded text-xs font-mono">
                {children}
              </code>
            );
          }
          // Block code (this won't be used since we handle SQL blocks separately)
          return (
            <code className="block bg-white/5 text-white/90 p-3 rounded text-xs font-mono overflow-x-auto">
              {children}
            </code>
          );
        },
        
        // Style blockquotes
        blockquote: ({ children }) => (
          <blockquote className="border-l-2 border-blue-400/50 pl-3 text-white/70 italic mb-3">
            {children}
          </blockquote>
        ),
        
        // Style tables
        table: ({ children }) => (
          <div className="overflow-x-auto mb-3">
            <table className="min-w-full text-xs text-white/80 border border-white/20">
              {children}
            </table>
          </div>
        ),
        th: ({ children }) => (
          <th className="px-2 py-1 bg-white/10 border border-white/20 font-medium text-white">
            {children}
          </th>
        ),
        td: ({ children }) => (
          <td className="px-2 py-1 border border-white/20">
            {children}
          </td>
        ),
        
        // Style links
        a: ({ children, href }) => (
          <a 
            href={href} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-400 hover:text-blue-300 underline"
          >
            {children}
          </a>
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  );
};

export default MarkdownRenderer;