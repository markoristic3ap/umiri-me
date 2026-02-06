import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Smile, Flame, TrendingUp, Sparkles, ChevronRight, Loader2, Image, Crown, Clock } from "lucide-react";
import AppLayout from "./AppLayout";
import MoodIcon from "@/components/MoodIcon";
import { API, fetchWithAuth, MOOD_TYPES } from "@/lib/api";

export default function Dashboard({ user }) {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [recentMoods, setRecentMoods] = useState([]);
  const [aiTip, setAiTip] = useState(null);
  const [loadingTip, setLoadingTip] = useState(false);
  const [todayMood, setTodayMood] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [statsRes, moodsRes] = await Promise.all([
        fetchWithAuth(`${API}/moods/stats`),
        fetchWithAuth(`${API}/moods?limit=7`),
      ]);
      if (statsRes.ok) setStats(await statsRes.json());
      if (moodsRes.ok) {
        const moods = await moodsRes.json();
        setRecentMoods(moods);
        const today = new Date().toISOString().split('T')[0];
        const todayEntry = moods.find(m => m.date === today);
        if (todayEntry) setTodayMood(todayEntry);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadAiTip = async () => {
    setLoadingTip(true);
    try {
      const res = await fetchWithAuth(`${API}/ai/tips`, { method: 'POST' });
      if (res.status === 403) {
        const err = await res.json();
        setAiTip({ tip: null, limit_reached: true, message: err.detail });
      } else if (res.ok) {
        const data = await res.json();
        setAiTip({ tip: data.tip, limit_reached: false });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingTip(false);
    }
  };

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Dobro jutro";
    if (hour < 18) return "Dobar dan";
    return "Dobro veče";
  };

  return (
    <AppLayout user={user}>
      <div data-testid="dashboard-page" className="space-y-8">
        {/* Trial banner */}
        {user?.is_trial && user?.days_left > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-[#FDF8F4] to-[#F2F4F0] rounded-2xl p-4 flex items-center justify-between border border-[#E09F7D]/20"
            data-testid="trial-banner"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-[#E09F7D]/20 rounded-full flex items-center justify-center">
                <Clock className="w-4 h-4 text-[#E09F7D]" strokeWidth={1.5} />
              </div>
              <div>
                <p className="text-sm font-medium text-[#2D3A3A]">
                  Premium Trial - još <span className="text-[#E09F7D] font-bold">{user.days_left}</span> {user.days_left === 1 ? 'dan' : 'dana'}
                </p>
                <p className="text-xs text-[#8A9999]">Uživaj u svim Premium funkcijama besplatno</p>
              </div>
            </div>
            <button
              data-testid="upgrade-from-trial-banner"
              onClick={() => navigate('/premium')}
              className="text-sm font-medium text-[#4A6C6F] hover:text-[#365052] transition-colors px-4 py-2 rounded-full bg-white border border-[#EBEBE8]"
            >
              Nadogradi
            </button>
          </motion.div>
        )}

        {/* Greeting */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-heading text-3xl md:text-4xl font-light text-[#2D3A3A]">
            {greeting()}, <span className="font-bold">{user?.name?.split(' ')[0]}</span>
          </h1>
          <p className="text-[#5C6B6B] mt-2">Kako se danas osećaš?</p>
        </motion.div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Today's mood card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="md:col-span-5 card-soft p-8 cursor-pointer hover:-translate-y-1"
            data-testid="today-mood-card"
            onClick={() => navigate('/mood')}
          >
            {todayMood ? (
              <div className="text-center">
                <div className="text-6xl mb-3">{todayMood.emoji}</div>
                <h3 className="font-heading text-lg text-[#2D3A3A]">{todayMood.label}</h3>
                <p className="text-sm text-[#8A9999] mt-1">Današnje raspoloženje</p>
                {todayMood.note && (
                  <p className="text-sm text-[#5C6B6B] mt-3 italic">"{todayMood.note}"</p>
                )}
              </div>
            ) : (
              <div className="text-center">
                <div className="text-6xl mb-3 opacity-30">😊</div>
                <h3 className="font-heading text-lg text-[#2D3A3A]">Zabeleži raspoloženje</h3>
                <p className="text-sm text-[#8A9999] mt-1">Kako se danas osećaš?</p>
                <button
                  data-testid="add-mood-from-dashboard"
                  className="mt-4 btn-primary-soft text-sm px-6 py-2"
                  onClick={() => navigate('/mood')}
                >
                  Dodaj
                </button>
              </div>
            )}
          </motion.div>

          {/* Stats cards */}
          <div className="md:col-span-7 grid grid-cols-2 gap-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className="card-soft p-6"
              data-testid="streak-card"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-[#FDF8F4] rounded-2xl flex items-center justify-center">
                  <Flame className="w-5 h-5 text-[#E09F7D]" strokeWidth={1.5} />
                </div>
              </div>
              <p className="text-3xl font-heading font-bold text-[#2D3A3A]">{stats?.streak || 0}</p>
              <p className="text-sm text-[#8A9999]">Dana zaredom</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
              className="card-soft p-6"
              data-testid="total-card"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-[#D6E0D6] rounded-2xl flex items-center justify-center">
                  <Smile className="w-5 h-5 text-[#4A6C6F]" strokeWidth={1.5} />
                </div>
              </div>
              <p className="text-3xl font-heading font-bold text-[#2D3A3A]">{stats?.total || 0}</p>
              <p className="text-sm text-[#8A9999]">Ukupno unosa</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
              className="card-soft p-6"
              data-testid="avg-score-card"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-[#F2F4F0] rounded-2xl flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-[#769F78]" strokeWidth={1.5} />
                </div>
              </div>
              <p className="text-3xl font-heading font-bold text-[#2D3A3A]">{stats?.avg_score || 0}</p>
              <p className="text-sm text-[#8A9999]">Prosek raspoloženja</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
              className="card-soft p-6 cursor-pointer hover:-translate-y-1"
              data-testid="statistics-shortcut"
              onClick={() => navigate('/statistics')}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-[#2D3A3A]">Statistika</p>
                  <p className="text-xs text-[#8A9999] mt-1">Pogledaj detalje</p>
                </div>
                <ChevronRight className="w-5 h-5 text-[#8A9999]" strokeWidth={1.5} />
              </div>
            </motion.div>
          </div>
        </div>

        {/* AI Tip */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="card-soft p-8 bg-gradient-to-br from-white to-[#F2F4F0]"
          data-testid="ai-tip-card"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-[#D6E0D6] rounded-2xl flex items-center justify-center shrink-0">
              <Sparkles className="w-6 h-6 text-[#4A6C6F]" strokeWidth={1.5} />
            </div>
            <div className="flex-1">
              <h3 className="font-heading text-lg font-medium text-[#2D3A3A] mb-2">AI Savet za Danas</h3>
              {aiTip ? (
                aiTip.limit_reached ? (
                  <div>
                    <p className="text-sm text-[#8A9999] mb-3">{aiTip.message}</p>
                    <button
                      data-testid="upgrade-from-ai-tip"
                      onClick={() => navigate('/premium')}
                      className="btn-primary-soft text-sm px-6 py-2 flex items-center gap-2"
                    >
                      <Crown className="w-4 h-4" /> Nadogradi na Premium
                    </button>
                  </div>
                ) : (
                  <p className="text-[#5C6B6B] leading-relaxed">{aiTip.tip}</p>
                )
              ) : (
                <div>
                  <p className="text-sm text-[#8A9999] mb-3">Dobij personalizovani savet baziran na tvojim raspoloženjima</p>
                  <button
                    data-testid="get-ai-tip-btn"
                    onClick={loadAiTip}
                    disabled={loadingTip}
                    className="btn-primary-soft text-sm px-6 py-2 flex items-center gap-2"
                  >
                    {loadingTip && <Loader2 className="w-4 h-4 animate-spin" />}
                    {loadingTip ? "Razmišljam..." : "Dobij Savet"}
                  </button>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Recent moods */}
        {recentMoods.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-heading text-xl font-medium text-[#2D3A3A]">Poslednja Raspoloženja</h2>
              <button
                data-testid="share-from-dashboard"
                onClick={() => navigate('/share')}
                className="flex items-center gap-2 text-sm text-[#4A6C6F] hover:text-[#365052] transition-colors font-medium"
              >
                <Image className="w-4 h-4" strokeWidth={1.5} />
                Podeli Karticu
              </button>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2">
              {recentMoods.map((mood) => (
                <div
                  key={mood.mood_id}
                  className="card-soft p-4 min-w-[120px] text-center shrink-0"
                  data-testid={`recent-mood-${mood.mood_id}`}
                >
                  <div className="text-3xl mb-2">{mood.emoji}</div>
                  <p className="text-xs text-[#2D3A3A] font-medium">{mood.label}</p>
                  <p className="text-[10px] text-[#8A9999] mt-1">
                    {new Date(mood.date).toLocaleDateString('sr-Latn-RS', { day: 'numeric', month: 'short' })}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </AppLayout>
  );
}
