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

        {/* Notification Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <h2 className="font-heading text-xl font-medium text-[#2D3A3A] dark:text-[#E8EAE8] mb-4 flex items-center gap-2">
            <Bell className="w-5 h-5 text-[#4A6C6F]" strokeWidth={1.5} /> Obaveštenja
          </h2>
          <div className="card-soft p-6 space-y-5">
            {/* Email reminders toggle */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-[#8A9999]" strokeWidth={1.5} />
                <div>
                  <p className="text-sm font-medium text-[#2D3A3A] dark:text-[#E8EAE8]">Dnevni podsetnik</p>
                  <p className="text-xs text-[#8A9999]">Primi email ako nisi zabeležio/la raspoloženje</p>
                </div>
              </div>
              <button
                data-testid="toggle-email-reminders"
                onClick={() => saveNotificationSettings({
                  ...notifSettings,
                  email_reminders: !notifSettings.email_reminders
                })}
                disabled={savingNotif}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  notifSettings.email_reminders ? "bg-[#4A6C6F]" : "bg-[#D6E0D6] dark:bg-[#2a3538]"
                }`}
              >
                <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                  notifSettings.email_reminders ? "translate-x-6" : "translate-x-0.5"
                }`} />
              </button>
            </div>

            {/* Reminder time */}
            {notifSettings.email_reminders && (
              <div className="flex items-center justify-between pl-8 border-l-2 border-[#D6E0D6] dark:border-[#2a3538] ml-2">
                <div className="flex items-center gap-3">
                  <Clock className="w-4 h-4 text-[#8A9999]" strokeWidth={1.5} />
                  <div>
                    <p className="text-sm font-medium text-[#2D3A3A] dark:text-[#E8EAE8]">Vreme podsetnika</p>
                    <p className="text-xs text-[#8A9999]">Kada da ti pošaljemo podsetnik</p>
                  </div>
                </div>
                <select
                  data-testid="reminder-time-select"
                  value={notifSettings.reminder_time}
                  onChange={(e) => saveNotificationSettings({
                    ...notifSettings,
                    reminder_time: e.target.value
                  })}
                  disabled={savingNotif}
                  className="bg-[#F2F4F0] dark:bg-[#243030] border-none rounded-xl px-3 py-2 text-sm text-[#2D3A3A] dark:text-[#E8EAE8] focus:ring-2 focus:ring-[#4A6C6F]/30"
                >
                  <option value="08:00">08:00</option>
                  <option value="09:00">09:00</option>
                  <option value="12:00">12:00</option>
                  <option value="18:00">18:00</option>
                  <option value="19:00">19:00</option>
                  <option value="20:00">20:00</option>
                  <option value="21:00">21:00</option>
                  <option value="22:00">22:00</option>
                </select>
              </div>
            )}

            {/* Trial warnings toggle */}
            <div className="flex items-center justify-between pt-4 border-t border-[#EBEBE8] dark:border-[#2a3538]">
              <div className="flex items-center gap-3">
                <Crown className="w-5 h-5 text-[#E09F7D]" strokeWidth={1.5} />
                <div>
                  <p className="text-sm font-medium text-[#2D3A3A] dark:text-[#E8EAE8]">Trial obaveštenja</p>
                  <p className="text-xs text-[#8A9999]">Obavesti me pre isteka trial perioda</p>
                </div>
              </div>
              <button
                data-testid="toggle-trial-warnings"
                onClick={() => saveNotificationSettings({
                  ...notifSettings,
                  trial_warnings: !notifSettings.trial_warnings
                })}
                disabled={savingNotif}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  notifSettings.trial_warnings ? "bg-[#4A6C6F]" : "bg-[#D6E0D6] dark:bg-[#2a3538]"
                }`}
              >
                <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                  notifSettings.trial_warnings ? "translate-x-6" : "translate-x-0.5"
                }`} />
              </button>
            </div>
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
