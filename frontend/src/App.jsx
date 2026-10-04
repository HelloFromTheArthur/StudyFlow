import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./AuthContext";
import { AppProvider } from "./AppContext";
import { ChatbotProvider } from "./components/Chatbotcontext";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Auth from "./pages/Auth";
import Syllabus from "./pages/Syllabus";
import Todos from "./pages/Todos";
import Focus from "./pages/Focus";
import Leaderboard from "./pages/Leaderboard";
import Stats from "./pages/Stats";
import ChatbotWidget from "./components/ChatbotWidget";
import Shortcut from "./components/Shortcut";
import Chatbot from "./components/Chatbot";

function Private({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="p-10 text-sm text-gray-400 dark:text-gray-500">Loading...</div>;
  return user ? children : <Navigate to="/" replace />;
}

function InnerApp() {
  const { user } = useAuth();
  
  return (
    <div className="min-h-screen relative">
      <Navbar />
      {user && <Shortcut />}
      <main className="max-w-5xl mx-auto px-6 py-10 relative z-10">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Auth mode="login" />} />
          <Route path="/register" element={<Auth mode="register" />} />
          <Route path="/dashboard" element={<Private><Syllabus /></Private>} />
          <Route path="/todos" element={<Private><Todos /></Private>} />
          <Route path="/focus" element={<Private><Focus /></Private>} />
          <Route path="/leaderboard" element={<Private><Leaderboard /></Private>} />
          <Route path="/stats" element={<Private><Stats /></Private>} />
          <Route path="/akhanda-mode" element={<Private><Chatbot /></Private>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      {user && <ChatbotWidget />}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <ChatbotProvider>
          <BrowserRouter>
            <InnerApp />
          </BrowserRouter>
        </ChatbotProvider>
      </AppProvider>
    </AuthProvider>
  );
}
