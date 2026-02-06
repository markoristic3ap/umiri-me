import "@/App.css";
import { BrowserRouter, Routes, Route, useLocation, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/sonner";
import Landing from "@/pages/Landing";
import AuthCallback from "@/pages/AuthCallback";
import Dashboard from "@/pages/Dashboard";
import MoodEntry from "@/pages/MoodEntry";
import CalendarView from "@/pages/CalendarView";
import Statistics from "@/pages/Statistics";
import Profile from "@/pages/Profile";
import ShareCard from "@/pages/ShareCard";
import PremiumPage from "@/pages/PremiumPage";
import PaymentSuccess from "@/pages/PaymentSuccess";
import WeeklyReport from "@/pages/WeeklyReport";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

function ProtectedRoute({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const [user, setUser] = useState(null);
  const location = useLocation();

  useEffect(() => {
    if (location.state?.user) {
      setUser(location.state.user);
      setIsAuthenticated(true);
      return;
    }
    const checkAuth = async () => {
      try {
        const response = await fetch(`${API}/auth/me`, { credentials: 'include' });
        if (!response.ok) throw new Error('Not authenticated');
        const userData = await response.json();
        setUser(userData);
        setIsAuthenticated(true);
      } catch {
        setIsAuthenticated(false);
      }
    };
    checkAuth();
  }, [location.state]);

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-[#F9F9F7] flex items-center justify-center">
        <div className="animate-pulse-soft text-6xl">😌</div>
      </div>
    );
  }
  if (!isAuthenticated) return <Navigate to="/" replace />;
  return typeof children === 'function' ? children({ user }) : children;
}

function AppRouter() {
  const location = useLocation();
  // REMINDER: Check for session_id synchronously during render
  if (location.hash?.includes('session_id=')) {
    return <AuthCallback />;
  }

  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/dashboard" element={
        <ProtectedRoute>{({ user }) => <Dashboard user={user} />}</ProtectedRoute>
      } />
      <Route path="/mood" element={
        <ProtectedRoute>{({ user }) => <MoodEntry user={user} />}</ProtectedRoute>
      } />
      <Route path="/calendar" element={
        <ProtectedRoute>{({ user }) => <CalendarView user={user} />}</ProtectedRoute>
      } />
      <Route path="/statistics" element={
        <ProtectedRoute>{({ user }) => <Statistics user={user} />}</ProtectedRoute>
      } />
      <Route path="/profile" element={
        <ProtectedRoute>{({ user }) => <Profile user={user} />}</ProtectedRoute>
      } />
      <Route path="/share" element={
        <ProtectedRoute>{({ user }) => <ShareCard user={user} />}</ProtectedRoute>
      } />
      <Route path="/premium" element={
        <ProtectedRoute>{({ user }) => <PremiumPage user={user} />}</ProtectedRoute>
      } />
      <Route path="/premium/success" element={
        <ProtectedRoute>{() => <PaymentSuccess />}</ProtectedRoute>
      } />
      <Route path="/weekly-report" element={
        <ProtectedRoute>{({ user }) => <WeeklyReport user={user} />}</ProtectedRoute>
      } />
    </Routes>
  );
}

function App() {
  return (
    <div className="font-body">
      <Toaster position="top-center" richColors />
      <BrowserRouter>
        <AppRouter />
      </BrowserRouter>
    </div>
  );
}

export default App;
