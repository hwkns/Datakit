import { useEffect } from 'react';

export interface KeyboardShortcuts {
  // Common shortcuts
  'ctrl+enter'?: () => void;
  'cmd+enter'?: () => void;
  'ctrl+s'?: () => void;
  'cmd+s'?: () => void;
  'escape'?: () => void;
  
  // Custom shortcuts
  [key: string]: (() => void) | undefined;
}

interface UseKeyboardShortcutsOptions {
  enabled?: boolean;
  preventDefault?: boolean;
  capture?: boolean;
}

export const useKeyboardShortcuts = (
  shortcuts: KeyboardShortcuts,
  options: UseKeyboardShortcutsOptions = {}
) => {
  const { enabled = true, preventDefault = true, capture = false } = options;

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      const ctrl = e.ctrlKey;
      const cmd = e.metaKey;
      const shift = e.shiftKey;
      const alt = e.altKey;

      // Build shortcut key
      let shortcutKey = '';
      if (ctrl) shortcutKey += 'ctrl+';
      if (cmd) shortcutKey += 'cmd+';
      if (shift) shortcutKey += 'shift+';
      if (alt) shortcutKey += 'alt+';
      shortcutKey += key;

      // Check for exact match
      const handler = shortcuts[shortcutKey];
      if (handler) {
        if (preventDefault) {
          e.preventDefault();
        }
        handler();
        return;
      }

      // Check for common cross-platform shortcuts
      if ((ctrl || cmd) && key === 'enter') {
        const ctrlEnterHandler = shortcuts['ctrl+enter'] || shortcuts['cmd+enter'];
        if (ctrlEnterHandler) {
          if (preventDefault) e.preventDefault();
          ctrlEnterHandler();
          return;
        }
      }

      if ((ctrl || cmd) && key === 's') {
        const saveHandler = shortcuts['ctrl+s'] || shortcuts['cmd+s'];
        if (saveHandler) {
          if (preventDefault) e.preventDefault();
          saveHandler();
          return;
        }
      }

      if (key === 'escape' && shortcuts.escape) {
        if (preventDefault) e.preventDefault();
        shortcuts.escape();
      }
    };

    window.addEventListener('keydown', handleKeyDown, capture);
    return () => window.removeEventListener('keydown', handleKeyDown, capture);
  }, [shortcuts, enabled, preventDefault, capture]);
};

// Utility for common workspace shortcuts
export const useWorkspaceShortcuts = (handlers: {
  onExecute?: () => void;
  onSave?: () => void;
  onEscape?: () => void;
}, options: UseKeyboardShortcutsOptions = {}) => {
  const shortcuts: KeyboardShortcuts = {};
  
  if (handlers.onExecute) {
    shortcuts['ctrl+enter'] = handlers.onExecute;
    shortcuts['cmd+enter'] = handlers.onExecute;
  }
  
  if (handlers.onSave) {
    shortcuts['ctrl+s'] = handlers.onSave;
    shortcuts['cmd+s'] = handlers.onSave;
  }
  
  if (handlers.onEscape) {
    shortcuts['escape'] = handlers.onEscape;
  }
  
  useKeyboardShortcuts(shortcuts, options);
};