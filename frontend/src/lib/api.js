const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

export const MOOD_TYPES = {
  srecan: { emoji: "😊", label: "Srećan", score: 5, color: "#769F78" },
  odusevljen: { emoji: "🤩", label: "Oduševljen", score: 5, color: "#E8C170" },
  miran: { emoji: "😌", label: "Miran", score: 4, color: "#7CA5B8" },
  neutralan: { emoji: "😐", label: "Neutralan", score: 3, color: "#8A9999" },
  umoran: { emoji: "🥱", label: "Umoran", score: 2, color: "#B8A07C" },
  tuzan: { emoji: "😢", label: "Tužan", score: 1, color: "#7CA5B8" },
  anksiozan: { emoji: "😰", label: "Anksiozan", score: 1, color: "#D66A6A" },
  ljut: { emoji: "😡", label: "Ljut", score: 1, color: "#D66A6A" },
};

export const TRIGGER_TYPES = {
  posao: { label: "Posao", icon: "Briefcase" },
  san: { label: "San", icon: "Moon" },
  vezba: { label: "Vežbanje", icon: "Dumbbell" },
  drustvo: { label: "Društvo", icon: "Users" },
  ishrana: { label: "Ishrana", icon: "UtensilsCrossed" },
  porodica: { label: "Porodica", icon: "Home" },
  zdravlje: { label: "Zdravlje", icon: "HeartPulse" },
  vreme: { label: "Vreme", icon: "Cloud" },
  novac: { label: "Novac", icon: "Wallet" },
  ucenje: { label: "Učenje", icon: "BookOpen" },
  odmor: { label: "Odmor", icon: "Palmtree" },
  kreativnost: { label: "Kreativnost", icon: "Palette" },
};

export const fetchWithAuth = async (url, options = {}) => {
  const response = await fetch(url, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  return response;
};
