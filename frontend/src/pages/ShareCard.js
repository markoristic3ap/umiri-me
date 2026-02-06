import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toPng } from "html-to-image";
import { Download, Send, ChevronLeft, ChevronRight, Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";
import AppLayout from "./AppLayout";
import MoodIcon from "@/components/MoodIcon";
import { API, fetchWithAuth, MOOD_TYPES } from "@/lib/api";

const CARD_TEMPLATES = [
  { id: "today", label: "Danas", desc: "Današnje raspoloženje" },
  { id: "weekly", label: "Nedelja", desc: "Nedeljni izveštaj" },
  { id: "streak", label: "Niz", desc: "Streak slavlje" },
  { id: "ai_tip", label: "AI Savet", desc: "Personalizovani savet" },
];

const CARD_GRADIENTS = [
  "linear-gradient(135deg, #E8F5E9 0%, #F1F8E9 50%, #FFF8E1 100%)",
  "linear-gradient(135deg, #E3F2FD 0%, #F3E5F5 50%, #FCE4EC 100%)",
  "linear-gradient(135deg, #FFF3E0 0%, #FBE9E7 50%, #FFEBEE 100%)",
  "linear-gradient(135deg, #E0F7FA 0%, #E8EAF6 50%, #F3E5F5 100%)",
];

export default function ShareCard({ user }) {
  const [selectedTemplate, setSelectedTemplate] = useState("today");
  const [todayMood, setTodayMood] = useState(null);
  const [weeklyMoods, setWeeklyMoods] = useState([]);
  const [stats, setStats] = useState(null);
  const [aiTip, setAiTip] = useState(null);
  const [loadingTip, setLoadingTip] = useState(false);
  const [gradientIdx, setGradientIdx] = useState(0);
  const [downloading, setDownloading] = useState(false);
  const cardRef = useRef(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [moodsRes, statsRes] = await Promise.all([
        fetchWithAuth(`${API}/moods?limit=7`),
        fetchWithAuth(`${API}/moods/stats`),
      ]);
      if (moodsRes.ok) {
        const moods = await moodsRes.json();
        setWeeklyMoods(moods);
        const today = new Date().toISOString().split("T")[0];
        setTodayMood(moods.find((m) => m.date === today) || null);
      }
      if (statsRes.ok) setStats(await statsRes.json());
    } catch (err) {
      console.error(err);
    }
  };

  const loadAiTip = async () => {
    setLoadingTip(true);
    try {
      const res = await fetchWithAuth(`${API}/ai/tips`, { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setAiTip(data.tip);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingTip(false);
    }
  };

  const handleDownload = async () => {
    if (!cardRef.current) return;
    setDownloading(true);
    try {
      const dataUrl = await toPng(cardRef.current, {
        pixelRatio: 3,
        backgroundColor: "#F9F9F7",
      });
      const link = document.createElement("a");
      link.download = `umiri-me-${selectedTemplate}-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
      toast.success("Kartica preuzeta!");
    } catch (err) {
      console.error(err);
      toast.error("Greška pri preuzimanju");
    } finally {
      setDownloading(false);
    }
  };

  const handleShare = async () => {
    if (!cardRef.current) return;
    try {
      const dataUrl = await toPng(cardRef.current, { pixelRatio: 3, backgroundColor: "#F9F9F7" });
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], "umiri-me-kartica.png", { type: "image/png" });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: "Umiri.me - Moja Mood Kartica",
          text: "Pogledaj moje raspoloženje na umiri.me!",
          files: [file],
        });
      } else {
        handleDownload();
        toast.info("Preuzmi sliku i podeli na Instagram Stories!");
      }
    } catch (err) {
      if (err.name !== "AbortError") {
        handleDownload();
      }
    }
  };

  const cycleGradient = () => setGradientIdx((i) => (i + 1) % CARD_GRADIENTS.length);

  const formatDate = (dateStr) =>
    new Date(dateStr).toLocaleDateString("sr-Latn-RS", {
      day: "numeric",
      month: "short",
    });

  const todayFormatted = new Date().toLocaleDateString("sr-Latn-RS", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <AppLayout user={user}>
      <div data-testid="share-card-page" className="max-w-3xl mx-auto space-y-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-heading text-3xl md:text-4xl font-light text-[#2D3A3A] mb-2">
            Podeli <span className="font-bold text-[#4A6C6F]">Mood Karticu</span>
          </h1>
          <p className="text-[#5C6B6B]">Napravi lepu karticu i podeli na Instagram Stories</p>
        </motion.div>

        {/* Template selector */}
        <div className="flex gap-3 overflow-x-auto pb-2">
          {CARD_TEMPLATES.map((t) => (
            <button
              key={t.id}
              data-testid={`template-${t.id}`}
              onClick={() => setSelectedTemplate(t.id)}
              className={`shrink-0 px-5 py-3 rounded-full text-sm font-medium transition-all ${
                selectedTemplate === t.id
                  ? "bg-[#4A6C6F] text-white shadow-lg shadow-[#4A6C6F]/20"
                  : "bg-white text-[#5C6B6B] border border-[#EBEBE8] hover:bg-[#F2F4F0]"
              }`}
            >
              {t.label}
            </button>
          ))}
          <button
            data-testid="change-gradient-btn"
            onClick={cycleGradient}
            className="shrink-0 px-5 py-3 rounded-full text-sm font-medium bg-white text-[#5C6B6B] border border-[#EBEBE8] hover:bg-[#F2F4F0] transition-all"
          >
            Promeni Boju
          </button>
        </div>

        {/* Card Preview */}
        <div className="flex justify-center">
          <div
            ref={cardRef}
            className="w-[360px] rounded-3xl overflow-hidden shadow-2xl"
            style={{ background: CARD_GRADIENTS[gradientIdx] }}
          >
            {/* Card inner */}
            <div className="p-8 flex flex-col min-h-[640px]">
              {/* Header */}
              <div className="flex items-center gap-2 mb-8">
                <div className="w-7 h-7 bg-[#4A6C6F] rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">U</span>
                </div>
                <span className="text-sm font-medium text-[#4A6C6F]">umiri.me</span>
              </div>

              {/* Content based on template */}
              <div className="flex-1 flex flex-col justify-center">
                <AnimatePresence mode="wait">
                  {selectedTemplate === "today" && (
                    <motion.div key="today" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                      <p className="text-xs uppercase tracking-widest text-[#8A9999] mb-4">{todayFormatted}</p>
                      {todayMood ? (
                        <>
                          <div className="mb-6"><MoodIcon mood={todayMood.mood_type} size={96} /></div>
                          <h2 className="font-heading text-3xl font-bold text-[#2D3A3A] mb-3">
                            Danas se osećam
                          </h2>
                          <p className="text-2xl font-heading text-[#4A6C6F] font-medium mb-6">
                            {todayMood.label}
                          </p>
                          {todayMood.note && (
                            <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 mb-4">
                              <p className="text-sm text-[#5C6B6B] italic leading-relaxed">
                                "{todayMood.note}"
                              </p>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="text-center">
                          <div className="text-6xl mb-4 opacity-30">😊</div>
                          <p className="text-[#8A9999]">Još nisi zabeležio/la današnje raspoloženje</p>
                        </div>
                      )}
                    </motion.div>
                  )}

                  {selectedTemplate === "weekly" && (
                    <motion.div key="weekly" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                      <h2 className="font-heading text-2xl font-bold text-[#2D3A3A] mb-2">
                        Moj Nedeljni Izveštaj
                      </h2>
                      <p className="text-xs text-[#8A9999] mb-8">Poslednjih 7 dana</p>

                      {weeklyMoods.length > 0 ? (
                        <div className="space-y-3">
                          {weeklyMoods.slice(0, 7).map((mood, i) => (
                            <div
                              key={mood.mood_id}
                              className="flex items-center gap-3 bg-white/50 backdrop-blur-sm rounded-2xl px-4 py-3"
                            >
                              <span className="text-2xl">{mood.emoji}</span>
                              <div className="flex-1">
                                <p className="text-sm font-medium text-[#2D3A3A]">{mood.label}</p>
                                <p className="text-xs text-[#8A9999]">{formatDate(mood.date)}</p>
                              </div>
                              <div className="flex">
                                {Array.from({ length: mood.score }, (_, j) => (
                                  <div
                                    key={j}
                                    className="w-2 h-2 rounded-full mr-0.5"
                                    style={{ backgroundColor: mood.color }}
                                  />
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-[#8A9999] text-center">Nema podataka za ovu nedelju</p>
                      )}

                      {stats && (
                        <div className="mt-6 bg-white/50 backdrop-blur-sm rounded-2xl p-4 text-center">
                          <p className="text-xs text-[#8A9999]">Prosečna ocena</p>
                          <p className="text-3xl font-heading font-bold text-[#4A6C6F]">
                            {stats.avg_score}/5
                          </p>
                        </div>
                      )}
                    </motion.div>
                  )}

                  {selectedTemplate === "streak" && (
                    <motion.div
                      key="streak"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="text-center"
                    >
                      <div className="text-7xl mb-4">🔥</div>
                      <h2 className="font-heading text-5xl font-bold text-[#2D3A3A] mb-2">
                        {stats?.streak || 0}
                      </h2>
                      <p className="text-xl font-heading text-[#4A6C6F] mb-6">
                        {stats?.streak === 1 ? "dan zaredom" : "dana zaredom"}
                      </p>
                      <div className="bg-white/50 backdrop-blur-sm rounded-2xl p-4 inline-block">
                        <p className="text-sm text-[#5C6B6B]">
                          Ukupno <span className="font-bold text-[#2D3A3A]">{stats?.total || 0}</span> raspoloženja zabeleženo
                        </p>
                      </div>
                      {stats?.streak >= 7 && (
                        <div className="mt-4">
                          <span className="text-4xl">⭐</span>
                          <p className="text-sm text-[#4A6C6F] font-medium mt-1">Neverovatna posvećenost!</p>
                        </div>
                      )}
                    </motion.div>
                  )}

                  {selectedTemplate === "ai_tip" && (
                    <motion.div key="ai_tip" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                      <div className="flex items-center gap-2 mb-6">
                        <Sparkles className="w-5 h-5 text-[#4A6C6F]" />
                        <p className="text-xs uppercase tracking-widest text-[#8A9999]">AI Savet za Danas</p>
                      </div>

                      {aiTip ? (
                        <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6">
                          <p className="text-lg text-[#2D3A3A] leading-relaxed font-heading font-light italic">
                            "{aiTip}"
                          </p>
                        </div>
                      ) : (
                        <div className="text-center">
                          <button
                            data-testid="generate-ai-tip-for-card"
                            onClick={loadAiTip}
                            disabled={loadingTip}
                            className="btn-primary-soft text-sm px-6 py-3 flex items-center gap-2 mx-auto"
                          >
                            {loadingTip ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" /> Razmišljam...
                              </>
                            ) : (
                              <>
                                <Sparkles className="w-4 h-4" /> Generiši Savet
                              </>
                            )}
                          </button>
                        </div>
                      )}

                      {todayMood && (
                        <div className="mt-6 flex items-center gap-3">
                          <span className="text-3xl">{todayMood.emoji}</span>
                          <div>
                            <p className="text-sm font-medium text-[#2D3A3A]">Danas: {todayMood.label}</p>
                            <p className="text-xs text-[#8A9999]">{todayFormatted}</p>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Footer */}
              <div className="mt-auto pt-6">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-[#8A9999]">Prati svoja raspoloženja</p>
                  <p className="text-xs font-bold text-[#4A6C6F]">umiri.me</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-4 max-w-[360px] mx-auto w-full">
          <button
            data-testid="download-card-btn"
            onClick={handleDownload}
            disabled={downloading}
            className="btn-primary-soft flex items-center justify-center gap-2 flex-1"
          >
            {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            {downloading ? "Preuzimam..." : "Preuzmi Sliku"}
          </button>
          <button
            data-testid="share-card-btn"
            onClick={handleShare}
            className="flex items-center justify-center gap-2 flex-1 bg-white border-2 border-[#D6E0D6] text-[#4A6C6F] rounded-full px-8 py-3 hover:bg-[#D6E0D6]/20 transition-colors font-medium"
          >
            <Send className="w-4 h-4" />
            Podeli
          </button>
        </div>

        {/* Instructions */}
        <div className="card-soft p-6 max-w-[360px] mx-auto">
          <h3 className="font-heading text-sm font-medium text-[#2D3A3A] mb-2">Kako podeliti na Instagram?</h3>
          <ol className="text-xs text-[#5C6B6B] space-y-1.5 list-decimal list-inside">
            <li>Preuzmi sliku klikom na "Preuzmi Sliku"</li>
            <li>Otvori Instagram i kreiraj novu Story</li>
            <li>Izaberi preuzetu sliku iz galerije</li>
            <li>Dodaj stikere ili tekst po želji</li>
            <li>Podeli sa prijateljima!</li>
          </ol>
        </div>
      </div>
    </AppLayout>
  );
}
