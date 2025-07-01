# DataKit API

Backend API for DataKit with user authentication, subscription management, and AI credits system.

## Features

- 🔐 JWT-based authentication
- 👤 User management with profiles
- 💳 Subscription plans (Free, Pro, Enterprise)
- 🤖 AI credits system for usage tracking
- 🔄 Monthly credit renewal
- 🚀 AI proxy endpoints for DataKit AI models

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Setup Database
You can use either a local PostgreSQL database or Supabase:

#### Option A: Local PostgreSQL
```bash
# Install PostgreSQL and create database
createdb datakit

# Update .env with your database credentials
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=your_password
DATABASE_NAME=datakit
```

#### Option B: Supabase
1. Create a new project at [supabase.com](https://supabase.com)
2. Go to Settings > Database
3. Copy the connection string and update your .env

### 3. Environment Variables
Copy `.env.example` to `.env` and configure:
```bash
cp .env.example .env
```

### 4. Run the Application
```bash
# Development
npm run start:dev

# Production build
npm run build
npm run start:prod
```

The API will be available at `http://localhost:3001/api`

## API Endpoints

### Authentication
- `POST /api/auth/signup` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/refresh` - Refresh token

### Users
- `GET /api/users/profile` - Get user profile
- `PATCH /api/users/profile` - Update user profile

### Subscriptions
- `GET /api/subscriptions/my-subscription` - Get user subscription
- `GET /api/subscriptions/credits` - Get remaining credits
- `POST /api/subscriptions/use-credits` - Use credits
- `PATCH /api/subscriptions/update-plan` - Update subscription plan

### Credits
- `POST /api/credits/check` - Check available credits
- `POST /api/credits/calculate` - Calculate credit cost
- `GET /api/credits/usage` - Get usage history
- `GET /api/credits/stats` - Get usage statistics

### AI Proxy
- `POST /api/ai/chat/completions` - AI chat completions (requires auth)

## Database Schema

### Users
- User accounts with email/password authentication
- Profile information (name, avatar)
- Email verification status
- Stripe customer ID for billing

### Subscriptions
- Free: 100 credits/month
- Pro: 10,000 credits/month
- Enterprise: Unlimited credits
- Monthly credit renewal

### Credit Usage
- Track AI model usage
- Token consumption (input/output)
- Cost calculation per model
- Usage analytics

## Development

```bash
# Install dependencies
npm install

# Run in development mode
npm run start:dev

# Run tests
npm run test

# Build for production
npm run build
```

## Deployment

1. Set production environment variables
2. Build the application: `npm run build`
3. Start the server: `npm run start:prod`

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_HOST` | PostgreSQL host | localhost |
| `DATABASE_PORT` | PostgreSQL port | 5432 |
| `DATABASE_USERNAME` | Database username | postgres |
| `DATABASE_PASSWORD` | Database password | - |
| `DATABASE_NAME` | Database name | datakit |
| `JWT_SECRET` | JWT secret key | - |
| `JWT_EXPIRATION` | JWT expiration time | 7d |
| `PORT` | API server port | 3001 |
| `NODE_ENV` | Environment | development |
| `FRONTEND_URL` | Frontend URL for CORS | http://localhost:5173 |
| `OPENAI_API_KEY` | OpenAI API key | - |
| `ANTHROPIC_API_KEY` | Anthropic API key | - |
| `GROQ_API_KEY` | Groq API key | - |