import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { API } from "@/lib/api";
import { Leaf } from "lucide-react";

export default function MagicLinkCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const hasProcessed = useRef(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const verify = async () => {
      const token = searchParams.get('token');
      if (!token) {
        navigate('/', { replace: true });
        return;
      }

      try {
        const response = await fetch(`${API}/auth/magic-link/verify`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.detail || "Nevažeći link");
        }

        const user = await response.json();
        navigate('/dashboard', { replace: true, state: { user } });
      } catch (err) {
        setError(err.message);
      }
    };

    verify();
  }, [navigate, searchParams]);

  if (error) {
    return (
      <div className="min-h-screen bg-[#F9F9F7] flex items-center justify-center px-6">
        <div className="text-center max-w-sm">
          <div className="w-12 h-12 bg-[#4A6C6F] rounded-full flex items-center justify-center mx-auto mb-4">
            <Leaf className="w-6 h-6 text-white" strokeWidth={1.5} />
          </div>
          <p className="text-[#2D3A3A] font-medium mb-2">Link nije validan</p>
          <p className="text-sm text-[#5C6B6B] mb-6">{error}</p>
          <button
            onClick={() => navigate('/', { replace: true })}
            className="px-6 py-3 bg-[#4A6C6F] text-white rounded-2xl text-sm font-medium hover:bg-[#3D5C5F] transition-colors"
          >
            Nazad na početnu
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9F9F7] flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 bg-[#4A6C6F] rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
          <Leaf className="w-6 h-6 text-white" strokeWidth={1.5} />
        </div>
        <p className="text-[#5C6B6B] font-body">Prijavljivanje...</p>
      </div>
    </div>
  );
}
