import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import AppLayout from "./AppLayout";
import { API, fetchWithAuth, MOOD_TYPES } from "@/lib/api";

const DAYS_SR = ["Pon", "Uto", "Sre", "Čet", "Pet", "Sub", "Ned"];
const MONTHS_SR = [
  "Januar", "Februar", "Mart", "April", "Maj", "Jun",
  "Jul", "Avgust", "Septembar", "Oktobar", "Novembar", "Decembar"
];

export default function CalendarView({ user }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [moods, setMoods] = useState([]);
  const [selectedDay, setSelectedDay] = useState(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1;

  useEffect(() => {
    loadMoods();
  }, [year, month]);

  const loadMoods = async () => {
    try {
      const res = await fetchWithAuth(`${API}/moods/calendar/${year}/${month}`);
      if (res.ok) setMoods(await res.json());
    } catch (err) {
      console.error(err);
    }
  };

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 2, 1));
    setSelectedDay(null);
  };
  const nextMonth = () => {
    setCurrentDate(new Date(year, month, 1));
    setSelectedDay(null);
  };

  const getDaysInMonth = () => {
    const firstDay = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month, 0);
    const daysInMonth = lastDay.getDate();
    let startDay = firstDay.getDay() - 1;
    if (startDay < 0) startDay = 6;

    const days = [];
    for (let i = 0; i < startDay; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }
    return days;
  };

  const getMoodForDay = (day) => {
    if (!day) return null;
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return moods.find(m => m.date === dateStr);
  };

  const today = new Date();
  const isToday = (day) => day === today.getDate() && month === today.getMonth() + 1 && year === today.getFullYear();
  const selectedMood = selectedDay ? getMoodForDay(selectedDay) : null;

  return (
    <AppLayout user={user}>
      <div data-testid="calendar-page" className="max-w-3xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-heading text-3xl md:text-4xl font-light text-[#2D3A3A] mb-2">
            Kalendar <span className="font-bold text-[#4A6C6F]">Emocija</span>
          </h1>
          <p className="text-[#5C6B6B] mb-8">Pregledaj mesečne obrasce raspoloženja</p>
        </motion.div>

        {/* Calendar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card-soft p-6 md:p-8"
        >
          {/* Month navigation */}
          <div className="flex items-center justify-between mb-8">
            <button
              data-testid="prev-month-btn"
              onClick={prevMonth}
              className="w-10 h-10 rounded-full bg-[#F2F4F0] flex items-center justify-center hover:bg-[#D6E0D6] transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-[#4A6C6F]" strokeWidth={1.5} />
            </button>
            <h2 className="font-heading text-xl font-medium text-[#2D3A3A]">
              {MONTHS_SR[month - 1]} {year}
            </h2>
            <button
              data-testid="next-month-btn"
              onClick={nextMonth}
              className="w-10 h-10 rounded-full bg-[#F2F4F0] flex items-center justify-center hover:bg-[#D6E0D6] transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-[#4A6C6F]" strokeWidth={1.5} />
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 gap-2 mb-4">
            {DAYS_SR.map(day => (
              <div key={day} className="text-center text-xs font-bold tracking-widest uppercase text-[#8A9999]">
                {day}
              </div>
            ))}
          </div>

          {/* Days grid */}
          <div className="grid grid-cols-7 gap-2">
            {getDaysInMonth().map((day, i) => {
              const mood = getMoodForDay(day);
              const todayClass = isToday(day) ? "ring-2 ring-[#4A6C6F]" : "";
              const selectedClass = selectedDay === day ? "bg-[#D6E0D6]" : "";
              return (
                <div
                  key={i}
                  data-testid={day ? `calendar-day-${day}` : undefined}
                  onClick={() => day && setSelectedDay(day === selectedDay ? null : day)}
                  className={`aspect-square rounded-2xl flex flex-col items-center justify-center transition-all duration-200 ${
                    day ? "cursor-pointer hover:bg-[#F2F4F0]" : ""
                  } ${todayClass} ${selectedClass}`}
                >
                  {day && (
                    <>
                      <span className="text-xs text-[#8A9999] mb-0.5">{day}</span>
                      {mood ? (
                        <span className="text-xl md:text-2xl">{mood.emoji}</span>
                      ) : (
                        <span className="w-2 h-2 rounded-full bg-[#EBEBE8]" />
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Selected day detail */}
        {selectedMood && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="card-soft p-6 mt-6"
            data-testid="selected-day-detail"
          >
            <div className="flex items-center gap-4">
              <span className="text-4xl">{selectedMood.emoji}</span>
              <div>
                <h3 className="font-heading text-lg text-[#2D3A3A]">{selectedMood.label}</h3>
                <p className="text-sm text-[#8A9999]">
                  {new Date(selectedMood.date).toLocaleDateString('sr-Latn-RS', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
                {selectedMood.note && (
                  <p className="text-sm text-[#5C6B6B] mt-2 italic">"{selectedMood.note}"</p>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* Legend */}
        <div className="mt-6 flex flex-wrap gap-3">
          {Object.entries(MOOD_TYPES).map(([key, mood]) => (
            <div key={key} className="flex items-center gap-1.5 text-xs text-[#8A9999]">
              <span className="text-base">{mood.emoji}</span>
              {mood.label}
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
