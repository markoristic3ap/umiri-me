import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Sparkles, Loader2, FileText, TrendingUp, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import MoodIcon from "@/components/MoodIcon";
import AppLayout from "./AppLayout";
import { API, fetchWithAuth } from "@/lib/api";

export default function WeeklyReport({ user }) {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState(null);
  const [recentMoods, setRecentMoods] = useState([]);

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
      if (moodsRes.ok) setRecentMoods(await moodsRes.json());
    } catch (err) {
      console.error(err);
    }
  };

  const generateReport = async () => {
    setLoading(true);
    try {
      const res = await fetchWithAuth(`${API}/ai/weekly-report`, { method: "POST" });
      if (res.status === 403) {
        toast.error("Nedeljni izveštaj je dostupan samo za Premium korisnike");
        return;
      }
      if (res.ok) {
        const data = await res.json();
        setReport(data);
      }
    } catch (err) {
      console.error(err);
      toast.error("Greška pri generisanju izveštaja");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout user={user}>
      <div data-testid="weekly-report-page" className="max-w-3xl mx-auto space-y-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-heading text-2xl sm:text-3xl md:text-4xl font-light text-[#2D3A3A] mb-2">
            Nedeljni <span className="font-bold text-[#4A6C6F]">Izveštaj</span>
          </h1>
          <p className="text-sm sm:text-base text-[#5C6B6B]">AI analiza tvojih emocionalnih obrazaca</p>
        </motion.div>

        {/* Week summary cards */}
        <div className="grid grid-cols-3 gap-3 sm:gap-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card-soft p-4 sm:p-6 text-center">
            <p className="text-2xl sm:text-3xl font-heading font-bold text-[#2D3A3A]">{recentMoods.length}</p>
            <p className="text-xs text-[#8A9999]">Unosa ove nedelje</p>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="card-soft p-4 sm:p-6 text-center">
            <p className="text-2xl sm:text-3xl font-heading font-bold text-[#4A6C6F]">{stats?.avg_score || 0}</p>
            <p className="text-xs text-[#8A9999]">Prosek</p>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="card-soft p-4 sm:p-6 text-center">
            <p className="text-2xl sm:text-3xl font-heading font-bold text-[#E09F7D]">{stats?.streak || 0}</p>
            <p className="text-xs text-[#8A9999]">Niz dana</p>
          </motion.div>
        </div>

        {/* Recent moods timeline */}
        {recentMoods.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="card-soft p-4 sm:p-6">
            <h3 className="font-heading text-lg font-medium text-[#2D3A3A] mb-4">Ova Nedelja</h3>
            <div className="flex items-center justify-between gap-2 overflow-x-auto pb-2">
              {[...recentMoods].reverse().map((mood, i) => (
                <div key={mood.mood_id} className="flex flex-col items-center min-w-[48px]">
                  <MoodIcon mood={mood.mood_type} size={32} />
                  <p className="text-[10px] text-[#8A9999] mt-1">
                    {new Date(mood.date).toLocaleDateString("sr-Latn-RS", { weekday: "short" })}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* AI Report */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="card-soft p-6 sm:p-8 bg-gradient-to-br from-white to-[#F2F4F0]">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-[#D6E0D6] rounded-2xl flex items-center justify-center shrink-0">
              <FileText className="w-6 h-6 text-[#4A6C6F]" strokeWidth={1.5} />
            </div>
            <div className="flex-1">
              <h3 className="font-heading text-lg font-medium text-[#2D3A3A] mb-2">AI Analiza</h3>
              {report ? (
                <div className="text-[#5C6B6B] leading-relaxed whitespace-pre-line text-sm">
                  {report.report}
                </div>
              ) : (
                <div>
                  <p className="text-sm text-[#8A9999] mb-4">Generiši personalizovanu AI analizu tvojih nedeljnih obrazaca raspoloženja</p>
                  <button
                    data-testid="generate-weekly-report-btn"
                    onClick={generateReport}
                    disabled={loading}
                    className="btn-primary-soft text-sm px-6 py-2.5 flex items-center gap-2"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                    {loading ? "Analiziram..." : "Generiši Izveštaj"}
                  </button>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Trigger insights from stats */}
        {stats?.trigger_insights?.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="card-soft p-6 sm:p-8">
            <h3 className="font-heading text-lg font-medium text-[#2D3A3A] mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-[#4A6C6F]" /> Uticaj Faktora
            </h3>
            <div className="space-y-3">
              {stats.trigger_insights.slice(0, 5).map((insight) => {
                const pct = (insight.avg_score / 5) * 100;
                const barColor = insight.avg_score >= 4 ? "#769F78" : insight.avg_score >= 3 ? "#E8C170" : "#D66A6A";
                return (
                  <div key={insight.trigger} className="flex items-center gap-3">
                    <span className="text-xs text-[#2D3A3A] font-medium w-20 shrink-0">{insight.label}</span>
                    <div className="flex-1 h-6 bg-[#F2F4F0] rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: barColor }} />
                    </div>
                    <span className="text-xs text-[#8A9999] w-8">{insight.avg_score}</span>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </div>
    </AppLayout>
  );
}
