import { NavLink, useNavigate } from "react-router-dom";
import { Leaf, LayoutDashboard, Smile, Calendar, BarChart3, User, LogOut, Share2 } from "lucide-react";
import { API } from "@/lib/api";

const navItems = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Početna" },
  { to: "/mood", icon: Smile, label: "Novo Raspoloženje" },
  { to: "/calendar", icon: Calendar, label: "Kalendar" },
  { to: "/statistics", icon: BarChart3, label: "Statistika" },
  { to: "/profile", icon: User, label: "Profil" },
];

export default function AppLayout({ children, user }) {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await fetch(`${API}/auth/logout`, { method: 'POST', credentials: 'include' });
    navigate('/', { replace: true });
  };

  return (
    <div className="min-h-screen bg-[#F9F9F7] flex">
      {/* Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-[#EBEBE8] p-6">
        <div className="flex items-center gap-3 mb-10">
          <div className="w-9 h-9 bg-[#4A6C6F] rounded-full flex items-center justify-center">
            <Leaf className="w-4 h-4 text-white" strokeWidth={1.5} />
          </div>
          <span className="font-heading text-lg text-[#2D3A3A] font-light">umiri.me</span>
        </div>

        <nav className="flex-1 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              data-testid={`nav-${item.to.slice(1)}`}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-2xl text-sm transition-all duration-200 ${
                  isActive
                    ? "bg-[#D6E0D6] text-[#2D3A3A] font-medium"
                    : "text-[#5C6B6B] hover:bg-[#F2F4F0]"
                }`
              }
            >
              <item.icon className="w-5 h-5" strokeWidth={1.5} />
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* User info */}
        <div className="mt-auto pt-6 border-t border-[#EBEBE8]">
          <div className="flex items-center gap-3 mb-4">
            {user?.picture ? (
              <img src={user.picture} alt="" className="w-9 h-9 rounded-full" />
            ) : (
              <div className="w-9 h-9 bg-[#D6E0D6] rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-[#4A6C6F]" />
              </div>
            )}
            <div className="overflow-hidden">
              <p className="text-sm font-medium text-[#2D3A3A] truncate">{user?.name}</p>
              <p className="text-xs text-[#8A9999] truncate">{user?.email}</p>
            </div>
          </div>
          <button
            data-testid="logout-btn"
            onClick={handleLogout}
            className="flex items-center gap-2 text-sm text-[#8A9999] hover:text-[#D66A6A] transition-colors"
          >
            <LogOut className="w-4 h-4" strokeWidth={1.5} />
            Odjavi se
          </button>
        </div>
      </aside>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-[#EBEBE8] z-50 flex justify-around py-2 px-2">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            data-testid={`mobile-nav-${item.to.slice(1)}`}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl text-xs transition-all ${
                isActive ? "text-[#4A6C6F] font-medium" : "text-[#8A9999]"
              }`
            }
          >
            <item.icon className="w-5 h-5" strokeWidth={1.5} />
            <span className="text-[10px]">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Main content */}
      <main className="flex-1 pb-20 md:pb-0 overflow-y-auto">
        <div className="max-w-5xl mx-auto p-6 md:p-12">
          {children}
        </div>
      </main>
    </div>
  );
}
