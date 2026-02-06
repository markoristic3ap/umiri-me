import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import AppLayout from "./AppLayout";
import { API, fetchWithAuth, MOOD_TYPES } from "@/lib/api";

const moodOrder = ["srecan", "odusevljen", "miran", "neutralan", "umoran", "tuzan", "anksiozan", "ljut"];

export default function MoodEntry({ user }) {
  const navigate = useNavigate();
  const [selectedMood, setSelectedMood] = useState(null);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!selectedMood) {
      toast.error("Izaberi raspoloženje");
      return;
    }
    setSaving(true);
    try {
      const res = await fetchWithAuth(`${API}/moods`, {
        method: 'POST',
        body: JSON.stringify({ mood_type: selectedMood, note: note || null }),
      });
      if (res.ok) {
        toast.success("Raspoloženje zabeleženo!", {
          action: {
            label: "Podeli",
            onClick: () => navigate('/share'),
          },
        });
        navigate('/dashboard');
      } else {
        toast.error("Greška pri čuvanju");
      }
    } catch {
      toast.error("Greška pri čuvanju");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppLayout user={user}>
      <div data-testid="mood-entry-page" className="max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-heading text-3xl md:text-4xl font-light text-[#2D3A3A] mb-2">
            Kako se <span className="font-bold text-[#4A6C6F]">osećaš</span>?
          </h1>
          <p className="text-[#5C6B6B] mb-10">Izaberi raspoloženje koje najbolje opisuje tvoj trenutni osećaj</p>
        </motion.div>

        {/* Emoji Grid */}
        <div className="grid grid-cols-4 gap-4 mb-10">
          {moodOrder.map((key, i) => {
            const mood = MOOD_TYPES[key];
            const isSelected = selectedMood === key;
            return (
              <motion.button
                key={key}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                data-testid={`mood-btn-${key}`}
                onClick={() => setSelectedMood(key)}
                className={`card-soft p-4 md:p-6 text-center transition-all duration-300 ${
                  isSelected
                    ? "ring-2 ring-[#4A6C6F] shadow-lg scale-105"
                    : "hover:scale-105 hover:shadow-md"
                }`}
                style={isSelected ? { borderColor: mood.color } : {}}
              >
                <span className={`text-4xl md:text-6xl block mb-2 mood-emoji ${isSelected ? 'selected' : ''}`}>
                  {mood.emoji}
                </span>
                <span className={`text-xs md:text-sm ${isSelected ? 'text-[#2D3A3A] font-medium' : 'text-[#8A9999]'}`}>
                  {mood.label}
                </span>
              </motion.button>
            );
          })}
        </div>

        {/* Selected mood indicator */}
        <AnimatePresence>
          {selectedMood && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-8"
            >
              <div className="card-soft p-6">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-3xl">{MOOD_TYPES[selectedMood].emoji}</span>
                  <div>
                    <p className="font-heading font-medium text-[#2D3A3A]">
                      Osećaš se: {MOOD_TYPES[selectedMood].label}
                    </p>
                    <p className="text-sm text-[#8A9999]">Dodaj belešku (opciono)</p>
                  </div>
                </div>
                <Textarea
                  data-testid="mood-note-input"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Šta ti je na umu danas? Slobodno zapiši..."
                  className="bg-[#F9F9F7] border-[#EBEBE8] rounded-2xl min-h-[100px] text-[#2D3A3A] placeholder:text-[#8A9999] resize-none focus:ring-[#4A6C6F] focus:border-[#4A6C6F]"
                  maxLength={500}
                />
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-[#8A9999]">{note.length}/500</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Save button */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="flex gap-4"
        >
          <button
            data-testid="save-mood-btn"
            onClick={handleSave}
            disabled={!selectedMood || saving}
            className={`btn-primary-soft flex-1 text-base py-4 ${
              !selectedMood ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {saving ? "Čuvam..." : "Sačuvaj Raspoloženje"}
          </button>
        </motion.div>
      </div>
    </AppLayout>
  );
}
