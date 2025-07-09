import React from 'react';

interface SplitResizeHandleProps {
  onResize: (e: React.MouseEvent) => void;
  isVisible: boolean;
}

const SplitResizeHandle: React.FC<SplitResizeHandleProps> = ({
  onResize,
  isVisible
}) => {
  if (!isVisible) return null;

  return (
    <div
      onMouseDown={onResize}
      className="absolute right-0 top-0 bottom-0 w-1 cursor-ew-resize hover:bg-primary/20 transition-colors z-10"
    />
  );
};

export default SplitResizeHandle;