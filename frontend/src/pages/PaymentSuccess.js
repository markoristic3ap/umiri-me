import { useEffect, useState, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { API, fetchWithAuth } from "@/lib/api";

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState("checking");
  const hasPolled = useRef(false);
  const sessionId = searchParams.get("session_id");

  useEffect(() => {
    if (!sessionId || hasPolled.current) return;
    hasPolled.current = true;
    pollStatus(sessionId, 0);
  }, [sessionId]);

  const pollStatus = async (sid, attempts) => {
    const maxAttempts = 5;
    const pollInterval = 2000;

    if (attempts >= maxAttempts) {
      setStatus("timeout");
      return;
    }

    try {
      const res = await fetchWithAuth(`${API}/subscription/checkout/status/${sid}`);
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();

      if (data.payment_status === "paid") {
        setStatus("success");
        return;
      } else if (data.status === "expired") {
        setStatus("expired");
        return;
      }

      setStatus("processing");
      setTimeout(() => pollStatus(sid, attempts + 1), pollInterval);
    } catch {
      setStatus("error");
    }
  };

  return (
    <div className="min-h-screen bg-[#F9F9F7] flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="card-soft p-12 max-w-md w-full text-center"
      >
        {status === "checking" || status === "processing" ? (
          <>
            <Loader2 className="w-12 h-12 text-[#4A6C6F] animate-spin mx-auto mb-4" />
            <h2 className="font-heading text-2xl font-bold text-[#2D3A3A] mb-2">Obrađujem plaćanje...</h2>
            <p className="text-sm text-[#8A9999]">Molim te sačekaj dok potvrdimo tvoje plaćanje</p>
          </>
        ) : status === "success" ? (
          <>
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="font-heading text-2xl font-bold text-[#2D3A3A] mb-2">Dobrodošao/la u Premium!</h2>
            <p className="text-sm text-[#5C6B6B] mb-6">Tvoja pretplata je aktivirana. Uživaj u svim pogodnostima!</p>
            <button
              data-testid="go-dashboard-after-payment"
              onClick={() => navigate("/dashboard")}
              className="btn-primary-soft"
            >
              Idi na Početnu
            </button>
          </>
        ) : status === "timeout" ? (
          <>
            <div className="text-6xl mb-4">⏳</div>
            <h2 className="font-heading text-2xl font-bold text-[#2D3A3A] mb-2">Čeka se potvrda</h2>
            <p className="text-sm text-[#8A9999] mb-6">Plaćanje se još obrađuje. Proverite email za potvrdu.</p>
            <button onClick={() => navigate("/dashboard")} className="btn-primary-soft">
              Idi na Početnu
            </button>
          </>
        ) : (
          <>
            <div className="text-6xl mb-4">😔</div>
            <h2 className="font-heading text-2xl font-bold text-[#2D3A3A] mb-2">Greška pri plaćanju</h2>
            <p className="text-sm text-[#8A9999] mb-6">Nešto je pošlo naopako. Pokušaj ponovo.</p>
            <button onClick={() => navigate("/premium")} className="btn-primary-soft">
              Pokušaj ponovo
            </button>
          </>
        )}
      </motion.div>
    </div>
  );
}
