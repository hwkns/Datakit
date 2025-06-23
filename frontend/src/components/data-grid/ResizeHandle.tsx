import React, { useCallback } from "react";

interface ResizeHandleProps {
  columnIndex: number;
  left: number;
  height: number;
  onResizeStart: (columnIndex: number, startX: number) => void;
}

const ResizeHandle: React.FC<ResizeHandleProps> = ({
  columnIndex,
  left,
  height,
  onResizeStart,
}) => {
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onResizeStart(columnIndex, e.clientX);
  }, [columnIndex, onResizeStart]);

  return (
    <div
      className="absolute top-0 w-1 cursor-col-resize pointer-events-auto hover:bg-blue-500/50 transition-colors duration-150 z-10"
      style={{
        left: left - 2, // Center the handle on the column border
        height: height,
        width: 4, // Make it a bit wider for easier grabbing
      }}
      onMouseDown={handleMouseDown}
    >
      {/* Visual indicator on hover */}
      <div className="absolute inset-0 bg-transparent hover:bg-blue-500/30 transition-colors duration-150" />
    </div>
  );
};

export default ResizeHandle;