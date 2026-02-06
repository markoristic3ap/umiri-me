import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { motion } from "framer-motion";
import MoodIcon from "@/components/MoodIcon";
import { Leaf, Heart, BarChart3, Calendar, Sparkles } from "lucide-react";

export default function Landing() {
  const navigate = useNavigate();
  const [isHovering, setIsHovering] = useState(false);

  const handleLogin = () => {
    // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
    const redirectUrl = window.location.origin + '/dashboard';
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  return (
    <div className="min-h-screen bg-[#F9F9F7] overflow-hidden">
      {/* Hero Section */}
      <div className="relative min-h-screen flex items-center">
        {/* Background image with overlay */}
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1766201392384-49c27dbece0c?crop=entropy&cs=srgb&fm=jpg&q=85"
            alt="Mirno okruženje"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#F9F9F7]/95 via-[#F9F9F7]/80 to-[#F9F9F7]/40" />
        </div>

        {/* Content */}
        <div className="relative z-10 w-full max-w-7xl mx-auto px-6 md:px-12">
          <div className="max-w-2xl">
            {/* Logo */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
              className="flex items-center gap-3 mb-12"
            >
              <div className="w-10 h-10 bg-[#4A6C6F] rounded-full flex items-center justify-center">
                <Leaf className="w-5 h-5 text-white" strokeWidth={1.5} />
              </div>
              <span className="font-heading text-xl text-[#2D3A3A] font-light">umiri.me</span>
            </motion.div>

            {/* Heading */}
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="font-heading text-4xl sm:text-5xl lg:text-6xl font-light text-[#2D3A3A] leading-tight mb-6"
            >
              Tvoja oaza
              <br />
              <span className="font-bold text-[#4A6C6F]">unutrašnjeg mira</span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="text-base md:text-lg text-[#5C6B6B] leading-relaxed mb-10 max-w-lg"
            >
              Prati svoja raspoloženja, razumi svoje emocije i pronađi mir u svakodnevici.
              Jer svaki osećaj zaslužuje da bude primećen.
            </motion.p>

            {/* CTA */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="flex flex-col sm:flex-row gap-4"
            >
              <button
                data-testid="google-login-btn"
                onClick={handleLogin}
                onMouseEnter={() => setIsHovering(true)}
                onMouseLeave={() => setIsHovering(false)}
                className="btn-primary-soft flex items-center justify-center gap-3 text-base"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#fff"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#fff"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#fff"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#fff"/>
                </svg>
                Prijavi se sa Google nalogom
              </button>
            </motion.div>

            {/* Emoji mood strip */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 1 }}
              className="mt-16 flex items-center gap-6"
            >
              {["srecan", "miran", "odusevljen", "neutralan", "tuzan", "anksiozan", "ljut", "umoran"].map((mood, i) => (
                <span
                  key={mood}
                  className="opacity-50 hover:opacity-100 transition-all duration-300 hover:scale-125 cursor-default"
                  style={{ animationDelay: `${i * 0.2}s` }}
                >
                  <MoodIcon mood={mood} size={36} animated />
                </span>
              ))}
            </motion.div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <section className="py-20 px-6 md:px-12 max-w-7xl mx-auto">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="font-heading text-3xl md:text-4xl font-light text-[#2D3A3A] text-center mb-16"
        >
          Zašto <span className="font-bold text-[#4A6C6F]">Umiri.me</span>?
        </motion.h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { icon: Heart, title: "Prati Raspoloženja", desc: "Zabeleži kako se osećaš svakog dana uz pomoć emoji sistema" },
            { icon: Calendar, title: "Kalendar Emocija", desc: "Pregledaj svoje mesečne obrasce i trendove raspoloženja" },
            { icon: BarChart3, title: "Statistika", desc: "Vizuelni grafici koji ti pomažu da bolje razumeš sebe" },
            { icon: Sparkles, title: "AI Saveti", desc: "Personalizovani saveti bazirani na tvojim emocijama" },
          ].map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
              className="card-soft p-8 hover:-translate-y-1"
              data-testid={`feature-card-${i}`}
            >
              <div className="w-12 h-12 bg-[#D6E0D6] rounded-2xl flex items-center justify-center mb-5">
                <feature.icon className="w-6 h-6 text-[#4A6C6F]" strokeWidth={1.5} />
              </div>
              <h3 className="font-heading text-lg font-medium text-[#2D3A3A] mb-2">{feature.title}</h3>
              <p className="text-sm text-[#5C6B6B] leading-relaxed">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-[#EBEBE8]">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Leaf className="w-4 h-4 text-[#4A6C6F]" strokeWidth={1.5} />
            <span className="text-sm text-[#8A9999]">umiri.me</span>
          </div>
          <p className="text-xs text-[#8A9999]">Tvoje emocije zaslužuju pažnju</p>
        </div>
      </footer>
    </div>
  );
}
