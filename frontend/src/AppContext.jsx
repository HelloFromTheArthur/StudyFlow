import { createContext, useContext, useState, useEffect, useRef } from "react";
import { api } from "./api";
import { useAuth } from "./AuthContext";

const AppCtx = createContext(null);
export const useAppContext = () => useContext(AppCtx);

export function AppProvider({ children }) {
  const { user } = useAuth();
  
  const [semester, setSemester] = useState(() => {
    const saved = localStorage.getItem("global_semester");
    return saved ? parseInt(saved) : 1;
  });

  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem("theme") === "dark";
  });

  const [shortcutsEnabled, setShortcutsEnabled] = useState(() => {
    return localStorage.getItem("shortcuts_enabled") !== "false";
  });

  // Load Pomodoro Settings
  const [focusMinutes, setFocusMinutes] = useState(60);
  const [breakMinutes, setBreakMinutes] = useState(10);
  const [timerMode, setTimerMode] = useState("focus");
  
  // Load Persisted Timer State
  const [focusLeft, setFocusLeft] = useState(60 * 60);
  const [focusRunning, setFocusRunning] = useState(false);
  const [focusStats, setFocusStats] = useState({ total_minutes: 0, sessions: 0, today_minutes: 0 });
  
  const endAt = useRef(0);
  const timerRef = useRef(null);
  const lastLoggedLeft = useRef(60 * 60);
  const loadedUserIdRef = useRef(null);

  const saveState = (r, l, end, last, m = timerMode) => {
    // Only save to backend if user is logged in AND their specific state has finished loading
    if (!user || loadedUserIdRef.current !== user.id) return; 
    
    const payload = JSON.stringify({
      running: r, left: l, endAt: end, lastLogged: last, mode: m, focus: focusMinutes, break: breakMinutes
    });
    api("/pomodoro_state", "PUT", { 
      user_id: user.id,
      pomodoro_state: payload 
    }).catch(() => {});
  };

  useEffect(() => {
    if (!user) {
      loadedUserIdRef.current = null;
      setFocusRunning(false);
      return;
    }
    
    // Mark as unloading while fetching
    loadedUserIdRef.current = null;
    
    api("/pomodoro_state").then(({ pomodoro_state }) => {
      if (pomodoro_state && pomodoro_state !== "{}") {
        const serverState = JSON.parse(pomodoro_state);
        
        if (serverState.focus) setFocusMinutes(serverState.focus);
        if (serverState.break) setBreakMinutes(serverState.break);
        
        if (serverState.running) {
          endAt.current = serverState.endAt;
          setFocusRunning(serverState.endAt > Date.now());
          setFocusLeft(Math.max(0, Math.round((serverState.endAt - Date.now()) / 1000)));
        } else {
          setFocusRunning(false);
          setFocusLeft(serverState.left || ((serverState.focus || 60) * 60));
        }
        lastLoggedLeft.current = serverState.lastLogged || serverState.left;
        setTimerMode(serverState.mode || "focus");
      }
      // Successfully loaded this user's state
      loadedUserIdRef.current = user.id;
    }).catch(() => {
      loadedUserIdRef.current = user.id; // allow saves even if it fails to load, so they aren't stuck
    });
  }, [user]);

  const loadStats = () => {
    if (!user) return;
    api("/pomodoro/stats").then(setFocusStats).catch(() => {});
  };

  useEffect(() => {
    localStorage.setItem("global_semester", String(semester));
  }, [semester]);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [darkMode]);

  useEffect(() => {
    loadStats();
  }, []);

  useEffect(() => {
    if (!focusRunning) {
      saveState(false, focusLeft, 0, lastLoggedLeft.current, timerMode);
      return;
    }
    
    saveState(true, focusLeft, endAt.current, lastLoggedLeft.current, timerMode);

    timerRef.current = setInterval(() => {
      const now = Date.now();
      const s = Math.max(0, Math.round((endAt.current - now) / 1000));
      setFocusLeft(s);
      
      // Calculate missed minutes (only if in focus mode, we don't log break minutes)
      if (timerMode === "focus") {
        const minutesPassed = Math.floor((lastLoggedLeft.current - s) / 60);
        if (minutesPassed > 0) {
          lastLoggedLeft.current -= (minutesPassed * 60);
          setFocusStats(prev => ({
            ...prev,
            today_minutes: (prev.today_minutes || 0) + minutesPassed,
            total_minutes: (prev.total_minutes || 0) + minutesPassed
          }));
          api("/pomodoro", "POST", { minutes: minutesPassed, subject_id: null }).catch(console.error);
        }
      }

      saveState(true, s, endAt.current, lastLoggedLeft.current, timerMode);

      if (s === 0) {
        // Auto-switch mode
        clearInterval(timerRef.current);
        const nextMode = timerMode === "focus" ? "break" : "focus";
        const nextMin = nextMode === "focus" ? focusMinutes : breakMinutes;
        
        setTimerMode(nextMode);
        setFocusLeft(nextMin * 60);
        lastLoggedLeft.current = nextMin * 60;
        
        // Restart timer automatically in new mode
        endAt.current = Date.now() + nextMin * 60 * 1000;
        saveState(true, nextMin * 60, endAt.current, nextMin * 60, nextMode);
        
        if (timerMode === "focus") loadStats(); // load stats cleanly when a focus session ends
      }
    }, 500);

    return () => clearInterval(timerRef.current);
  }, [focusRunning, timerMode, focusMinutes, breakMinutes]);

  const toggleFocus = () => {
    if (!focusRunning) {
      endAt.current = Date.now() + focusLeft * 1000;
      // If we just hit play from a fresh state, set lastLogged
      const targetMax = (timerMode === "focus" ? focusMinutes : breakMinutes) * 60;
      if (focusLeft === targetMax) lastLoggedLeft.current = focusLeft;
    }
    setFocusRunning((r) => !r);
  };

  const resetFocus = () => {
    clearInterval(timerRef.current);
    const m = timerMode === "focus" ? focusMinutes : breakMinutes;
    setFocusRunning(false);
    setFocusLeft(m * 60);
    lastLoggedLeft.current = m * 60;
    saveState(false, m * 60, 0, m * 60, timerMode);
  };

  const applyFocusMinutes = (fMin, bMin) => {
    const minF = Math.max(1, fMin);
    const minB = Math.max(1, bMin);
    setFocusMinutes(minF);
    setBreakMinutes(minB);
    
    // Reset to focus mode with new time
    clearInterval(timerRef.current);
    setTimerMode("focus");
    setFocusLeft(minF * 60);
    lastLoggedLeft.current = minF * 60;
    setFocusRunning(false);
    saveState(false, minF * 60, 0, minF * 60, "focus");
  };

  useEffect(() => {
    localStorage.setItem("shortcuts_enabled", String(shortcutsEnabled));
  }, [shortcutsEnabled]);

  return (
    <AppCtx.Provider value={{
      semester, setSemester, 
      darkMode, setDarkMode,
      shortcutsEnabled, setShortcutsEnabled,
      focusMinutes, breakMinutes, timerMode, focusLeft, focusRunning, focusStats,
      toggleFocus, resetFocus, applyFocusMinutes, loadStats
    }}>
      {children}
    </AppCtx.Provider>
  );
}
