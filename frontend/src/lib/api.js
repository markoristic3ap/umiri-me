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
