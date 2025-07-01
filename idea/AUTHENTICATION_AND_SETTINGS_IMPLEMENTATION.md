# Authentication & Settings Implementation Guide

## Overview
This document details the complete implementation of secure authentication and user settings system for DataKit, including both backend and frontend components.

## Backend Implementation

### 🔐 Authentication System

#### Core Components

**1. Refresh Token Entity** (`/backend/api/src/auth/entities/refresh-token.entity.ts`)
```typescript
@Entity('refresh_tokens')
export class RefreshToken {
  @PrimaryGeneratedColumn('uuid')
  id: string;
  
  @Column('text')
  token: string;
  
  @Column('uuid')
  userId: string;
  
  @Column('timestamp')
  expiresAt: Date;
  
  @Column('boolean', { default: false })
  isRevoked: boolean;
  
  @Column('text', { nullable: true })
  ipAddress?: string;
  
  @Column('text', { nullable: true })
  userAgent?: string;
}
```

**2. Refresh Token Service** (`/backend/api/src/auth/refresh-token.service.ts`)
- Handles token generation, validation, rotation, and revocation
- Implements security features like IP tracking and automatic cleanup
- Key methods:
  - `generateRefreshToken()` - Creates new refresh tokens
  - `rotateRefreshToken()` - Implements token rotation for enhanced security
  - `revokeToken()` - Revokes tokens on logout
  - `cleanupExpiredTokens()` - Automatic cleanup of expired tokens

**3. Enhanced Auth Service** (`/backend/api/src/auth/auth.service.ts`)
- Updated to use short-lived access tokens (15 minutes)
- Long-lived refresh tokens (7 days)
- Secure token generation and validation
- Integration with refresh token rotation

**4. Auth Controller** (`/backend/api/src/auth/auth.controller.ts`)
- HttpOnly cookie implementation for secure token storage
- Cookie configuration:
  ```typescript
  res.cookie('access_token', result.access_token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 15 * 60 * 1000, // 15 minutes
  });
  
  res.cookie('refresh_token', result.refresh_token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
  ```

**5. User Settings Endpoints** (`/backend/api/src/users/users.controller.ts`)
- Fixed routing conflicts by adding specific settings routes
- Endpoints:
  - `GET /users/settings` - Retrieve user settings
  - `PATCH /users/settings` - Update user settings
  - Placed before parameterized routes to prevent UUID parsing errors

### 🏗️ Database Schema

**Refresh Tokens Table:**
- Primary key: UUID
- Token storage with expiration tracking
- User association and revocation status
- Security metadata (IP, User Agent)

## Frontend Implementation

### 🎨 Authentication System

#### Core Components

**1. Auth Store** (`/frontend/src/store/authStore.ts`)
- Zustand-based state management
- Cookie-based authentication (no localStorage)
- Key features:
  - `hasInitialized` flag to prevent multiple auth checks
  - Proper error handling and loading states
  - Automatic settings loading on login
  - Clean logout with state reset

**2. API Client** (`/frontend/src/lib/api/apiClient.ts`)
- Configured for cookie-based authentication
- `credentials: 'include'` for all requests
- Proper error handling for 401 responses
- No manual token management required

**3. Auth Service** (`/frontend/src/lib/api/authService.ts`)
- Clean API interface for authentication operations
- Methods: `login()`, `signup()`, `logout()`, `getCurrentUser()`
- No token storage - relies on httpOnly cookies

**4. Auth Components**

**AuthModal** (`/frontend/src/components/auth/AuthModal.tsx`)
- Clean login/signup modal interface
- Form validation and error handling
- Smooth transitions between login/signup modes

**UserMenu** (`/frontend/src/components/auth/UserMenu.tsx`)
- User dropdown menu for sidebar integration
- Shows user info and provides logout/settings access
- Variants for different placements

**ProtectedRoute** (`/frontend/src/components/auth/ProtectedRoute.tsx`)
- Route protection wrapper
- Redirects unauthenticated users to login

### 🛠️ Settings System

#### Settings Sidebar Component (`/frontend/src/components/layout/SettingsSidebar.tsx`)

**Design Features:**
- Matches main sidebar styling exactly
- Same color scheme, fonts, and spacing
- Consistent navigation patterns

**Structure:**
```typescript
// Header with back navigation
<div className="px-5 py-4 border-b border-white border-opacity-10">
  <ArrowLeft /> Settings
</div>

// Description text
<div className="px-5 py-4">
  <p>Manage your account settings...</p>
</div>

// Navigation items
<div className="space-y-1">
  - Profile
  - AI Settings  
  - Notifications
  - Subscription
</div>

// Footer with back action
<div className="border-t">
  Back to your panel
</div>
```

#### Settings Page (`/frontend/src/pages/Settings.tsx`)

**Layout Structure:**
```typescript
<div className="flex h-screen bg-background overflow-hidden">
  {/* Settings Sidebar */}
  <SettingsSidebar activeTab={activeTab} onTabChange={setActiveTab} />
  
  {/* Centered Content Area */}
  <div className="flex-1 h-full overflow-hidden flex items-center justify-center">
    <div className="w-full max-w-2xl p-8">
      <div className="bg-darkNav rounded-lg p-8">
        {renderTabContent()}
      </div>
    </div>
  </div>
</div>
```

**Content Sections:**
1. **Profile**: Name editing, email display (read-only)
2. **AI Settings**: Provider selection (DataKit AI, OpenAI, Anthropic), model preferences
3. **Notifications**: Email notifications, usage alerts with toggle switches
4. **Subscription**: Current plan display, credits remaining, upgrade options

### 🔒 Security Implementation

#### HttpOnly Cookies Strategy
- **Access tokens**: 15-minute expiration, httpOnly, secure, sameSite=strict
- **Refresh tokens**: 7-day expiration with automatic rotation
- **No localStorage**: Prevents XSS token theft
- **CORS**: Configured with credentials support

#### Token Rotation
- Automatic refresh token rotation on use
- Old tokens immediately revoked
- IP and User Agent tracking for security
- Automatic cleanup of expired tokens

#### Auth State Management
- Global auth check in `App.tsx` on startup
- `hasInitialized` flag prevents multiple checks
- Proper error handling without infinite loops
- Persistent auth state across route changes

### 🎯 User Experience

#### Navigation Flow
1. **Unauthenticated**: Shows login modal, protects routes
2. **Authenticated**: Access to all features, user menu in sidebar
3. **Settings**: Dedicated sidebar with same styling as main app
4. **Logout**: Clean state reset, redirect to home

#### Layout Consistency
- Settings page uses same design language as main app
- Sidebar styling matches exactly (colors, fonts, spacing)
- Centered content area for focused interaction
- Smooth animations and transitions

## Key Files Summary

### Backend Files
```
/backend/api/src/auth/
├── entities/refresh-token.entity.ts     # Refresh token database model
├── refresh-token.service.ts             # Token management service
├── auth.service.ts                      # Enhanced auth with cookies
├── auth.controller.ts                   # Cookie-based endpoints
└── strategies/jwt.strategy.ts           # JWT validation strategy

/backend/api/src/users/
├── users.controller.ts                  # User settings endpoints
├── entities/user.entity.ts              # User model with relations
└── users.service.ts                     # User operations
```

### Frontend Files
```
/frontend/src/
├── store/authStore.ts                   # Authentication state management
├── lib/api/
│   ├── apiClient.ts                     # Cookie-enabled HTTP client
│   ├── authService.ts                   # Auth API interface
│   └── userService.ts                   # User settings API
├── components/
│   ├── auth/
│   │   ├── AuthModal.tsx                # Login/signup modal
│   │   ├── UserMenu.tsx                 # User dropdown menu
│   │   └── ProtectedRoute.tsx           # Route protection
│   └── layout/
│       └── SettingsSidebar.tsx          # Settings navigation sidebar
├── pages/
│   └── Settings.tsx                     # Main settings page
├── hooks/auth/
│   └── useAuth.ts                       # Auth hook interface
└── types/
    └── auth.ts                          # TypeScript interfaces
```

## Security Best Practices Implemented

1. **HttpOnly Cookies**: Prevents XSS token theft
2. **Refresh Token Rotation**: Enhanced security through token cycling
3. **Short Access Token Lifetime**: Minimizes exposure window
4. **CSRF Protection**: SameSite cookie configuration
5. **IP Tracking**: Security monitoring for token usage
6. **Automatic Cleanup**: Expired token removal
7. **Secure Headers**: Proper CORS and security headers
8. **Input Validation**: Proper DTO validation on all endpoints

## Next Steps for Enhancement

1. **DataKit AI Integration**: Connect authenticated users to company AI credits
2. **Subscription Management**: Stripe integration for payments
3. **Usage Analytics**: Track and display user credit consumption
4. **Account Management**: Password reset, email verification
5. **Security Features**: 2FA, session management, security logs

## Testing

### Backend Testing
- Unit tests for auth service methods
- Integration tests for auth endpoints
- Security testing for token validation
- Database integration tests

### Frontend Testing
- Component testing for auth forms
- Integration testing for auth flows
- End-to-end testing for complete user journeys
- Security testing for XSS prevention

This implementation provides a robust, secure foundation for user authentication and settings management in DataKit, following modern security best practices while maintaining excellent user experience.