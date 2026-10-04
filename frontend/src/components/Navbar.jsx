import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";
import { useAppContext } from "../AppContext";
import { Moon, Sun, ChevronDown, Calendar, LogOut, Lock, Unlock, BarChart3, Menu, X } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { api } from "../api";

export default function Navbar() {
  const { user, logout, setUser } = useAuth();
  const { semester, setSemester, darkMode, setDarkMode, shortcutsEnabled, setShortcutsEnabled } = useAppContext();
  
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [semOpen, setSemOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const userRef = useRef(null);
  const semRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    function handleClickOutside(e) {
      if (userRef.current && !userRef.current.contains(e.target)) setUserMenuOpen(false);
      if (semRef.current && !semRef.current.contains(e.target)) setSemOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    // Close mobile menu when navigating
    setMobileMenuOpen(false);
  }, [navigate]);

  async function updateExamDate(e) {
    const val = e.target.value;
    try {
      await api("/me", "PUT", { exam_date: val });
      setUser({ ...user, exam_date: val });
    } catch (err) {
      console.error("Failed to update exam date", err);
    }
  }

  async function togglePrivacy() {
    try {
      const isPriv = !user.is_private;
      await api("/me", "PUT", { is_private: isPriv });
      setUser({ ...user, is_private: isPriv });
    } catch (err) {
      console.error("Failed to update privacy", err);
    }
  }

  return (
    <nav className="sticky top-0 z-50 bg-white/80 dark:bg-[#0a0a0a]/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Left: Branding & User Menu */}
          <div className="flex items-center gap-6">
            {user ? (
              <div className="relative" ref={userRef}>
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="text-[15px] font-semibold text-black dark:text-white hover:opacity-80 transition-opacity flex items-center gap-1.5"
                >
                  Hello, {user.username}
                  <ChevronDown size={14} className={`text-gray-400 transition-transform duration-200 ${userMenuOpen ? "rotate-180" : ""}`} />
                </button>

                {userMenuOpen && (
                  <div className="absolute top-full left-0 mt-2 w-64 bg-white dark:bg-[#0a0a0a] border border-gray-200 dark:border-gray-800 rounded-lg shadow-lg py-2 z-50">
                    <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-800">
                      <p className="text-sm font-medium text-black dark:text-white">{user.username}</p>
                      <p className="text-xs text-gray-400">{user.email}</p>
                    </div>

                    <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
                      <label className="flex items-center gap-2 text-xs font-medium text-gray-500 mb-1">
                        <Calendar size={12} /> Target Exam Date
                      </label>
                      <input
                        type="date"
                        value={user.exam_date || ""}
                        onChange={updateExamDate}
                        className="w-full bg-gray-50 dark:bg-[#111] text-sm text-black dark:text-white border border-gray-200 dark:border-gray-700 rounded px-2 py-1 focus:outline-none focus:border-black dark:focus:border-white [color-scheme:light] dark:[color-scheme:dark]"
                      />
                    </div>

                    <button
                      onClick={() => { setUserMenuOpen(false); navigate("/stats"); }}
                      className="w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#111] transition-colors flex items-center gap-3"
                    >
                      <BarChart3 size={15} className="text-gray-400" />
                      Study Graph
                    </button>

                    <button
                      onClick={() => setShortcutsEnabled(!shortcutsEnabled)}
                      className="w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#111] transition-colors flex items-center justify-between"
                    >
                      <span>Shortcuts Sidebar</span>
                      <span className="text-xs font-semibold text-gray-400">{shortcutsEnabled ? "ON" : "OFF"}</span>
                    </button>

                    <button
                      onClick={togglePrivacy}
                      className="w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#111] transition-colors flex items-center gap-3 rounded-b-lg"
                    >
                      {user.is_private ? (
                        <><Lock size={15} className="text-gray-400" /> Private (Hidden on LB)</>
                      ) : (
                        <><Unlock size={15} className="text-gray-400" /> Public Account</>
                      )}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link to="/" className="text-[15px] font-semibold text-black dark:text-white">StudyFlow</Link>
            )}
          </div>

          {/* Desktop Center: Nav links & Semester */}
          {user && (
            <div className="hidden md:flex items-center gap-8 text-[15px]">
              <div className="flex gap-5">
                <NavLink to="/dashboard" className={({isActive}) => isActive ? "font-medium text-black dark:text-white" : "text-gray-500 hover:text-black dark:text-gray-400 dark:hover:text-white transition-colors"}>Dashboard</NavLink>
                <NavLink to="/todos" className={({isActive}) => isActive ? "font-medium text-black dark:text-white" : "text-gray-500 hover:text-black dark:text-gray-400 dark:hover:text-white transition-colors"}>Todos</NavLink>
                <NavLink to="/focus" className={({isActive}) => isActive ? "font-medium text-black dark:text-white" : "text-gray-500 hover:text-black dark:text-gray-400 dark:hover:text-white transition-colors"}>Pomodoro</NavLink>
                <NavLink to="/leaderboard" className={({isActive}) => isActive ? "font-medium text-black dark:text-white" : "text-gray-500 hover:text-black dark:text-gray-400 dark:hover:text-white transition-colors"}>Leaderboard</NavLink>
                <NavLink to="/akhanda-mode" className={({isActive}) => isActive ? "font-medium text-black dark:text-white" : "text-gray-500 hover:text-black dark:text-gray-400 dark:hover:text-white transition-colors"}>AI</NavLink>
              </div>
              
              <div className="relative" ref={semRef}>
                <button
                  onClick={() => setSemOpen(!semOpen)}
                  className="flex items-center gap-2 bg-gray-100 dark:bg-[#111] text-black dark:text-white hover:bg-gray-200 dark:hover:bg-[#1a1a1a] border border-transparent dark:border-gray-800 px-3 py-1.5 rounded-md transition-colors text-sm font-medium"
                >
                  <span className="text-gray-400 dark:text-gray-500 text-xs uppercase tracking-wider font-semibold">Sem</span>
                  {semester}
                  <ChevronDown size={14} className={`text-gray-400 transition-transform duration-200 ${semOpen ? "rotate-180" : ""}`} />
                </button>
                
                {semOpen && (
                  <div className="absolute top-full mt-2 w-36 bg-white dark:bg-[#0a0a0a] border border-gray-200 dark:border-gray-800 rounded-lg shadow-lg py-1 left-1/2 -translate-x-1/2">
                    {[1,2,3,4,5,6,7,8].map(s => (
                      <button
                        key={s}
                        onClick={() => { setSemester(s); setSemOpen(false); }}
                        className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                          semester === s 
                          ? "bg-gray-100 dark:bg-[#1a1a1a] font-medium text-black dark:text-white" 
                          : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#111]"
                        }`}
                      >
                        Semester {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Right: Theme toggle + Auth + Mobile Toggle */}
          <div className="flex items-center gap-4 text-sm">
            <button 
              onClick={() => setDarkMode(!darkMode)} 
              className="text-gray-400 hover:text-black dark:hover:text-white transition-transform duration-300 hover:rotate-12"
              aria-label="Toggle theme"
            >
              {darkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            
            <div className="hidden md:flex items-center gap-5">
              {user ? (
                <button
                  onClick={() => logout()}
                  className="flex items-center gap-1 text-gray-500 hover:text-red-500 dark:hover:text-red-400 transition-colors font-medium"
                >
                  <LogOut size={16} /> Logout
                </button>
              ) : (
                <>
                  <NavLink to="/login" className="text-gray-500 hover:text-black dark:text-gray-400 dark:hover:text-white font-medium">Login</NavLink>
                  <NavLink to="/register" className="font-medium text-black dark:text-white hover:underline">Register</NavLink>
                </>
              )}
            </div>

            {/* Mobile menu button */}
            <button 
              className="md:hidden p-1 text-gray-500 hover:text-black dark:hover:text-white"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200 dark:border-gray-800 space-y-4">
            {user ? (
              <>
                <div className="flex flex-col gap-3">
                  <NavLink onClick={() => setMobileMenuOpen(false)} to="/dashboard" className={({isActive}) => isActive ? "font-medium text-black dark:text-white" : "text-gray-500"}>Dashboard</NavLink>
                  <NavLink onClick={() => setMobileMenuOpen(false)} to="/todos" className={({isActive}) => isActive ? "font-medium text-black dark:text-white" : "text-gray-500"}>Todos</NavLink>
                  <NavLink onClick={() => setMobileMenuOpen(false)} to="/focus" className={({isActive}) => isActive ? "font-medium text-black dark:text-white" : "text-gray-500"}>Pomodoro</NavLink>
                  <NavLink onClick={() => setMobileMenuOpen(false)} to="/leaderboard" className={({isActive}) => isActive ? "font-medium text-black dark:text-white" : "text-gray-500"}>Leaderboard</NavLink>
                  <NavLink onClick={() => setMobileMenuOpen(false)} to="/akhanda-mode" className={({isActive}) => isActive ? "font-medium text-black dark:text-white" : "text-gray-500"}>AI</NavLink>
                </div>
                
                <div className="pt-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-500">Semester</span>
                  <select 
                    value={semester} 
                    onChange={(e) => setSemester(Number(e.target.value))}
                    className="bg-gray-100 dark:bg-[#111] text-black dark:text-white text-sm rounded px-2 py-1 outline-none"
                  >
                    {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>Semester {s}</option>)}
                  </select>
                </div>

                <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
                  <button
                    onClick={() => logout()}
                    className="flex items-center gap-1 text-red-500 transition-colors font-medium text-sm"
                  >
                    <LogOut size={16} /> Logout
                  </button>
                </div>
              </>
            ) : (
              <div className="flex flex-col gap-3">
                <NavLink onClick={() => setMobileMenuOpen(false)} to="/login" className="text-gray-500 font-medium">Login</NavLink>
                <NavLink onClick={() => setMobileMenuOpen(false)} to="/register" className="font-medium text-black dark:text-white">Register</NavLink>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
