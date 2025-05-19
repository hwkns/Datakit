import { useState, useRef, useEffect } from "react";

interface UsePopoverProps {
  initialState?: boolean;
}

/**
 * Custom hook to manage popover state and click-outside behavior
 */
export function usePopover({ initialState = false }: UsePopoverProps = {}) {
  const [isOpen, setIsOpen] = useState(initialState);
  const ref = useRef<HTMLDivElement>(null);

  // Handle click outside to close the popover
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const toggle = () => setIsOpen(!isOpen);
  const close = () => setIsOpen(false);
  const open = () => setIsOpen(true);

  return {
    isOpen,
    toggle,
    close,
    open,
    ref
  };
}

export default usePopover;