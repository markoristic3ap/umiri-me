from fastapi import FastAPI, APIRouter, Request, Response, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import httpx
import asyncio
import resend
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict
import uuid
from datetime import datetime, timezone, timedelta
from emergentintegrations.llm.chat import LlmChat, UserMessage
from emergentintegrations.payments.stripe.checkout import StripeCheckout, CheckoutSessionResponse, CheckoutStatusResponse, CheckoutSessionRequest

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY')
STRIPE_API_KEY = os.environ.get('STRIPE_API_KEY')
ADMIN_EMAILS = [e.strip() for e in os.environ.get('ADMIN_EMAILS', '').split(',') if e.strip()]
RESEND_API_KEY = os.environ.get('RESEND_API_KEY')
SENDER_EMAIL = os.environ.get('SENDER_EMAIL', 'noreply@umiri.me')

# Initialize Resend
if RESEND_API_KEY and RESEND_API_KEY != 're_your_api_key_here':
    resend.api_key = RESEND_API_KEY

app = FastAPI()
api_router = APIRouter(prefix="/api")

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')

# Premium plan config - amount in RSD
PREMIUM_PLANS = {
    "monthly": {"amount": 500.00, "currency": "rsd", "label": "Mesečni Premium", "period": 30},
    "yearly": {"amount": 4200.00, "currency": "rsd", "label": "Godišnji Premium (uštedi 30%)", "period": 365},
}

MOOD_TYPES = {
    "srecan": {"emoji": "😊", "label": "Srećan", "score": 5, "color": "#769F78"},
    "odusevljen": {"emoji": "🤩", "label": "Oduševljen", "score": 5, "color": "#E8C170"},
    "miran": {"emoji": "😌", "label": "Miran", "score": 4, "color": "#7CA5B8"},
    "neutralan": {"emoji": "😐", "label": "Neutralan", "score": 3, "color": "#8A9999"},
    "umoran": {"emoji": "🥱", "label": "Umoran", "score": 2, "color": "#B8A07C"},
    "tuzan": {"emoji": "😢", "label": "Tužan", "score": 1, "color": "#7CA5B8"},
    "anksiozan": {"emoji": "😰", "label": "Anksiozan", "score": 1, "color": "#D66A6A"},
    "ljut": {"emoji": "😡", "label": "Ljut", "score": 1, "color": "#D66A6A"},
}

BADGES = [
    {"id": "first_mood", "name": "Prvi Korak", "description": "Zabeležio/la prvi mood", "icon": "🌱", "requirement": 1},
    {"id": "week_streak", "name": "Nedeljna Navika", "description": "7 dana zaredom", "icon": "🔥", "requirement": 7},
    {"id": "month_streak", "name": "Mesečni Ratnik", "description": "30 dana zaredom", "icon": "⭐", "requirement": 30},
    {"id": "mood_explorer", "name": "Istraživač Emocija", "description": "Koristio/la svih 8 raspoloženja", "icon": "🎨", "requirement": 8},
    {"id": "note_writer", "name": "Dnevnički Pisac", "description": "Napisao/la 10 beleški", "icon": "📝", "requirement": 10},
    {"id": "century", "name": "Stotka", "description": "100 zabeleženih raspoloženja", "icon": "💯", "requirement": 100},
]

FREE_AI_TIPS_PER_DAY = 1

# Models
class MoodCreate(BaseModel):
    mood_type: str
    note: Optional[str] = None
    triggers: Optional[List[str]] = None
    gratitude: Optional[str] = None

TRIGGER_TYPES = {
    "posao": {"label": "Posao", "icon": "briefcase"},
    "san": {"label": "San", "icon": "moon"},
    "vezba": {"label": "Vežbanje", "icon": "dumbbell"},
    "drustvo": {"label": "Društvo", "icon": "users"},
    "ishrana": {"label": "Ishrana", "icon": "utensils"},
    "porodica": {"label": "Porodica", "icon": "home"},
    "zdravlje": {"label": "Zdravlje", "icon": "heart-pulse"},
    "vreme": {"label": "Vreme", "icon": "cloud"},
    "novac": {"label": "Novac", "icon": "wallet"},
    "ucenje": {"label": "Učenje", "icon": "book-open"},
    "odmor": {"label": "Odmor", "icon": "palmtree"},
    "kreativnost": {"label": "Kreativnost", "icon": "palette"},
}

class CheckoutRequest(BaseModel):
    plan_id: str
    origin_url: str

class AdminGrantPremium(BaseModel):
    user_id: str
    plan_id: str = "admin_grant"
    days: int = 30

# Auth helpers
async def get_current_user(request: Request) -> dict:
    session_token = request.cookies.get("session_token")
    if not session_token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            session_token = auth_header.split(" ")[1]
    if not session_token:
        raise HTTPException(status_code=401, detail="Niste prijavljeni")
    
    session = await db.user_sessions.find_one({"session_token": session_token}, {"_id": 0})
    if not session:
        raise HTTPException(status_code=401, detail="Nevažeća sesija")
    
    expires_at = session["expires_at"]
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=401, detail="Sesija je istekla")
    
    user = await db.users.find_one({"user_id": session["user_id"]}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="Korisnik nije pronađen")
    return user

TRIAL_DAYS = 7

async def is_premium(user_id: str) -> bool:
    sub = await db.subscriptions.find_one(
        {"user_id": user_id, "status": "active"},
        {"_id": 0}
    )
    if not sub:
        return False
    expires_at = sub.get("expires_at", "")
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    return expires_at > datetime.now(timezone.utc)

async def get_subscription_info(user_id: str) -> dict:
    sub = await db.subscriptions.find_one(
        {"user_id": user_id, "status": "active"},
        {"_id": 0}
    )
    if not sub:
        return {"is_premium": False, "is_trial": False, "days_left": 0, "plan_id": None}
    
    expires_at = sub.get("expires_at", "")
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    
    now = datetime.now(timezone.utc)
    is_active = expires_at > now
    days_left = max(0, (expires_at - now).days) if is_active else 0
    is_trial = sub.get("is_trial", False)
    
    return {
        "is_premium": is_active,
        "is_trial": is_trial and is_active,
        "days_left": days_left,
        "plan_id": sub.get("plan_id"),
        "expires_at": sub.get("expires_at")
    }

async def activate_trial(user_id: str):
    existing = await db.subscriptions.find_one({"user_id": user_id}, {"_id": 0})
    if existing:
        return
    
    now = datetime.now(timezone.utc)
    expires_at = now + timedelta(days=TRIAL_DAYS)
    await db.subscriptions.insert_one({
        "user_id": user_id,
        "plan_id": "trial",
        "is_trial": True,
        "status": "active",
        "started_at": now.isoformat(),
        "expires_at": expires_at.isoformat(),
        "updated_at": now.isoformat()
    })

# Auth endpoints
@api_router.post("/auth/session")
async def create_session(request: Request, response: Response):
    body = await request.json()
    session_id = body.get("session_id")
    if not session_id:
        raise HTTPException(status_code=400, detail="session_id je obavezan")
    
    async with httpx.AsyncClient() as client_http:
        resp = await client_http.get(
            "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
            headers={"X-Session-ID": session_id}
        )
        if resp.status_code != 200:
            raise HTTPException(status_code=401, detail="Neuspešna autentifikacija")
        user_data = resp.json()
    
    user_id = f"user_{uuid.uuid4().hex[:12]}"
    existing = await db.users.find_one({"email": user_data["email"]}, {"_id": 0})
    if existing:
        user_id = existing["user_id"]
        await db.users.update_one(
            {"email": user_data["email"]},
            {"$set": {"name": user_data["name"], "picture": user_data.get("picture", "")}}
        )
    else:
        await db.users.insert_one({
            "user_id": user_id,
            "email": user_data["email"],
            "name": user_data["name"],
            "picture": user_data.get("picture", ""),
            "created_at": datetime.now(timezone.utc).isoformat()
        })
        # Auto-activate 7-day trial for new users
        await activate_trial(user_id)
    
    session_token = f"session_{uuid.uuid4().hex}"
    await db.user_sessions.insert_one({
        "user_id": user_id,
        "session_token": session_token,
        "expires_at": (datetime.now(timezone.utc) + timedelta(days=7)).isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    response.set_cookie(
        key="session_token", value=session_token,
        httponly=True, secure=True, samesite="none", path="/",
        max_age=7 * 24 * 60 * 60
    )
    
    user = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    return user

@api_router.get("/auth/me")
async def get_me(request: Request):
    user = await get_current_user(request)
    sub_info = await get_subscription_info(user["user_id"])
    return {**user, **sub_info}

@api_router.post("/auth/logout")
async def logout(request: Request, response: Response):
    session_token = request.cookies.get("session_token")
    if session_token:
        await db.user_sessions.delete_many({"session_token": session_token})
    response.delete_cookie(key="session_token", path="/", secure=True, samesite="none")
    return {"message": "Uspešno ste se odjavili"}

# Mood endpoints
@api_router.post("/moods")
async def create_mood(mood_data: MoodCreate, request: Request):
    user = await get_current_user(request)
    if mood_data.mood_type not in MOOD_TYPES:
        raise HTTPException(status_code=400, detail="Nepoznat tip raspoloženja")
    
    mood_info = MOOD_TYPES[mood_data.mood_type]
    now = datetime.now(timezone.utc)
    today = now.strftime("%Y-%m-%d")
    
    existing = await db.moods.find_one({"user_id": user["user_id"], "date": today}, {"_id": 0})
    mood_entry = {
        "mood_id": f"mood_{uuid.uuid4().hex[:12]}",
        "user_id": user["user_id"],
        "mood_type": mood_data.mood_type,
        "emoji": mood_info["emoji"],
        "label": mood_info["label"],
        "score": mood_info["score"],
        "color": mood_info["color"],
        "note": mood_data.note,
        "triggers": mood_data.triggers or [],
        "gratitude": mood_data.gratitude,
        "created_at": now.isoformat(),
        "date": today
    }
    
    if existing:
        await db.moods.update_one({"user_id": user["user_id"], "date": today}, {"$set": mood_entry})
    else:
        await db.moods.insert_one(mood_entry)
    
    return {k: v for k, v in mood_entry.items() if k != "_id"}

@api_router.get("/moods")
async def get_moods(request: Request, limit: int = 30, offset: int = 0):
    user = await get_current_user(request)
    moods = await db.moods.find(
        {"user_id": user["user_id"]}, {"_id": 0}
    ).sort("date", -1).skip(offset).limit(limit).to_list(limit)
    return moods

@api_router.get("/moods/calendar/{year}/{month}")
async def get_calendar_moods(year: int, month: int, request: Request):
    user = await get_current_user(request)
    start = f"{year}-{month:02d}-01"
    end = f"{year + 1}-01-01" if month == 12 else f"{year}-{month + 1:02d}-01"
    moods = await db.moods.find(
        {"user_id": user["user_id"], "date": {"$gte": start, "$lt": end}}, {"_id": 0}
    ).to_list(31)
    return moods

@api_router.get("/moods/stats")
async def get_mood_stats(request: Request):
    user = await get_current_user(request)
    all_moods = await db.moods.find({"user_id": user["user_id"]}, {"_id": 0}).sort("date", -1).to_list(1000)
    
    total = len(all_moods)
    if total == 0:
        return {"total": 0, "streak": 0, "longest_streak": 0, "mood_distribution": {}, "avg_score": 0, "weekly_avg": [], "unique_moods": 0}
    
    mood_counts = {}
    for m in all_moods:
        mt = m["mood_type"]
        mood_counts[mt] = mood_counts.get(mt, 0) + 1
    
    avg_score = sum(m["score"] for m in all_moods) / total
    dates = sorted(set(m["date"] for m in all_moods), reverse=True)
    
    streak = 0
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    check_date = today
    for i in range(len(dates) + 1):
        if check_date in dates:
            streak += 1
            d = datetime.strptime(check_date, "%Y-%m-%d")
            check_date = (d - timedelta(days=1)).strftime("%Y-%m-%d")
        else:
            break
    
    longest = 0
    current = 0
    sorted_dates = sorted(dates)
    for i, d in enumerate(sorted_dates):
        if i == 0:
            current = 1
        else:
            prev = datetime.strptime(sorted_dates[i-1], "%Y-%m-%d")
            curr = datetime.strptime(d, "%Y-%m-%d")
            current = current + 1 if (curr - prev).days == 1 else 1
        longest = max(longest, current)
    
    last_7 = all_moods[:7]
    weekly_avg = [{"date": m["date"], "score": m["score"], "emoji": m["emoji"], "label": m["label"]} for m in reversed(last_7)]
    
    # Trigger analysis
    trigger_mood_map = {}
    for m in all_moods:
        for t in m.get("triggers", []):
            if t not in trigger_mood_map:
                trigger_mood_map[t] = {"scores": [], "count": 0}
            trigger_mood_map[t]["scores"].append(m["score"])
            trigger_mood_map[t]["count"] += 1
    
    trigger_insights = []
    for t, data in trigger_mood_map.items():
        avg = round(sum(data["scores"]) / len(data["scores"]), 1)
        label = TRIGGER_TYPES.get(t, {}).get("label", t)
        trigger_insights.append({"trigger": t, "label": label, "avg_score": avg, "count": data["count"]})
    trigger_insights.sort(key=lambda x: x["avg_score"], reverse=True)
    
    return {
        "total": total, "streak": streak, "longest_streak": longest,
        "mood_distribution": mood_counts, "avg_score": round(avg_score, 1),
        "weekly_avg": weekly_avg, "unique_moods": len(set(m["mood_type"] for m in all_moods)),
        "trigger_insights": trigger_insights
    }

@api_router.get("/moods/export")
async def export_moods(request: Request):
    user = await get_current_user(request)
    premium = await is_premium(user["user_id"])
    if not premium:
        raise HTTPException(status_code=403, detail="CSV izvoz je dostupan samo za Premium korisnike")
    
    moods = await db.moods.find({"user_id": user["user_id"]}, {"_id": 0}).sort("date", 1).to_list(10000)
    
    import io, csv
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Datum", "Raspoloženje", "Emoji", "Ocena", "Beleška"])
    for m in moods:
        writer.writerow([m["date"], m["label"], m["emoji"], m["score"], m.get("note", "")])
    
    return Response(
        content=output.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=umiri_me_raspolozenja.csv"}
    )

# Weekly AI Report
@api_router.post("/ai/weekly-report")
async def get_weekly_report(request: Request):
    user = await get_current_user(request)
    premium = await is_premium(user["user_id"])
    if not premium:
        raise HTTPException(status_code=403, detail="Nedeljni izveštaj je dostupan samo za Premium korisnike")
    
    week_ago = (datetime.now(timezone.utc) - timedelta(days=7)).strftime("%Y-%m-%d")
    moods = await db.moods.find(
        {"user_id": user["user_id"], "date": {"$gte": week_ago}}, {"_id": 0}
    ).sort("date", 1).to_list(7)
    
    if not moods:
        return {"report": "Nemaš dovoljno podataka za nedeljni izveštaj. Nastavi da beležiš raspoloženja!", "generated_at": datetime.now(timezone.utc).isoformat()}
    
    mood_details = []
    all_triggers = {}
    gratitudes = []
    for m in moods:
        mood_details.append(f"{m['date']}: {m['emoji']} {m['label']} (ocena {m['score']})")
        for t in m.get("triggers", []):
            label = TRIGGER_TYPES.get(t, {}).get("label", t)
            if label not in all_triggers:
                all_triggers[label] = {"scores": [], "count": 0}
            all_triggers[label]["scores"].append(m["score"])
            all_triggers[label]["count"] += 1
        if m.get("gratitude"):
            gratitudes.append(m["gratitude"])
    
    avg_score = round(sum(m["score"] for m in moods) / len(moods), 1)
    trigger_summary = ""
    for t, data in all_triggers.items():
        avg = round(sum(data["scores"]) / len(data["scores"]), 1)
        trigger_summary += f"- {t}: prosek {avg}/5 ({data['count']}x)\n"
    
    prompt = f"""Napravi nedeljni izveštaj za korisnika.

Raspoloženja ove nedelje:
{chr(10).join(mood_details)}

Prosečna ocena: {avg_score}/5
Broj unosa: {len(moods)}

Faktori koji su uticali:
{trigger_summary if trigger_summary else "Nema podataka o faktorima."}

{"Zahvalnosti: " + "; ".join(gratitudes) if gratitudes else ""}

Napravi kratak, topao izveštaj sa:
1. Pregled nedelje (2 rečenice)
2. Šta pozitivno utiče na raspoloženje (1-2 rečenice)
3. Preporuka za sledeću nedelju (1-2 rečenice)

Budi konkretan, koristi podatke. Piši na srpskom, latiničnim pismom."""

    try:
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"weekly_{user['user_id']}_{datetime.now().strftime('%Y%m%d')}",
            system_message="Ti si AI wellness coach u aplikaciji Umiri.me. Pišeš na srpskom jeziku, latiničnim pismom. Praviš nedeljne izveštaje o raspoloženju. Tvoj ton je topao, konkretan i motivišući."
        )
        chat.with_model("openai", "gpt-5.2")
        user_msg = UserMessage(text=prompt)
        report_text = await chat.send_message(user_msg)
        return {"report": report_text, "avg_score": avg_score, "total_entries": len(moods), "generated_at": datetime.now(timezone.utc).isoformat()}
    except Exception as e:
        logger.error(f"Weekly report error: {e}")
        return {"report": f"Ove nedelje si zabeležio/la {len(moods)} raspoloženja sa prosečnom ocenom {avg_score}/5. Nastavi tako!", "avg_score": avg_score, "total_entries": len(moods), "generated_at": datetime.now(timezone.utc).isoformat()}

# Gamification
@api_router.get("/gamification/stats")
async def get_gamification(request: Request):
    user = await get_current_user(request)
    all_moods = await db.moods.find({"user_id": user["user_id"]}, {"_id": 0}).to_list(10000)
    
    total = len(all_moods)
    unique_moods = len(set(m["mood_type"] for m in all_moods))
    notes_count = sum(1 for m in all_moods if m.get("note"))
    
    dates = sorted(set(m["date"] for m in all_moods), reverse=True)
    streak = 0
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    check_date = today
    for i in range(len(dates) + 1):
        if check_date in dates:
            streak += 1
            d = datetime.strptime(check_date, "%Y-%m-%d")
            check_date = (d - timedelta(days=1)).strftime("%Y-%m-%d")
        else:
            break
    
    earned_badges = []
    for badge in BADGES:
        earned = False
        if badge["id"] == "first_mood" and total >= badge["requirement"]:
            earned = True
        elif badge["id"] == "week_streak" and streak >= badge["requirement"]:
            earned = True
        elif badge["id"] == "month_streak" and streak >= badge["requirement"]:
            earned = True
        elif badge["id"] == "mood_explorer" and unique_moods >= badge["requirement"]:
            earned = True
        elif badge["id"] == "note_writer" and notes_count >= badge["requirement"]:
            earned = True
        elif badge["id"] == "century" and total >= badge["requirement"]:
            earned = True
        earned_badges.append({**badge, "earned": earned})
    
    return {"streak": streak, "total_entries": total, "unique_moods": unique_moods, "notes_count": notes_count, "badges": earned_badges}

# AI Tips with free tier limit
@api_router.post("/ai/tips")
async def get_ai_tip(request: Request):
    user = await get_current_user(request)
    premium = await is_premium(user["user_id"])
    
    if not premium:
        today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        tips_today = await db.ai_tips_usage.count_documents({"user_id": user["user_id"], "date": today})
        if tips_today >= FREE_AI_TIPS_PER_DAY:
            raise HTTPException(status_code=403, detail="Dostigao/la si dnevni limit besplatnih AI saveta. Nadogradi na Premium za neograničene savete!")
    
    recent_moods = await db.moods.find({"user_id": user["user_id"]}, {"_id": 0}).sort("date", -1).limit(7).to_list(7)
    
    mood_summary = ""
    if recent_moods:
        mood_labels = [f"{m['emoji']} {m['label']}" for m in recent_moods]
        mood_summary = f"Poslednja raspoloženja korisnika: {', '.join(mood_labels)}"
        if recent_moods[0].get("note"):
            mood_summary += f"\nPoslednja beleška: {recent_moods[0]['note']}"
        if recent_moods[0].get("triggers"):
            trigger_labels = [TRIGGER_TYPES.get(t, {}).get("label", t) for t in recent_moods[0]["triggers"]]
            mood_summary += f"\nFaktori koji utiču: {', '.join(trigger_labels)}"
    else:
        mood_summary = "Korisnik tek počinje da koristi aplikaciju."
    
    try:
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"tips_{user['user_id']}_{datetime.now().strftime('%Y%m%d%H%M%S')}",
            system_message="""Ti si nežan i mudar savetnik za mentalno zdravlje u aplikaciji Umiri.me.
Pišeš na srpskom jeziku, latiničnim pismom.
Daješ kratke, tople i praktične savete bazirane na raspoloženju korisnika.
Tvoj ton je prijateljski, umirujući i podržavajući.
Nikad ne dijagnostikuješ i ne zamenjuješ profesionalnu pomoć.
Odgovaraš u 2-3 kratke rečenice. Možeš dodati i jedan emoji."""
        )
        chat.with_model("openai", "gpt-5.2")
        user_msg = UserMessage(text=f"{mood_summary}\n\nDaj mi personalizovani savet za danas baziran na mojim raspoloženjima.")
        tip_text = await chat.send_message(user_msg)
        
        # Track usage for free tier
        if not premium:
            await db.ai_tips_usage.insert_one({
                "user_id": user["user_id"],
                "date": datetime.now(timezone.utc).strftime("%Y-%m-%d"),
                "created_at": datetime.now(timezone.utc).isoformat()
            })
        
        return {"tip": tip_text, "generated_at": datetime.now(timezone.utc).isoformat()}
    except Exception as e:
        logger.error(f"AI tip error: {e}")
        return {"tip": "Danas odvoji vreme za sebe. Čak i pet minuta tišine može napraviti veliku razliku. 🌿", "generated_at": datetime.now(timezone.utc).isoformat()}

# Stripe Payment Endpoints
@api_router.get("/subscription/status")
async def get_subscription_status(request: Request):
    user = await get_current_user(request)
    sub_info = await get_subscription_info(user["user_id"])
    
    return {
        **sub_info,
        "plans": PREMIUM_PLANS
    }

@api_router.post("/subscription/checkout")
async def create_checkout(checkout_req: CheckoutRequest, request: Request):
    user = await get_current_user(request)
    
    if checkout_req.plan_id not in PREMIUM_PLANS:
        raise HTTPException(status_code=400, detail="Nepoznat plan")
    
    plan = PREMIUM_PLANS[checkout_req.plan_id]
    origin_url = checkout_req.origin_url
    
    success_url = f"{origin_url}/premium/success?session_id={{CHECKOUT_SESSION_ID}}"
    cancel_url = f"{origin_url}/premium"
    
    host_url = str(request.base_url).rstrip('/')
    webhook_url = f"{host_url}/api/webhook/stripe"
    
    stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)
    
    checkout_request = CheckoutSessionRequest(
        amount=plan["amount"],
        currency=plan["currency"],
        success_url=success_url,
        cancel_url=cancel_url,
        metadata={
            "user_id": user["user_id"],
            "plan_id": checkout_req.plan_id,
            "user_email": user["email"]
        }
    )
    
    session = await stripe_checkout.create_checkout_session(checkout_request)
    
    # Create payment transaction record
    await db.payment_transactions.insert_one({
        "transaction_id": f"txn_{uuid.uuid4().hex[:12]}",
        "session_id": session.session_id,
        "user_id": user["user_id"],
        "plan_id": checkout_req.plan_id,
        "amount": plan["amount"],
        "currency": plan["currency"],
        "payment_status": "initiated",
        "status": "pending",
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    return {"url": session.url, "session_id": session.session_id}

@api_router.get("/subscription/checkout/status/{session_id}")
async def check_checkout_status(session_id: str, request: Request):
    user = await get_current_user(request)
    
    txn = await db.payment_transactions.find_one({"session_id": session_id}, {"_id": 0})
    if not txn:
        raise HTTPException(status_code=404, detail="Transakcija nije pronađena")
    
    if txn.get("payment_status") == "paid":
        return {"status": "complete", "payment_status": "paid", "message": "Plaćanje uspešno!"}
    
    host_url = str(request.base_url).rstrip('/')
    webhook_url = f"{host_url}/api/webhook/stripe"
    stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)
    
    try:
        checkout_status = await stripe_checkout.get_checkout_status(session_id)
        
        await db.payment_transactions.update_one(
            {"session_id": session_id},
            {"$set": {
                "status": checkout_status.status,
                "payment_status": checkout_status.payment_status,
                "updated_at": datetime.now(timezone.utc).isoformat()
            }}
        )
        
        if checkout_status.payment_status == "paid":
            already_activated = await db.subscriptions.find_one({"session_id": session_id}, {"_id": 0})
            if not already_activated:
                plan = PREMIUM_PLANS.get(txn.get("plan_id", "monthly"), PREMIUM_PLANS["monthly"])
                expires_at = datetime.now(timezone.utc) + timedelta(days=plan["period"])
                
                await db.subscriptions.update_one(
                    {"user_id": txn["user_id"]},
                    {"$set": {
                        "user_id": txn["user_id"],
                        "plan_id": txn.get("plan_id", "monthly"),
                        "session_id": session_id,
                        "status": "active",
                        "started_at": datetime.now(timezone.utc).isoformat(),
                        "expires_at": expires_at.isoformat(),
                        "updated_at": datetime.now(timezone.utc).isoformat()
                    }},
                    upsert=True
                )
        
        return {
            "status": checkout_status.status,
            "payment_status": checkout_status.payment_status,
            "message": "Plaćanje uspešno!" if checkout_status.payment_status == "paid" else "Čeka se plaćanje..."
        }
    except Exception as e:
        logger.error(f"Checkout status error: {e}")
        raise HTTPException(status_code=500, detail="Greška pri proveri statusa")

@api_router.post("/webhook/stripe")
async def stripe_webhook(request: Request):
    body = await request.body()
    signature = request.headers.get("Stripe-Signature", "")
    
    host_url = str(request.base_url).rstrip('/')
    webhook_url = f"{host_url}/api/webhook/stripe"
    stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)
    
    try:
        webhook_response = await stripe_checkout.handle_webhook(body, signature)
        
        if webhook_response.payment_status == "paid":
            session_id = webhook_response.session_id
            txn = await db.payment_transactions.find_one({"session_id": session_id}, {"_id": 0})
            if txn:
                await db.payment_transactions.update_one(
                    {"session_id": session_id},
                    {"$set": {"payment_status": "paid", "status": "complete", "updated_at": datetime.now(timezone.utc).isoformat()}}
                )
                
                already_activated = await db.subscriptions.find_one({"session_id": session_id}, {"_id": 0})
                if not already_activated:
                    plan = PREMIUM_PLANS.get(txn.get("plan_id", "monthly"), PREMIUM_PLANS["monthly"])
                    expires_at = datetime.now(timezone.utc) + timedelta(days=plan["period"])
                    await db.subscriptions.update_one(
                        {"user_id": txn["user_id"]},
                        {"$set": {
                            "user_id": txn["user_id"],
                            "plan_id": txn.get("plan_id", "monthly"),
                            "session_id": session_id,
                            "status": "active",
                            "started_at": datetime.now(timezone.utc).isoformat(),
                            "expires_at": expires_at.isoformat(),
                            "updated_at": datetime.now(timezone.utc).isoformat()
                        }},
                        upsert=True
                    )
        
        return {"status": "ok"}
    except Exception as e:
        logger.error(f"Webhook error: {e}")
        return {"status": "error"}

@api_router.get("/mood-types")
async def get_mood_types():
    return MOOD_TYPES

@api_router.get("/trigger-types")
async def get_trigger_types():
    return TRIGGER_TYPES

@api_router.get("/premium/plans")
async def get_premium_plans():
    return PREMIUM_PLANS

# Admin endpoints
async def require_admin(request: Request) -> dict:
    user = await get_current_user(request)
    if user.get("email") not in ADMIN_EMAILS:
        raise HTTPException(status_code=403, detail="Nemate admin pristup")
    return user

@api_router.get("/admin/users")
async def admin_list_users(request: Request, limit: int = 50, offset: int = 0, search: str = ""):
    await require_admin(request)
    query = {}
    if search:
        query = {"$or": [
            {"name": {"$regex": search, "$options": "i"}},
            {"email": {"$regex": search, "$options": "i"}}
        ]}
    users = await db.users.find(query, {"_id": 0}).skip(offset).limit(limit).to_list(limit)
    total = await db.users.count_documents(query)
    
    enriched = []
    for u in users:
        sub_info = await get_subscription_info(u["user_id"])
        mood_count = await db.moods.count_documents({"user_id": u["user_id"]})
        last_mood = await db.moods.find_one({"user_id": u["user_id"]}, {"_id": 0}, sort=[("date", -1)])
        enriched.append({
            **u,
            **sub_info,
            "mood_count": mood_count,
            "last_active": last_mood["date"] if last_mood else None
        })
    
    return {"users": enriched, "total": total}

@api_router.get("/admin/stats")
async def admin_dashboard_stats(request: Request):
    await require_admin(request)
    total_users = await db.users.count_documents({})
    total_moods = await db.moods.count_documents({})
    active_subs = await db.subscriptions.count_documents({"status": "active"})
    trial_subs = await db.subscriptions.count_documents({"status": "active", "is_trial": True})
    paid_subs = active_subs - trial_subs
    total_transactions = await db.payment_transactions.count_documents({"payment_status": "paid"})
    
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    today_moods = await db.moods.count_documents({"date": today})
    
    week_ago = (datetime.now(timezone.utc) - timedelta(days=7)).strftime("%Y-%m-%d")
    weekly_active = len(await db.moods.distinct("user_id", {"date": {"$gte": week_ago}}))
    
    return {
        "total_users": total_users,
        "total_moods": total_moods,
        "active_subscriptions": active_subs,
        "trial_subscriptions": trial_subs,
        "paid_subscriptions": paid_subs,
        "total_transactions": total_transactions,
        "today_moods": today_moods,
        "weekly_active_users": weekly_active
    }

@api_router.post("/admin/grant-premium")
async def admin_grant_premium(data: AdminGrantPremium, request: Request):
    await require_admin(request)
    
    user = await db.users.find_one({"user_id": data.user_id}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="Korisnik nije pronađen")
    
    now = datetime.now(timezone.utc)
    expires_at = now + timedelta(days=data.days)
    
    await db.subscriptions.update_one(
        {"user_id": data.user_id},
        {"$set": {
            "user_id": data.user_id,
            "plan_id": data.plan_id,
            "is_trial": False,
            "status": "active",
            "started_at": now.isoformat(),
            "expires_at": expires_at.isoformat(),
            "updated_at": now.isoformat(),
            "granted_by": "admin"
        }},
        upsert=True
    )
    
    return {"message": f"Premium dodeljen korisniku {user['name']} na {data.days} dana", "expires_at": expires_at.isoformat()}

@api_router.post("/admin/revoke-premium")
async def admin_revoke_premium(request: Request):
    await require_admin(request)
    body = await request.json()
    user_id = body.get("user_id")
    if not user_id:
        raise HTTPException(status_code=400, detail="user_id je obavezan")
    
    result = await db.subscriptions.update_one(
        {"user_id": user_id},
        {"$set": {"status": "revoked", "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    return {"message": "Premium ukinut" if result.modified_count else "Korisnik nema aktivnu pretplatu"}

@api_router.get("/admin/check")
async def admin_check(request: Request):
    user = await get_current_user(request)
    is_admin = user.get("email") in ADMIN_EMAILS
    return {"is_admin": is_admin}

@api_router.get("/")
async def root():
    return {"message": "Umiri.me API"}

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
