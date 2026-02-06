import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Users, Crown, TrendingUp, Calendar, Search, ChevronLeft, ChevronRight, Loader2, Shield, X } from "lucide-react";
import { toast } from "sonner";
import AppLayout from "./AppLayout";
import { API, fetchWithAuth } from "@/lib/api";

export default function AdminPanel({ user }) {
  const [isAdmin, setIsAdmin] = useState(null);
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [grantModal, setGrantModal] = useState(null);
  const [grantDays, setGrantDays] = useState(30);

  useEffect(() => {
    checkAdmin();
  }, []);

  useEffect(() => {
    if (isAdmin) {
      loadStats();
      loadUsers();
    }
  }, [isAdmin, page, search]);

  const checkAdmin = async () => {
    try {
      const res = await fetchWithAuth(`${API}/admin/check`);
      if (res.ok) {
        const data = await res.json();
        setIsAdmin(data.is_admin);
      }
    } catch {
      setIsAdmin(false);
    }
  };

  const loadStats = async () => {
    try {
      const res = await fetchWithAuth(`${API}/admin/stats`);
      if (res.ok) setStats(await res.json());
    } catch {}
  };

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await fetchWithAuth(`${API}/admin/users?limit=20&offset=${page * 20}&search=${encodeURIComponent(search)}`);
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users);
        setTotalUsers(data.total);
      }
    } catch {} finally {
      setLoading(false);
    }
  };

  const handleGrant = async () => {
    if (!grantModal) return;
    try {
      const res = await fetchWithAuth(`${API}/admin/grant-premium`, {
        method: "POST",
        body: JSON.stringify({ user_id: grantModal.user_id, days: grantDays }),
      });
      if (res.ok) {
        const data = await res.json();
        toast.success(data.message);
        setGrantModal(null);
        loadUsers();
        loadStats();
      } else {
        const err = await res.json();
        toast.error(err.detail);
      }
    } catch {
      toast.error("Greška");
    }
  };

  const handleRevoke = async (userId, name) => {
    if (!window.confirm(`Ukinuti Premium za ${name}?`)) return;
    try {
      const res = await fetchWithAuth(`${API}/admin/revoke-premium`, {
        method: "POST",
        body: JSON.stringify({ user_id: userId }),
      });
      if (res.ok) {
        toast.success("Premium ukinut");
        loadUsers();
        loadStats();
      }
    } catch {
      toast.error("Greška");
    }
  };

  if (isAdmin === null) {
    return <AppLayout user={user}><div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-[#4A6C6F]" /></div></AppLayout>;
  }

  if (!isAdmin) {
    return (
      <AppLayout user={user}>
        <div className="max-w-md mx-auto text-center py-20">
          <Shield className="w-16 h-16 text-[#8A9999] mx-auto mb-4" strokeWidth={1} />
          <h1 className="font-heading text-2xl font-bold text-[#2D3A3A] dark:text-[#E8EAE8] mb-2">Admin Pristup</h1>
          <p className="text-sm text-[#8A9999]">Nemate pristup admin panelu. Kontaktirajte administratora.</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout user={user}>
      <div data-testid="admin-panel" className="space-y-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-2 mb-2">
            <Shield className="w-5 h-5 text-[#4A6C6F]" strokeWidth={1.5} />
            <span className="text-xs font-medium text-[#4A6C6F] uppercase tracking-wider">Admin Panel</span>
          </div>
          <h1 className="font-heading text-2xl sm:text-3xl font-light text-[#2D3A3A] dark:text-[#E8EAE8]">
            Upravljanje <span className="font-bold text-[#4A6C6F]">Korisnicima</span>
          </h1>
        </motion.div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            {[
              { label: "Korisnika", value: stats.total_users, icon: Users, color: "#4A6C6F" },
              { label: "Premium", value: stats.paid_subscriptions, icon: Crown, color: "#E09F7D" },
              { label: "Trial", value: stats.trial_subscriptions, icon: TrendingUp, color: "#769F78" },
              { label: "Danas aktivnih", value: stats.today_moods, icon: Calendar, color: "#7CA5B8" },
            ].map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="card-soft p-4 sm:p-6"
                data-testid={`admin-stat-${i}`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <s.icon className="w-4 h-4" style={{ color: s.color }} strokeWidth={1.5} />
                </div>
                <p className="text-2xl font-heading font-bold text-[#2D3A3A] dark:text-[#E8EAE8]">{s.value}</p>
                <p className="text-xs text-[#8A9999]">{s.label}</p>
              </motion.div>
            ))}
          </div>
        )}

        {/* Search */}
        <div className="card-soft p-4 flex items-center gap-3">
          <Search className="w-5 h-5 text-[#8A9999]" strokeWidth={1.5} />
          <input
            data-testid="admin-search"
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            placeholder="Pretraži po imenu ili emailu..."
            className="flex-1 bg-transparent text-sm text-[#2D3A3A] dark:text-[#E8EAE8] placeholder:text-[#8A9999] outline-none"
          />
        </div>

        {/* Users table */}
        <div className="card-soft overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm" data-testid="admin-users-table">
              <thead>
                <tr className="border-b border-[#EBEBE8] dark:border-[#2a3538]">
                  <th className="text-left p-4 text-xs font-medium text-[#8A9999] uppercase tracking-wider">Korisnik</th>
                  <th className="text-left p-4 text-xs font-medium text-[#8A9999] uppercase tracking-wider hidden sm:table-cell">Status</th>
                  <th className="text-left p-4 text-xs font-medium text-[#8A9999] uppercase tracking-wider hidden md:table-cell">Unosa</th>
                  <th className="text-left p-4 text-xs font-medium text-[#8A9999] uppercase tracking-wider hidden md:table-cell">Poslednja Aktivnost</th>
                  <th className="text-right p-4 text-xs font-medium text-[#8A9999] uppercase tracking-wider">Akcije</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.user_id} className="border-b border-[#EBEBE8] dark:border-[#2a3538] last:border-0 hover:bg-[#F2F4F0] dark:hover:bg-[#243030] transition-colors" data-testid={`admin-user-${u.user_id}`}>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        {u.picture ? (
                          <img src={u.picture} alt="" className="w-8 h-8 rounded-full" />
                        ) : (
                          <div className="w-8 h-8 bg-[#D6E0D6] dark:bg-[#2a3a3a] rounded-full flex items-center justify-center text-xs font-medium text-[#4A6C6F]">
                            {u.name?.[0]}
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-[#2D3A3A] dark:text-[#E8EAE8] text-sm">{u.name}</p>
                          <p className="text-xs text-[#8A9999]">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 hidden sm:table-cell">
                      {u.is_premium ? (
                        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                          u.is_trial
                            ? "bg-[#FFF8E1] text-[#E8C170]"
                            : "bg-[#E8F5E9] text-[#769F78]"
                        }`}>
                          {u.is_trial ? "Trial" : "Premium"}
                        </span>
                      ) : (
                        <span className="text-xs px-2.5 py-1 rounded-full bg-[#F2F4F0] text-[#8A9999] font-medium">Besplatno</span>
                      )}
                    </td>
                    <td className="p-4 text-[#5C6B6B] dark:text-[#8A9999] hidden md:table-cell">{u.mood_count}</td>
                    <td className="p-4 text-[#8A9999] text-xs hidden md:table-cell">{u.last_active || "—"}</td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {u.is_premium && !u.is_trial ? (
                          <button
                            data-testid={`revoke-${u.user_id}`}
                            onClick={() => handleRevoke(u.user_id, u.name)}
                            className="text-xs text-[#D66A6A] hover:text-[#b55555] font-medium px-3 py-1.5 rounded-full border border-[#D66A6A]/20 hover:bg-[#FFEBEE] transition-colors"
                          >
                            Ukini
                          </button>
                        ) : (
                          <button
                            data-testid={`grant-${u.user_id}`}
                            onClick={() => { setGrantModal(u); setGrantDays(30); }}
                            className="text-xs text-[#4A6C6F] hover:text-[#365052] font-medium px-3 py-1.5 rounded-full border border-[#4A6C6F]/20 hover:bg-[#D6E0D6]/30 transition-colors"
                          >
                            Dodeli Premium
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-[#8A9999] text-sm">
                      {loading ? "Učitavam..." : "Nema korisnika"}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalUsers > 20 && (
            <div className="flex items-center justify-between p-4 border-t border-[#EBEBE8] dark:border-[#2a3538]">
              <p className="text-xs text-[#8A9999]">{totalUsers} korisnika ukupno</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(Math.max(0, page - 1))}
                  disabled={page === 0}
                  className="w-8 h-8 rounded-full bg-[#F2F4F0] flex items-center justify-center disabled:opacity-30"
                >
                  <ChevronLeft className="w-4 h-4 text-[#5C6B6B]" />
                </button>
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={(page + 1) * 20 >= totalUsers}
                  className="w-8 h-8 rounded-full bg-[#F2F4F0] flex items-center justify-center disabled:opacity-30"
                >
                  <ChevronRight className="w-4 h-4 text-[#5C6B6B]" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Grant Premium Modal */}
      {grantModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="card-soft p-6 sm:p-8 max-w-sm w-full relative"
            data-testid="grant-modal"
          >
            <button onClick={() => setGrantModal(null)} className="absolute top-4 right-4">
              <X className="w-5 h-5 text-[#8A9999]" />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <Crown className="w-6 h-6 text-[#E09F7D]" />
              <h3 className="font-heading text-lg font-bold text-[#2D3A3A] dark:text-[#E8EAE8]">Dodeli Premium</h3>
            </div>

            <div className="mb-4">
              <p className="text-sm text-[#2D3A3A] dark:text-[#E8EAE8] font-medium">{grantModal.name}</p>
              <p className="text-xs text-[#8A9999]">{grantModal.email}</p>
            </div>

            <div className="mb-6">
              <label className="text-sm text-[#5C6B6B] dark:text-[#8A9999] block mb-2">Trajanje (dana)</label>
              <div className="flex gap-2">
                {[7, 30, 90, 365].map(d => (
                  <button
                    key={d}
                    data-testid={`grant-days-${d}`}
                    onClick={() => setGrantDays(d)}
                    className={`px-3 py-2 rounded-full text-xs font-medium transition-all ${
                      grantDays === d
                        ? "bg-[#4A6C6F] text-white"
                        : "bg-[#F2F4F0] dark:bg-[#2a3538] text-[#5C6B6B] dark:text-[#8A9999] hover:bg-[#D6E0D6]"
                    }`}
                  >
                    {d}d
                  </button>
                ))}
              </div>
            </div>

            <button
              data-testid="confirm-grant-btn"
              onClick={handleGrant}
              className="btn-primary-soft w-full py-3 text-sm"
            >
              Dodeli Premium na {grantDays} dana
            </button>
          </motion.div>
        </div>
      )}
    </AppLayout>
  );
}
