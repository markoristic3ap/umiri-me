import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

const PHASES = [
  { name: "Udahni", duration: 4, scale: 1.4, color: "#7CA5B8" },
  { name: "Zadrži", duration: 4, scale: 1.4, color: "#769F78" },
  { name: "Izdahni", duration: 6, scale: 1, color: "#E09F7D" },
  { name: "Pauza", duration: 2, scale: 1, color: "#8A9999" },
];

const TOTAL_CYCLE = PHASES.reduce((sum, p) => sum + p.duration, 0);
const EXERCISE_DURATION = 60;

export default function BreathingExercise({ onClose }) {
  const [isActive, setIsActive] = useState(false);
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [phaseTime, setPhaseTime] = useState(0);
  const [totalTime, setTotalTime] = useState(0);
  const [completed, setCompleted] = useState(false);
  const intervalRef = useRef(null);

  const currentPhase = PHASES[phaseIndex];
  const progress = (totalTime / EXERCISE_DURATION) * 100;

  const start = useCallback(() => {
    setIsActive(true);
    setPhaseIndex(0);
    setPhaseTime(0);
    setTotalTime(0);
    setCompleted(false);
  }, []);

  useEffect(() => {
    if (!isActive) return;

    intervalRef.current = setInterval(() => {
      setTotalTime(prev => {
        if (prev >= EXERCISE_DURATION) {
          clearInterval(intervalRef.current);
          setIsActive(false);
          setCompleted(true);
          return EXERCISE_DURATION;
        }
        return prev + 0.1;
      });

      setPhaseTime(prev => {
        const newTime = prev + 0.1;
        if (newTime >= PHASES[phaseIndex].duration) {
          setPhaseIndex(pi => (pi + 1) % PHASES.length);
          return 0;
        }
        return newTime;
      });
    }, 100);

    return () => clearInterval(intervalRef.current);
  }, [isActive, phaseIndex]);

  const stop = () => {
    clearInterval(intervalRef.current);
    setIsActive(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-[#2D3A3A]/80 backdrop-blur-md flex items-center justify-center p-4"
      data-testid="breathing-exercise"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-[#F9F9F7] rounded-3xl p-8 sm:p-12 max-w-md w-full text-center relative"
      >
        <button
          data-testid="close-breathing-btn"
          onClick={() => { stop(); onClose(); }}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-[#F2F4F0] flex items-center justify-center hover:bg-[#D6E0D6] transition-colors"
        >
          <X className="w-4 h-4 text-[#5C6B6B]" />
        </button>

        {!isActive && !completed && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <h2 className="font-heading text-2xl font-bold text-[#2D3A3A] mb-2">Tehnika Disanja</h2>
            <p className="text-sm text-[#5C6B6B] mb-8">60 sekundi vođenog disanja za smirenje</p>

            <div className="flex justify-center mb-8">
              <div className="w-24 h-24 rounded-full bg-[#D6E0D6] flex items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-[#4A6C6F] flex items-center justify-center">
                  <span className="text-white text-2xl font-heading">4-4-6</span>
                </div>
              </div>
            </div>

            <p className="text-xs text-[#8A9999] mb-6">Udahni 4s, Zadrži 4s, Izdahni 6s</p>

            <button
              data-testid="start-breathing-btn"
              onClick={start}
              className="btn-primary-soft w-full py-4 text-base"
            >
              Započni Vežbu
            </button>
          </motion.div>
        )}

        {isActive && (
          <div>
            <p className="text-xs text-[#8A9999] mb-6">{Math.ceil(EXERCISE_DURATION - totalTime)}s preostalo</p>

            {/* Breathing circle */}
            <div className="flex justify-center mb-8 relative">
              <motion.div
                animate={{ scale: currentPhase.scale }}
                transition={{ duration: currentPhase.duration, ease: "easeInOut" }}
                className="w-40 h-40 rounded-full flex items-center justify-center"
                style={{ backgroundColor: `${currentPhase.color}20`, border: `3px solid ${currentPhase.color}` }}
              >
                <motion.div
                  animate={{ scale: currentPhase.scale * 0.7 }}
                  transition={{ duration: currentPhase.duration, ease: "easeInOut" }}
                  className="w-24 h-24 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: `${currentPhase.color}40` }}
                >
                  <span className="text-lg font-heading font-bold" style={{ color: currentPhase.color }}>
                    {Math.ceil(currentPhase.duration - phaseTime)}
                  </span>
                </motion.div>
              </motion.div>
            </div>

            <p className="font-heading text-2xl font-bold mb-2" style={{ color: currentPhase.color }}>
              {currentPhase.name}
            </p>

            {/* Progress bar */}
            <div className="w-full h-2 bg-[#F2F4F0] rounded-full mt-6 overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-[#4A6C6F]"
                style={{ width: `${progress}%` }}
                transition={{ duration: 0.1 }}
              />
            </div>

            <button
              data-testid="stop-breathing-btn"
              onClick={stop}
              className="mt-6 text-sm text-[#8A9999] hover:text-[#5C6B6B] transition-colors"
            >
              Zaustavi
            </button>
          </div>
        )}

        {completed && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
            <div className="text-5xl mb-4">🌿</div>
            <h2 className="font-heading text-2xl font-bold text-[#2D3A3A] mb-2">Bravo!</h2>
            <p className="text-sm text-[#5C6B6B] mb-6">Uspešno si završio/la vežbu disanja. Nastavi da se osećaš mirno.</p>
            <button
              data-testid="done-breathing-btn"
              onClick={() => { setCompleted(false); onClose(); }}
              className="btn-primary-soft w-full py-3"
            >
              Zatvori
            </button>
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
}
