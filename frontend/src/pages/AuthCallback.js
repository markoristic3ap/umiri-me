import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { API } from "@/lib/api";

export default function AuthCallback() {
  const navigate = useNavigate();
  const hasProcessed = useRef(false);

  useEffect(() => {
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const processAuth = async () => {
      const hash = window.location.hash;
      const sessionId = new URLSearchParams(hash.substring(1)).get('session_id');
      
      if (!sessionId) {
        navigate('/', { replace: true });
        return;
      }

      try {
        const response = await fetch(`${API}/auth/session`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ session_id: sessionId }),
        });

        if (!response.ok) throw new Error('Auth failed');
        const user = await response.json();
        navigate('/dashboard', { replace: true, state: { user } });
      } catch (err) {
        console.error('Auth error:', err);
        navigate('/', { replace: true });
      }
    };

    processAuth();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-[#F9F9F7] flex items-center justify-center">
      <div className="text-center">
        <div className="text-6xl mb-4 animate-pulse-soft">😌</div>
        <p className="text-[#5C6B6B] font-body">Prijavljivanje...</p>
      </div>
    </div>
  );
}
