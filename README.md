# Umiri.me - Mood Tracker Aplikacija

Aplikacija za praćenje raspoloženja namenjena srpskom tržištu. Korisnici beleže dnevna raspoloženja pomoću emojija, prate trendove kroz kalendar i grafike, dobijaju AI savete i dele mood kartice na društvenim mrežama.

## Arhitektura

```
Frontend (React)  ←→  Backend (FastAPI)  ←→  MongoDB
                           ↕
                    Stripe (plaćanja)
                    OpenAI GPT-5.2 (AI saveti)
                    Emergent Auth (Google OAuth)
```

## Potrebne Varijable Okruženja

### Backend (`/backend/.env`)

| Varijabla | Opis | Gde se dobija | Primer |
|-----------|------|---------------|--------|
| `MONGO_URL` | MongoDB connection string | Lokalna instalacija ili MongoDB Atlas | `mongodb://localhost:27017` |
| `DB_NAME` | Naziv baze podataka | Proizvoljno | `umiri_me_production` |
| `CORS_ORIGINS` | Dozvoljeni origini za CORS | Tvoj frontend URL | `https://umiri.me` |
| `EMERGENT_LLM_KEY` | API ključ za AI savete (GPT-5.2) | [Emergent Platform](https://emergentagent.com) → Profile → Universal Key | `sk-emergent-xxxx` |
| `STRIPE_API_KEY` | Stripe API ključ za plaćanja | [Stripe Dashboard](https://dashboard.stripe.com/apikeys) → Secret key | `sk_live_xxxx` |

### Frontend (`/frontend/.env`)

| Varijabla | Opis | Primer |
|-----------|------|--------|
| `REACT_APP_BACKEND_URL` | URL tvog backend servera | `https://api.umiri.me` |

## Kako Pokrenuti

### 1. Preduslov

- Node.js 18+
- Python 3.11+
- MongoDB 6+
- Yarn package manager

### 2. Kloniraj Repo

```bash
git clone https://github.com/tvoj-username/umiri-me.git
cd umiri-me
```

### 3. Backend Setup

```bash
cd backend

# Kreiraj .env fajl
cat > .env << EOF
MONGO_URL="mongodb://localhost:27017"
DB_NAME="umiri_me_production"
CORS_ORIGINS="http://localhost:3000,https://umiri.me"
EMERGENT_LLM_KEY=tvoj-emergent-kljuc
STRIPE_API_KEY=tvoj-stripe-kljuc
ADMIN_EMAILS=tvoj-email@example.com
RESEND_API_KEY=tvoj-resend-kljuc
SENDER_EMAIL=noreply@umiri.me
EOF

# Instaliraj Python zavisnosti
pip install -r requirements.txt

# Za emergentintegrations biblioteku (ako nedostaje)
pip install emergentintegrations --extra-index-url https://d33sy5i8bnduwe.cloudfront.net/simple/

# Pokreni server
uvicorn server:app --host 0.0.0.0 --port 8001 --reload
```

### 4. Frontend Setup

```bash
cd frontend

# Kreiraj .env fajl
cat > .env << EOF
REACT_APP_BACKEND_URL=http://localhost:8001
EOF

# Instaliraj zavisnosti
yarn install

# Pokreni dev server
yarn start
```

### 5. MongoDB

Aplikacija automatski kreira potrebne kolekcije:
- `users` - Korisnici
- `user_sessions` - Sesije za autentifikaciju
- `moods` - Raspoloženja
- `subscriptions` - Pretplate (Premium + Trial)
- `payment_transactions` - Stripe transakcije
- `ai_tips_usage` - Praćenje korišćenja AI saveta

## Gde Dobiti Ključeve

### Emergent LLM Key (za AI savete)
1. Registruj se na [emergentagent.com](https://emergentagent.com)
2. Idi na **Profile → Universal Key**
3. Kopiraj ključ koji počinje sa `sk-emergent-`
4. Ako ti ponestane kredita: **Profile → Universal Key → Add Balance**

### Stripe API Key (za plaćanja)
1. Registruj se na [stripe.com](https://stripe.com)
2. Stripe je dostupan u Srbiji od 2025.
3. Idi na **Dashboard → Developers → API keys**
4. Za testiranje koristi `sk_test_...` ključ
5. Za produkciju koristi `sk_live_...` ključ

### Google OAuth (autentifikacija)
- Autentifikacija koristi Emergent Auth servis
- Nije potreban poseban Google OAuth ključ
- Radi automatski kroz `auth.emergentagent.com`

## Premium Model

### Besplatno (Free Tier)
- Praćenje raspoloženja (8 emoji tipova)
- Kalendar emocija
- Osnovna statistika
- 1 AI savet dnevno
- Osnovna kartica za deljenje ("Danas")

### 7-Dnevni Trial (automatski za nove korisnike)
- Sve Premium funkcije besplatno 7 dana
- Automatski se aktivira pri prvoj registraciji
- Posle 7 dana korisnik prelazi na besplatni plan

### Premium (500 RSD/mesec ili 4.200 RSD/godišnje)
- Neograničeni AI saveti
- Sve 4 kartice za Instagram Stories
- CSV izvoz podataka
- Napredna statistika i trendovi
- Premium značka na profilu

## Stripe Webhook

Za produkciju, konfigurši Stripe webhook:
1. Idi na Stripe Dashboard → Developers → Webhooks
2. Dodaj endpoint: `https://tvoj-domen.com/api/webhook/stripe`
3. Izaberi event: `checkout.session.completed`

## Struktura Projekta

```
/app
├── backend/
│   ├── server.py          # Glavni FastAPI server (svi API endpointi)
│   ├── .env               # Backend varijable okruženja
│   └── requirements.txt   # Python zavisnosti
├── frontend/
│   ├── src/
│   │   ├── App.js         # Router i autentifikacija
│   │   ├── lib/api.js     # API helper i mood tipovi
│   │   ├── pages/
│   │   │   ├── Landing.js       # Landing stranica
│   │   │   ├── AuthCallback.js  # Google OAuth callback
│   │   │   ├── AppLayout.js     # Sidebar navigacija
│   │   │   ├── Dashboard.js     # Glavna stranica
│   │   │   ├── MoodEntry.js     # Unos raspoloženja
│   │   │   ├── CalendarView.js  # Kalendar emocija
│   │   │   ├── Statistics.js    # Grafici i statistika
│   │   │   ├── ShareCard.js     # Kartice za Instagram
│   │   │   ├── PremiumPage.js   # Premium/pricing stranica
│   │   │   ├── PaymentSuccess.js# Potvrda plaćanja
│   │   │   └── Profile.js       # Korisnički profil
│   │   └── components/ui/       # Shadcn UI komponente
│   ├── .env               # Frontend varijable okruženja
│   └── package.json       # Node zavisnosti
└── README.md
```

## API Endpointi

### Autentifikacija
| Metod | Endpoint | Opis |
|-------|----------|------|
| POST | `/api/auth/session` | Razmena session_id za token |
| GET | `/api/auth/me` | Trenutni korisnik + premium status |
| POST | `/api/auth/logout` | Odjava |

### Raspoloženja
| Metod | Endpoint | Opis |
|-------|----------|------|
| POST | `/api/moods` | Zabelezi raspoloženje |
| GET | `/api/moods` | Lista raspoloženja |
| GET | `/api/moods/calendar/{year}/{month}` | Kalendar za mesec |
| GET | `/api/moods/stats` | Statistika |
| GET | `/api/moods/export` | CSV izvoz (Premium) |

### Premium & Plaćanja
| Metod | Endpoint | Opis |
|-------|----------|------|
| GET | `/api/premium/plans` | Dostupni planovi |
| GET | `/api/subscription/status` | Status pretplate |
| POST | `/api/subscription/checkout` | Kreiraj Stripe sesiju |
| GET | `/api/subscription/checkout/status/{id}` | Status plaćanja |
| POST | `/api/webhook/stripe` | Stripe webhook |

### Ostalo
| Metod | Endpoint | Opis |
|-------|----------|------|
| POST | `/api/ai/tips` | AI savet (1/dan free) |
| GET | `/api/gamification/stats` | Značke i niz |
| GET | `/api/mood-types` | Tipovi raspoloženja |

## Deployment na Produkciju

### Opcija 1: VPS (DigitalOcean, Hetzner)
```bash
# Instaliraj nginx, certbot, MongoDB
# Konfigurisi nginx kao reverse proxy
# Backend: uvicorn server:app --host 0.0.0.0 --port 8001
# Frontend: yarn build && serve -s build -p 3000
```

### Opcija 2: Docker
```bash
# docker-compose.yml sa backend, frontend, mongodb servisima
```

### Opcija 3: Emergent Platform
- Deploy direktno sa Emergent platforme
- Automatski CI/CD i SSL

## Licenca

MIT
