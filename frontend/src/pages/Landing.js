import { useState } from "react";
import { motion } from "framer-motion";
import MoodIcon from "@/components/MoodIcon";
import { Leaf, Mail, SmilePlus, TrendingUp, Trophy, Share2, Shield, ChevronDown } from "lucide-react";
import { API } from "@/lib/api";

export default function Landing() {
  const [email, setEmail] = useState("");
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [magicLinkLoading, setMagicLinkLoading] = useState(false);
  const [magicLinkError, setMagicLinkError] = useState("");

  const handleGoogleLogin = () => {
    const redirectUri = window.location.origin + '/auth/callback';
    const params = new URLSearchParams({
      client_id: process.env.REACT_APP_GOOGLE_CLIENT_ID,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'openid email profile',
      access_type: 'offline',
      prompt: 'consent',
    });
    window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  };

  const handleMagicLink = async (e) => {
    e.preventDefault();
    if (!email) return;
    setMagicLinkLoading(true);
    setMagicLinkError("");
    try {
      const res = await fetch(`${API}/auth/magic-link`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || "Greška pri slanju");
      }
      setMagicLinkSent(true);
    } catch (err) {
      setMagicLinkError(err.message);
    } finally {
      setMagicLinkLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F9F9F7] overflow-hidden">
      {/* Hero Section */}
      <div className="relative min-h-screen flex items-center">
        <div className="absolute inset-0">
          <img
            src="/hero.jpg"
            alt="Mirno okruženje"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#F9F9F7]/95 via-[#F9F9F7]/80 to-[#F9F9F7]/40" />
        </div>

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
              Prati svoja raspoloženja, otkrivaj šablone u emocijama i podeli
              svoj napredak sa prijateljima. Jednostavno, vizuelno i lično.
            </motion.p>

            {/* Login options */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="space-y-4 max-w-md"
            >
              {/* Google button */}
              <button
                data-testid="google-login-btn"
                onClick={handleGoogleLogin}
                className="btn-primary-soft w-full flex items-center justify-center gap-3 text-base"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#fff"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#fff"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#fff"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#fff"/>
                </svg>
                Nastavi sa Google nalogom
              </button>

              {/* Divider */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-[#EBEBE8]" />
                <span className="text-xs text-[#8A9999]">ili</span>
                <div className="flex-1 h-px bg-[#EBEBE8]" />
              </div>

              {/* Magic link */}
              {magicLinkSent ? (
                <div className="bg-[#D6E0D6]/30 border border-[#4A6C6F]/15 rounded-full py-3 px-6 flex items-center justify-center gap-3">
                  <Mail className="w-5 h-5 text-[#4A6C6F] shrink-0" />
                  <p className="text-sm text-[#2D3A3A]">Link poslat na <strong>{email}</strong></p>
                </div>
              ) : (
                <form onSubmit={handleMagicLink} className="relative">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Ili nastavi sa email adresom"
                    required
                    className="w-full pl-11 pr-28 py-3 rounded-full border border-[#EBEBE8] bg-white text-sm text-[#2D3A3A] placeholder:text-[#8A9999] focus:outline-none focus:border-[#4A6C6F] transition-colors shadow-sm"
                  />
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8A9999]" />
                  <button
                    type="submit"
                    disabled={magicLinkLoading}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 px-4 py-1.5 rounded-full bg-[#4A6C6F] text-white text-xs font-medium hover:bg-[#365052] transition-colors disabled:opacity-50"
                  >
                    {magicLinkLoading ? "..." : "Pošalji link"}
                  </button>
                </form>
              )}
              {magicLinkError && (
                <p className="text-xs text-red-500 text-center">{magicLinkError}</p>
              )}

              {/* Free badge */}
              <p className="text-xs text-[#8A9999] text-center flex items-center justify-center gap-1.5">
                <Shield className="w-3.5 h-3.5" />
                Besplatno, bez kreditne kartice
              </p>
            </motion.div>

            {/* Emoji mood strip */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 1 }}
              className="mt-16 flex flex-wrap justify-center sm:justify-start items-center gap-4 sm:gap-6 max-w-[200px] sm:max-w-none mx-auto sm:mx-0"
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

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 text-[#8A9999]"
        >
          <ChevronDown className="w-6 h-6 animate-bounce" />
        </motion.div>
      </div>

      {/* How it works */}
      <section className="py-20 px-6 md:px-12 bg-[#F4F4F1]">
        <div className="max-w-5xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="font-heading text-3xl md:text-4xl font-light text-[#2D3A3A] text-center mb-4"
          >
            Kako <span className="font-bold text-[#4A6C6F]">funkcioniše</span>?
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center text-[#5C6B6B] mb-16 max-w-lg mx-auto"
          >
            Četiri koraka do boljeg razumevanja sopstvenih emocija
          </motion.p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-10">
            {[
              {
                step: "1",
                icon: SmilePlus,
                title: "Zabeleži raspoloženje",
                desc: "Izaberi emoji koji odgovara tvom trenutnom osećanju i dodaj kratku belešku",
              },
              {
                step: "2",
                icon: TrendingUp,
                title: "Otkrivaj obrasce",
                desc: "Kalendar, grafici i AI saveti koji ti pomažu da razumeš svoje emocije",
              },
              {
                step: "3",
                icon: Trophy,
                title: "Osvajaj značke",
                desc: "Gradi niz dana, otključavaj dostignuća i prati svoj napredak",
              },
              {
                step: "4",
                icon: Share2,
                title: "Podeli sa svetom",
                desc: "Kreiraj vizuelne kartice svog raspoloženja i podeli ih na društvenim mrežama",
              },
            ].map((item, i) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.2 }}
                className="text-center"
              >
                <div className="w-16 h-16 bg-[#4A6C6F] rounded-full flex items-center justify-center mx-auto mb-5">
                  <item.icon className="w-7 h-7 text-white" strokeWidth={1.5} />
                </div>
                <div className="text-xs font-medium text-[#4A6C6F] uppercase tracking-wider mb-2">Korak {item.step}</div>
                <h3 className="font-heading text-lg font-medium text-[#2D3A3A] mb-2">{item.title}</h3>
                <p className="text-sm text-[#5C6B6B] leading-relaxed max-w-xs mx-auto">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 md:px-12 bg-[#4A6C6F]">
        <div className="max-w-2xl mx-auto text-center">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="font-heading text-3xl md:text-4xl font-light text-white mb-4"
          >
            Spreman da se <span className="font-bold">umiriš</span>?
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-white/70 mb-8"
          >
            Započni besplatno praćenje raspoloženja danas.
          </motion.p>
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            onClick={handleGoogleLogin}
            className="px-8 py-4 bg-white text-[#4A6C6F] rounded-2xl font-medium hover:bg-[#F9F9F7] transition-colors"
          >
            Započni besplatno
          </motion.button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 px-6 border-t border-[#EBEBE8] bg-[#F9F9F7]">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Leaf className="w-4 h-4 text-[#4A6C6F]" strokeWidth={1.5} />
              <span className="text-sm text-[#8A9999]">umiri.me</span>
            </div>
            <p className="text-xs text-[#8A9999]">Powered by <a href="https://creativewin.net" target="_blank" rel="noopener noreferrer" className="text-[#4A6C6F] hover:underline">Creativewin</a></p>
            <div className="flex items-center gap-4">
              <a href="mailto:info@creativewin.net" className="text-xs text-[#8A9999] hover:text-[#4A6C6F] transition-colors">Kontakt</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
