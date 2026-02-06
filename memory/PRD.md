# Umiri.me - PRD (Product Requirements Document)

## Problem Statement
Build a mood tracker app (umiri.me) for the Serbian market. Users record daily moods with emoji-based selection and optional notes. Includes mood history with calendar and graph views, CSV data export, gamification (streaks & badges), social sharing, and AI-powered daily tips via GPT-5.2. Google OAuth login. All UI in Serbian. Calming/soothing visual theme.

## Architecture
- **Frontend**: React + Tailwind CSS + Shadcn/UI + Framer Motion + Recharts
- **Backend**: FastAPI + Motor (async MongoDB) + Emergent Integrations (LLM)
- **Database**: MongoDB (collections: users, user_sessions, moods)
- **Auth**: Emergent Google OAuth
- **AI**: GPT-5.2 via Emergent LLM Key

## User Personas
1. **Mladi Profesionalci (25-35)**: Žele da prate mentalno zdravlje, koriste app svakodnevno
2. **Studenti (18-25)**: Zainteresovani za self-improvement, dele na društvenim mrežama
3. **Wellness Entuzijasti**: Koriste uz meditaciju/vežbanje, vole gamifikaciju

## Core Requirements
- Emoji-based mood entry (8 moods: Srećan, Oduševljen, Miran, Neutralan, Umoran, Tužan, Anksiozan, Ljut)
- Calendar view with mood history
- Graph/chart statistics (line chart, pie chart, bar chart)
- AI personalized daily tips
- Gamification (6 badges, streak tracking)
- CSV data export
- Social sharing
- Google OAuth authentication
- Full Serbian language UI

## What's Been Implemented (Feb 2026)
- [x] Landing page with hero image and Google OAuth login
- [x] Google OAuth via Emergent Auth (session-based)
- [x] Dashboard with bento grid (today's mood, streak, stats, AI tips, recent moods)
- [x] Mood entry page with 8 emoji moods and optional notes
- [x] Calendar view with month navigation and mood indicators
- [x] Statistics page (line chart, pie chart, bar chart)
- [x] Profile page with badges and export
- [x] CSV data export
- [x] Social sharing (Web Share API + clipboard)
- [x] AI daily tips via GPT-5.2
- [x] Responsive design with mobile bottom nav
- [x] Soft Organic theme (Sage green, warm sand, bone white)
- [x] Merriweather + Figtree typography

## Prioritized Backlog
### P0 (Next)
- Push notifications / reminders for daily mood entry
- Premium subscription model (Stripe)

### P1
- Mood tagging (events, activities that caused mood)
- Weekly/monthly email reports
- Dark mode option

### P2
- Community features (anonymous mood sharing)
- Mood comparison with national averages
- Integration with health apps
- Cyrillic script option
