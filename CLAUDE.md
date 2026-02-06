# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Umiri.me ("Calm me") is a mood tracking web application for the Serbian market. Users log daily moods via emoji selection, view trends through calendars and charts, receive AI-powered advice, and share mood cards on social media. Freemium model with Stripe payments.

## Architecture

- **Frontend**: React 19 SPA (Create React App + Craco) in `/frontend`
- **Backend**: Single-file FastAPI server in `/backend/server.py`
- **Database**: MongoDB (async via Motor)
- **External services**: Stripe (payments), Emergent LLM/GPT-5.2 (AI tips), Emergent Auth (Google OAuth)

## Development Commands

### Frontend (from `/frontend`)
```bash
yarn install          # Install dependencies
yarn start            # Dev server on localhost:3000
yarn build            # Production build
yarn test             # Run Jest tests
```

### Backend (from `/backend`)
```bash
pip install -r requirements.txt
uvicorn server:app --host 0.0.0.0 --port 8001 --reload
```

### Backend testing
```bash
pytest                # Run from project root
```

## Environment Variables

### Backend (`/backend/.env`)
- `MONGO_URL` - MongoDB connection string
- `DB_NAME` - Database name
- `CORS_ORIGINS` - Allowed CORS origins (comma-separated)
- `EMERGENT_LLM_KEY` - API key for AI tips (GPT-5.2 via Emergent)
- `STRIPE_API_KEY` - Stripe secret key
- `ADMIN_EMAILS` - Comma-separated admin email addresses

### Frontend (`/frontend/.env`)
- `REACT_APP_BACKEND_URL` - Backend API URL (e.g., `http://localhost:8001`)

## Key Architecture Decisions

### Frontend
- **Routing**: React Router v7 with `ProtectedRoute` wrapper in `App.js` that checks `/api/auth/me`
- **State**: Local component state only (no Redux/Context). Each page fetches its own data via `useEffect`
- **UI**: 50+ shadcn/ui components (New York style) in `src/components/ui/`. Custom components in `src/components/`
- **Path alias**: `@/*` maps to `src/*` (configured in `craco.config.js` and `jsconfig.json`)
- **Styling**: TailwindCSS with custom sage/sand color palette defined in `tailwind.config.js`
- **API calls**: Native `fetch` with `credentials: 'include'` for cookie-based auth

### Backend
- **Single file**: All endpoints live in `backend/server.py`
- **Auth**: Session tokens stored in httpOnly cookies, verified against `user_sessions` collection
- **Admin check**: Compares user email against `ADMIN_EMAILS` env var
- **Premium check**: `is_premium()` / `get_subscription_info()` helpers query `subscriptions` collection

### MongoDB Collections
`users`, `user_sessions`, `moods`, `subscriptions`, `payment_transactions`, `ai_tips_usage`

## Design System

Defined in `/design_guidelines.json`. Key rules:
- **Theme**: "Soft Organic" — no sharp corners, no pure black (#000000), use #2D3A3A instead
- **Fonts**: Merriweather (serif) for headings, Figtree (sans-serif) for body text
- **Colors**: Sage green (#4A6C6F) primary, bone white (#F9F9F7) background, warm sand accents
- **Radius**: Default `rounded-2xl`, buttons `rounded-full`
- **Language**: All UI text in Serbian (Latin script)
- **Icons**: Lucide React with `stroke-width={1.5}`
- **Toasts**: Use `sonner` library
- **Animations**: Framer Motion for page transitions
- **Testing attributes**: Add `data-testid` to all interactive elements

## Frontend Routes

| Route | Page Component | Access |
|-------|---------------|--------|
| `/` | Landing.js | Public |
| `/auth/callback` | AuthCallback.js | Public |
| `/dashboard` | Dashboard.js | Protected |
| `/mood` | MoodEntry.js | Protected |
| `/calendar` | CalendarView.js | Protected |
| `/statistics` | Statistics.js | Protected |
| `/weekly-report` | WeeklyReport.js | Protected |
| `/profile` | Profile.js | Protected |
| `/share` | ShareCard.js | Protected |
| `/premium` | PremiumPage.js | Protected |
| `/premium/success` | PaymentSuccess.js | Protected |
| `/admin` | AdminPanel.js | Admin only |

## Important Patterns

- **Mood types**: 8 types defined in `frontend/src/lib/api.js` (MOOD_TYPES constant) with emoji, label, score (1-5), and color
- **Trigger types**: 12 life triggers defined in `frontend/src/lib/api.js` (TRIGGER_TYPES constant)
- **One mood per day**: Backend uses upsert pattern on the `date` field
- **AI rate limiting**: Free users get 1 AI tip/day, tracked in `ai_tips_usage` collection
- **7-day trial**: Auto-activated for new users on first registration
