import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Download, Send, Award, Flame, Loader2, Crown, Bell, Mail, Clock } from "lucide-react";
import { toast } from "sonner";
import AppLayout from "./AppLayout";
import { API, fetchWithAuth } from "@/lib/api";

export default function Profile({ user }) {
  const navigate = useNavigate();
  const [gamification, setGamification] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [notifSettings, setNotifSettings] = useState({
    email_reminders: true,
    reminder_time: "20:00",
    trial_warnings: true
  });
  const [savingNotif, setSavingNotif] = useState(false);

  useEffect(() => {
    loadGamification();
    loadNotificationSettings();
  }, []);

  const loadGamification = async () => {
    try {
      const res = await fetchWithAuth(`${API}/gamification/stats`);
      if (res.ok) setGamification(await res.json());
    } catch (err) {
      console.error(err);
    }
  };

  const loadNotificationSettings = async () => {
    try {
      const res = await fetchWithAuth(`${API}/settings/notifications`);
      if (res.ok) {
        const data = await res.json();
        setNotifSettings(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const saveNotificationSettings = async (newSettings) => {
    setSavingNotif(true);
    try {
      const res = await fetchWithAuth(`${API}/settings/notifications`, {
        method: "POST",
        body: JSON.stringify(newSettings)
      });
      if (res.ok) {
        setNotifSettings(newSettings);
        toast.success("Podešavanja sačuvana");
      }
    } catch {
      toast.error("Greška pri čuvanju");
    } finally {
      setSavingNotif(false);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await fetch(`${API}/moods/export`, { credentials: 'include' });
      if (res.status === 403) {
        toast.error("CSV izvoz je dostupan samo za Premium korisnike");
        navigate('/premium');
        return;
      }
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'umiri_me_raspolozenja.csv';
        a.click();
        URL.revokeObjectURL(url);
        toast.success("Podaci uspešno izvezeni!");
      }
    } catch {
      toast.error("Greška pri izvozu");
    } finally {
      setExporting(false);
    }
  };

  const handleShare = async () => {
    if (!gamification) return;
    const text = `Na Umiri.me pratim svoja raspoloženja!\nTrenutni niz: ${gamification.streak} dana\nUkupno unosa: ${gamification.total_entries}\nZarađene značke: ${gamification.badges.filter(b => b.earned).length}/${gamification.badges.length}\n\nProbaj i ti! umiri.me`;
    
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Umiri.me - Moja Statistika', text });
      } catch {}
    } else {
      await navigator.clipboard.writeText(text);
      toast.success("Kopirano u clipboard!");
    }
  };

  return (
    <AppLayout user={user}>
      <div data-testid="profile-page" className="max-w-3xl mx-auto space-y-8">
        {/* Profile header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card-soft p-8">
          <div className="flex items-center gap-5">
            {user?.picture ? (
              <img src={user.picture} alt="" className="w-16 h-16 rounded-full" />
            ) : (
              <div className="w-16 h-16 bg-[#D6E0D6] rounded-full flex items-center justify-center text-2xl">
                {user?.name?.[0]}
              </div>
            )}
            <div>
              <h1 className="font-heading text-2xl font-bold text-[#2D3A3A] flex items-center gap-2">
                {user?.name}
                {user?.is_premium && <Crown className="w-5 h-5 text-[#E09F7D]" />}
              </h1>
              <p className="text-sm text-[#8A9999]">{user?.email}</p>
            </div>
          </div>

          {/* Quick stats */}
          {gamification && (
            <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-[#EBEBE8]">
              <div className="text-center">
                <p className="text-2xl font-heading font-bold text-[#2D3A3A]">{gamification.total_entries}</p>
                <p className="text-xs text-[#8A9999]">Unosa</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-heading font-bold text-[#E09F7D]">{gamification.streak}</p>
                <p className="text-xs text-[#8A9999]">Niz Dana</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-heading font-bold text-[#4A6C6F]">
                  {gamification.badges.filter(b => b.earned).length}
                </p>
                <p className="text-xs text-[#8A9999]">Značke</p>
              </div>
            </div>
          )}
        </motion.div>

        {/* Badges */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <h2 className="font-heading text-xl font-medium text-[#2D3A3A] mb-4 flex items-center gap-2">
            <Award className="w-5 h-5 text-[#4A6C6F]" strokeWidth={1.5} /> Značke
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {gamification?.badges.map((badge) => (
              <div
                key={badge.id}
                data-testid={`badge-${badge.id}`}
                className={`card-soft p-5 transition-all duration-300 ${
                  badge.earned ? "ring-1 ring-[#769F78]/30" : "opacity-50 grayscale"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{badge.icon}</span>
                  <div>
                    <h3 className="text-sm font-medium text-[#2D3A3A]">{badge.name}</h3>
                    <p className="text-xs text-[#8A9999]">{badge.description}</p>
                  </div>
                </div>
                {badge.earned && (
                  <div className="mt-2">
                    <span className="text-[10px] bg-[#769F78] text-white px-2 py-0.5 rounded-full font-medium">
                      Zarađeno
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </motion.div>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex flex-col sm:flex-row gap-4"
        >
          <button
            data-testid="export-btn"
            onClick={handleExport}
            disabled={exporting}
            className="btn-primary-soft flex items-center justify-center gap-2 flex-1"
          >
            {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            {exporting ? "Izvozim..." : "Izvezi Podatke (CSV)"}
          </button>
          <button
            data-testid="share-btn"
            onClick={handleShare}
            className="flex items-center justify-center gap-2 flex-1 bg-white border-2 border-[#D6E0D6] text-[#4A6C6F] rounded-full px-8 py-3 hover:bg-[#D6E0D6]/20 transition-colors font-medium"
          >
            <Send className="w-4 h-4" />
            Podeli Statistiku
          </button>
        </motion.div>
      </div>
    </AppLayout>
  );
}
