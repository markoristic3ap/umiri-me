import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Crown, Check, Sparkles, BarChart3, Download, Image, Zap, Loader2 } from "lucide-react";
import { toast } from "sonner";
import AppLayout from "./AppLayout";
import { API, fetchWithAuth } from "@/lib/api";

const FEATURES_FREE = [
  { text: "Praćenje raspoloženja", included: true },
  { text: "Kalendar emocija", included: true },
  { text: "Osnovna statistika", included: true },
  { text: "1 AI savet dnevno", included: true },
  { text: "Kartica 'Danas'", included: true },
  { text: "Neograničeni AI saveti", included: false },
  { text: "Sve kartice za deljenje", included: false },
  { text: "CSV izvoz podataka", included: false },
  { text: "Napredna statistika", included: false },
];

const FEATURES_PREMIUM = [
  { text: "Praćenje raspoloženja", included: true },
  { text: "Kalendar emocija", included: true },
  { text: "Osnovna statistika", included: true },
  { text: "Neograničeni AI saveti", included: true },
  { text: "Sve kartice za deljenje (4 šablona)", included: true },
  { text: "CSV izvoz podataka", included: true },
  { text: "Napredna statistika i trendovi", included: true },
  { text: "Premium značka na profilu", included: true },
  { text: "Prioritetna podrška", included: true },
];

export default function PremiumPage({ user }) {
  const navigate = useNavigate();
  const [selectedPlan, setSelectedPlan] = useState("yearly");
  const [loading, setLoading] = useState(false);
  const [subStatus, setSubStatus] = useState(null);
  const [plans, setPlans] = useState(null);

  useEffect(() => {
    loadStatus();
  }, []);

  const loadStatus = async () => {
    try {
      const res = await fetchWithAuth(`${API}/subscription/status`);
      if (res.ok) {
        const data = await res.json();
        setSubStatus(data);
        setPlans(data.plans);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCheckout = async () => {
    setLoading(true);
    try {
      const res = await fetchWithAuth(`${API}/subscription/checkout`, {
        method: "POST",
        body: JSON.stringify({
          plan_id: selectedPlan,
          origin_url: window.location.origin,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        window.location.href = data.url;
      } else {
        const err = await res.json();
        toast.error(err.detail || "Greška pri kreiranju plaćanja");
      }
    } catch (err) {
      toast.error("Greška pri povezivanju sa Stripe");
    } finally {
      setLoading(false);
    }
  };

  if (subStatus?.is_premium) {
    return (
      <AppLayout user={user}>
        <div data-testid="premium-active-page" className="max-w-2xl mx-auto text-center space-y-6">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
            <div className="text-6xl mb-4">👑</div>
            <h1 className="font-heading text-3xl font-bold text-[#2D3A3A]">Ti si Premium korisnik!</h1>
            <p className="text-[#5C6B6B] mt-2">Uživaj u svim pogodnostima bez ograničenja.</p>
          </motion.div>
          <div className="card-soft p-6">
            <p className="text-sm text-[#8A9999]">Plan: <span className="font-medium text-[#2D3A3A]">{subStatus.subscription?.plan_id === "yearly" ? "Godišnji" : "Mesečni"}</span></p>
            {subStatus.subscription?.expires_at && (
              <p className="text-sm text-[#8A9999] mt-1">
                Važi do: <span className="font-medium text-[#2D3A3A]">
                  {new Date(subStatus.subscription.expires_at).toLocaleDateString("sr-Latn-RS", { day: "numeric", month: "long", year: "numeric" })}
                </span>
              </p>
            )}
          </div>
          <button
            data-testid="go-dashboard-btn"
            onClick={() => navigate("/dashboard")}
            className="btn-primary-soft"
          >
            Idi na Početnu
          </button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout user={user}>
      <div data-testid="premium-page" className="max-w-4xl mx-auto space-y-10">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
          <div className="inline-flex items-center gap-2 bg-[#FDF8F4] rounded-full px-4 py-1.5 text-sm text-[#E09F7D] font-medium mb-4">
            <Crown className="w-4 h-4" /> Premium
          </div>
          <h1 className="font-heading text-3xl md:text-4xl font-light text-[#2D3A3A]">
            Otključaj <span className="font-bold text-[#4A6C6F]">puni potencijal</span>
          </h1>
          <p className="text-[#5C6B6B] mt-3 max-w-lg mx-auto">
            Neograničeni AI saveti, sve kartice za deljenje, CSV izvoz i mnogo više.
          </p>
        </motion.div>

        {/* Plan selector */}
        <div className="flex justify-center gap-4">
          <button
            data-testid="plan-monthly-btn"
            onClick={() => setSelectedPlan("monthly")}
            className={`px-6 py-3 rounded-full text-sm font-medium transition-all ${
              selectedPlan === "monthly"
                ? "bg-[#4A6C6F] text-white shadow-lg"
                : "bg-white border border-[#EBEBE8] text-[#5C6B6B] hover:bg-[#F2F4F0]"
            }`}
          >
            Mesečno
          </button>
          <button
            data-testid="plan-yearly-btn"
            onClick={() => setSelectedPlan("yearly")}
            className={`px-6 py-3 rounded-full text-sm font-medium transition-all relative ${
              selectedPlan === "yearly"
                ? "bg-[#4A6C6F] text-white shadow-lg"
                : "bg-white border border-[#EBEBE8] text-[#5C6B6B] hover:bg-[#F2F4F0]"
            }`}
          >
            Godišnje
            <span className="absolute -top-2 -right-2 bg-[#E09F7D] text-white text-[10px] px-2 py-0.5 rounded-full font-bold">-30%</span>
          </button>
        </div>

        {/* Pricing cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Free */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="card-soft p-8"
          >
            <h3 className="font-heading text-xl font-medium text-[#2D3A3A] mb-1">Besplatno</h3>
            <p className="text-sm text-[#8A9999] mb-6">Osnovne funkcije</p>
            <p className="text-4xl font-heading font-bold text-[#2D3A3A] mb-8">0 <span className="text-sm font-normal text-[#8A9999]">RSD/mesec</span></p>
            <div className="space-y-3">
              {FEATURES_FREE.map((f, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center ${f.included ? "bg-[#D6E0D6]" : "bg-[#F2F4F0]"}`}>
                    {f.included ? (
                      <Check className="w-3 h-3 text-[#4A6C6F]" strokeWidth={2} />
                    ) : (
                      <span className="w-2 h-0.5 bg-[#8A9999] rounded" />
                    )}
                  </div>
                  <span className={`text-sm ${f.included ? "text-[#2D3A3A]" : "text-[#8A9999] line-through"}`}>{f.text}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Premium */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="card-soft p-8 ring-2 ring-[#4A6C6F] relative"
          >
            <div className="absolute -top-3 left-8 bg-[#4A6C6F] text-white text-xs px-3 py-1 rounded-full font-medium">
              Preporučeno
            </div>
            <h3 className="font-heading text-xl font-medium text-[#2D3A3A] mb-1 flex items-center gap-2">
              Premium <Crown className="w-5 h-5 text-[#E09F7D]" />
            </h3>
            <p className="text-sm text-[#8A9999] mb-6">Sve funkcije bez ograničenja</p>
            <p className="text-4xl font-heading font-bold text-[#2D3A3A] mb-2">
              {selectedPlan === "monthly" ? "500" : "350"}
              <span className="text-sm font-normal text-[#8A9999]"> RSD/mesec</span>
            </p>
            {selectedPlan === "yearly" && (
              <p className="text-xs text-[#E09F7D] font-medium mb-6">4.200 RSD godišnje (umesto 6.000)</p>
            )}
            {selectedPlan === "monthly" && <div className="mb-6" />}
            <div className="space-y-3 mb-8">
              {FEATURES_PREMIUM.map((f, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full flex items-center justify-center bg-[#D6E0D6]">
                    <Check className="w-3 h-3 text-[#4A6C6F]" strokeWidth={2} />
                  </div>
                  <span className="text-sm text-[#2D3A3A]">{f.text}</span>
                </div>
              ))}
            </div>
            <button
              data-testid="checkout-btn"
              onClick={handleCheckout}
              disabled={loading}
              className="btn-primary-soft w-full text-base py-4 flex items-center justify-center gap-2"
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Učitavam...</>
              ) : (
                <><Zap className="w-4 h-4" /> Nadogradi na Premium</>
              )}
            </button>
          </motion.div>
        </div>

        {/* Premium features showcase */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: Sparkles, title: "AI Saveti", desc: "Neograničeni personalizovani saveti" },
            { icon: Image, title: "Sve Kartice", desc: "4 šablona za Instagram Stories" },
            { icon: Download, title: "CSV Izvoz", desc: "Preuzmi sve podatke" },
            { icon: BarChart3, title: "Statistika+", desc: "Napredni grafici i trendovi" },
          ].map((feat, i) => (
            <motion.div
              key={feat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.1 }}
              className="card-soft p-5 text-center"
            >
              <div className="w-10 h-10 bg-[#FDF8F4] rounded-2xl flex items-center justify-center mx-auto mb-3">
                <feat.icon className="w-5 h-5 text-[#E09F7D]" strokeWidth={1.5} />
              </div>
              <h4 className="text-sm font-medium text-[#2D3A3A]">{feat.title}</h4>
              <p className="text-xs text-[#8A9999] mt-1">{feat.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
