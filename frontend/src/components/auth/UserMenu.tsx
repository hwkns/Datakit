import React, { useState, useRef, useEffect } from 'react';
import { User, Settings, LogOut, CreditCard, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/auth/useAuth';
import AuthModal from './AuthModal';

interface UserMenuProps {
  variant?: 'sidebar' | 'header';
  className?: string;
}

const UserMenu: React.FC<UserMenuProps> = ({ 
  variant = 'header',
  className = '' 
}) => {
  const { user, isAuthenticated, logout } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await logout();
    setShowDropdown(false);
  };

  const goToSettings = () => {
    setShowDropdown(false);
    // Navigate to settings page
    window.location.href = '/settings';
  };

  if (!isAuthenticated) {
    return (
      <>
        <Button
          variant="primary"
          size="sm"
          onClick={() => setShowAuthModal(true)}
          className={className}
        >
          <User size={14} className="mr-1.5" />
          <span className="text-xs">Sign In</span>
        </Button>
        
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          defaultMode="login"
        />
      </>
    );
  }

  // Get user initials for avatar fallback
  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : user?.email[0].toUpperCase() || '?';

  if (variant === 'sidebar') {
    return (
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className={`w-full flex items-center gap-2 p-2 rounded text-white/80 hover:text-white hover:bg-white/5 transition-colors ${className}`}
        >
          {/* Avatar */}
          <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-xs font-medium text-white">
            {user?.avatarUrl ? (
              <img 
                src={user.avatarUrl} 
                alt={user.name || user.email}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              initials
            )}
          </div>
          
          <div className="flex-1 text-left min-w-0">
            <div className="text-sm font-medium truncate">
              {user?.name || 'User'}
            </div>
            <div className="text-xs text-white/60 truncate">
              {user?.email}
            </div>
          </div>
          
          <ChevronDown 
            size={14} 
            className={`transition-transform ${showDropdown ? 'rotate-180' : ''}`}
          />
        </button>

        {/* Dropdown Menu */}
        {showDropdown && (
          <div className="absolute bottom-full left-0 mb-2 w-full bg-black border border-white/10 rounded-lg shadow-lg py-1 z-50">
            <button
              onClick={goToSettings}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-white/80 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
            >
              <Settings size={14} />
              Settings
            </button>
            
            
            <hr className="border-white/10 my-1" />
            
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-white/80 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
            >
              <LogOut size={14} />
              Sign Out
            </button>
          </div>
        )}
      </div>
    );
  }

  // Header variant
  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className={`flex items-center gap-2 p-2 rounded text-white/80 hover:text-white hover:bg-white/5 transition-colors ${className}`}
      >
        {/* Avatar */}
        <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-xs font-medium text-white">
          {user?.avatarUrl ? (
            <img 
              src={user.avatarUrl} 
              alt={user.name || user.email}
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            initials
          )}
        </div>
        
        <ChevronDown 
          size={14} 
          className={`transition-transform ${showDropdown ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Dropdown Menu */}
      {showDropdown && (
        <div className="absolute right-0 top-full mt-2 w-48 bg-darkNav border border-white/10 rounded-lg shadow-lg py-1 z-50">
          <div className="px-3 py-2 border-b border-white/10">
            <div className="text-sm font-medium text-white">
              {user?.name || 'User'}
            </div>
            <div className="text-xs text-white/60">
              {user?.email}
            </div>
          </div>
          
          <button
            onClick={goToSettings}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-white/80 hover:text-white hover:bg-white/5 transition-colors"
          >
            <Settings size={14} />
            Settings
          </button>
          
          <button
            onClick={() => {
              setShowDropdown(false);
              // Open billing portal or subscription management
            }}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-white/80 hover:text-white hover:bg-white/5 transition-colors"
          >
            <CreditCard size={14} />
            Billing
          </button>
          
          <hr className="border-white/10 my-1" />
          
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-white/80 hover:text-white hover:bg-white/5 transition-colors"
          >
            <LogOut size={14} />
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
};

export default UserMenu;