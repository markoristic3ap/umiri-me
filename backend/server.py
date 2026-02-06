from fastapi import FastAPI, APIRouter, Request, Response, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import httpx
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
from emergentintegrations.llm.chat import LlmChat, UserMessage

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY')

app = FastAPI()
api_router = APIRouter(prefix="/api")

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')

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

# Models
class MoodCreate(BaseModel):
    mood_type: str
    note: Optional[str] = None

class MoodEntry(BaseModel):
    model_config = ConfigDict(extra="ignore")
    mood_id: str
    user_id: str
    mood_type: str
    emoji: str
    label: str
    score: int
    color: str
    note: Optional[str] = None
    created_at: str
    date: str

class UserProfile(BaseModel):
    model_config = ConfigDict(extra="ignore")
    user_id: str
    email: str
    name: str
    picture: Optional[str] = None
    created_at: Optional[str] = None

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
    
    session_token = f"session_{uuid.uuid4().hex}"
    await db.user_sessions.insert_one({
        "user_id": user_id,
        "session_token": session_token,
        "expires_at": (datetime.now(timezone.utc) + timedelta(days=7)).isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    response.set_cookie(
        key="session_token",
        value=session_token,
        httponly=True,
        secure=True,
        samesite="none",
        path="/",
        max_age=7 * 24 * 60 * 60
    )
    
    user = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    return user

@api_router.get("/auth/me")
async def get_me(request: Request):
    user = await get_current_user(request)
    return user

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
    
    existing = await db.moods.find_one(
        {"user_id": user["user_id"], "date": today}, {"_id": 0}
    )
    
    mood_entry = {
        "mood_id": f"mood_{uuid.uuid4().hex[:12]}",
        "user_id": user["user_id"],
        "mood_type": mood_data.mood_type,
        "emoji": mood_info["emoji"],
        "label": mood_info["label"],
        "score": mood_info["score"],
        "color": mood_info["color"],
        "note": mood_data.note,
        "created_at": now.isoformat(),
        "date": today
    }
    
    if existing:
        await db.moods.update_one(
            {"user_id": user["user_id"], "date": today},
            {"$set": mood_entry}
        )
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
    if month == 12:
        end = f"{year + 1}-01-01"
    else:
        end = f"{year}-{month + 1:02d}-01"
    
    moods = await db.moods.find(
        {"user_id": user["user_id"], "date": {"$gte": start, "$lt": end}},
        {"_id": 0}
    ).to_list(31)
    return moods

@api_router.get("/moods/stats")
async def get_mood_stats(request: Request):
    user = await get_current_user(request)
    all_moods = await db.moods.find(
        {"user_id": user["user_id"]}, {"_id": 0}
    ).sort("date", -1).to_list(1000)
    
    total = len(all_moods)
    if total == 0:
        return {
            "total": 0, "streak": 0, "longest_streak": 0,
            "mood_distribution": {}, "avg_score": 0,
            "weekly_avg": [], "unique_moods": 0
        }
    
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
            if (curr - prev).days == 1:
                current += 1
            else:
                current = 1
        longest = max(longest, current)
    
    last_7 = all_moods[:7]
    weekly_avg = []
    for m in reversed(last_7):
        weekly_avg.append({"date": m["date"], "score": m["score"], "emoji": m["emoji"], "label": m["label"]})
    
    return {
        "total": total,
        "streak": streak,
        "longest_streak": longest,
        "mood_distribution": mood_counts,
        "avg_score": round(avg_score, 1),
        "weekly_avg": weekly_avg,
        "unique_moods": len(set(m["mood_type"] for m in all_moods))
    }

@api_router.get("/moods/export")
async def export_moods(request: Request):
    user = await get_current_user(request)
    moods = await db.moods.find(
        {"user_id": user["user_id"]}, {"_id": 0}
    ).sort("date", 1).to_list(10000)
    
    import io
    import csv
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Datum", "Raspoloženje", "Emoji", "Ocena", "Beleška"])
    for m in moods:
        writer.writerow([m["date"], m["label"], m["emoji"], m["score"], m.get("note", "")])
    
    csv_content = output.getvalue()
    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=umiri_me_raspolozenja.csv"}
    )

# Gamification
@api_router.get("/gamification/stats")
async def get_gamification(request: Request):
    user = await get_current_user(request)
    all_moods = await db.moods.find(
        {"user_id": user["user_id"]}, {"_id": 0}
    ).to_list(10000)
    
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
    
    return {
        "streak": streak,
        "total_entries": total,
        "unique_moods": unique_moods,
        "notes_count": notes_count,
        "badges": earned_badges
    }

# AI Tips
@api_router.post("/ai/tips")
async def get_ai_tip(request: Request):
    user = await get_current_user(request)
    
    recent_moods = await db.moods.find(
        {"user_id": user["user_id"]}, {"_id": 0}
    ).sort("date", -1).limit(7).to_list(7)
    
    mood_summary = ""
    if recent_moods:
        mood_labels = [f"{m['emoji']} {m['label']}" for m in recent_moods]
        mood_summary = f"Poslednja raspoloženja korisnika: {', '.join(mood_labels)}"
        if recent_moods[0].get("note"):
            mood_summary += f"\nPoslednja beleška: {recent_moods[0]['note']}"
    else:
        mood_summary = "Korisnik tek počinje da koristi aplikaciju."
    
    try:
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"tips_{user['user_id']}_{datetime.now().strftime('%Y%m%d')}",
            system_message="""Ti si nežan i mudar savetnik za mentalno zdravlje u aplikaciji Umiri.me.
Pišeš na srpskom jeziku, latiničnim pismom.
Daješ kratke, tople i praktične savete baziranog na raspoloženju korisnika.
Tvoj ton je prijateljski, umirujući i podržavajući.
Nikad ne dijagnostikuješ i ne zamenjuješ profesionalnu pomoć.
Odgovaraš u 2-3 kratke rečenice. Možeš dodati i jedan emoji."""
        )
        chat.with_model("openai", "gpt-5.2")
        
        user_msg = UserMessage(text=f"{mood_summary}\n\nDaj mi personalizovani savet za danas baziran na mojim raspoloženjima.")
        tip_text = await chat.send_message(user_msg)
        
        return {"tip": tip_text, "generated_at": datetime.now(timezone.utc).isoformat()}
    except Exception as e:
        logger.error(f"AI tip error: {e}")
        return {"tip": "Danas odvoji vreme za sebe. Čak i pet minuta tišine može napraviti veliku razliku. 🌿", "generated_at": datetime.now(timezone.utc).isoformat()}

# Mood types reference
@api_router.get("/mood-types")
async def get_mood_types():
    return MOOD_TYPES

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
