import { useState, useEffect } from "react";
import { useAppContext } from "../AppContext";

export default function Focus() {
  const { 
    focusMinutes, 
    breakMinutes,
    timerMode,
    focusLeft, 
    focusRunning, 
    focusStats,
    toggleFocus, 
    resetFocus, 
    applyFocusMinutes,
    loadStats
  } = useAppContext();
  
  const [inputMin, setInputMin] = useState(String(focusMinutes));
  const [inputBreak, setInputBreak] = useState(String(breakMinutes));

  // Sync local input with global state if it changes externally
  useEffect(() => {
    setInputMin(String(focusMinutes));
    setInputBreak(String(breakMinutes));
  }, [focusMinutes, breakMinutes]);

  useEffect(() => {
    loadStats();
  }, []);

  // Make it interactive: update globally after a short delay to avoid resetting on every keystroke
  useEffect(() => {
    const f = parseInt(inputMin) || 1;
    const b = parseInt(inputBreak) || 1;
    if (f !== focusMinutes || b !== breakMinutes) {
      const timeout = setTimeout(() => {
        applyFocusMinutes(f, b);
      }, 500);
      return () => clearTimeout(timeout);
    }
  }, [inputMin, inputBreak, focusMinutes, breakMinutes, applyFocusMinutes]);

  const mm = String(Math.floor(focusLeft / 60)).padStart(2, "0");
  const ss = String(focusLeft % 60).padStart(2, "0");

  return (
    <div className="max-w-sm space-y-10">
      <div className="flex items-center gap-3">
        <h1 className="text-xl font-semibold text-black dark:text-white">Pomodoro Timer</h1>
        <span className={`px-2 py-0.5 text-xs font-bold uppercase tracking-wider rounded ${
          timerMode === "focus" 
            ? "bg-black text-white dark:bg-white dark:text-black" 
            : "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
        }`}>
          {timerMode === "focus" ? "Focusing" : "On Break"}
        </span>
      </div>

      <div className="space-y-6">
        <p className="text-7xl font-bold tracking-tight tabular-nums text-black dark:text-white">
          {mm}:{ss}
        </p>

        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3 text-sm">
            <label className="text-gray-500 dark:text-gray-400 w-12">Focus:</label>
            <input
              type="number"
              min="1"
              value={inputMin}
              onChange={(e) => setInputMin(e.target.value)}
              disabled={focusRunning}
              className="w-16 bg-transparent text-black dark:text-white border border-gray-300 dark:border-gray-700 px-2 py-1 text-sm text-center focus:outline-none focus:border-black dark:focus:border-white disabled:opacity-40"
            />
            <span className="text-gray-500 dark:text-gray-400">min</span>
          </div>
          
          <div className="flex items-center gap-3 text-sm">
            <label className="text-gray-500 dark:text-gray-400 w-12">Break:</label>
            <input
              type="number"
              min="1"
              value={inputBreak}
              onChange={(e) => setInputBreak(e.target.value)}
              disabled={focusRunning}
              className="w-16 bg-transparent text-black dark:text-white border border-gray-300 dark:border-gray-700 px-2 py-1 text-sm text-center focus:outline-none focus:border-black dark:focus:border-white disabled:opacity-40"
            />
            <span className="text-gray-500 dark:text-gray-400">min</span>
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            onClick={toggleFocus}
            className={`text-sm px-6 py-2 transition-colors font-medium ${
              focusRunning
                ? "bg-white text-black border border-black dark:bg-[#0a0a0a] dark:text-white dark:border-white"
                : "bg-black text-white dark:bg-white dark:text-black"
            }`}
          >
            {focusRunning ? "Pause" : "Start"}
          </button>
          <button
            onClick={resetFocus}
            className="text-sm text-gray-500 hover:text-black dark:text-gray-400 dark:hover:text-white px-4 py-2 border border-gray-200 dark:border-gray-800 hover:border-black dark:hover:border-white transition-colors"
          >
            Reset
          </button>
        </div>
      </div>

      <div className="border-t border-gray-200 dark:border-gray-800 pt-6 grid grid-cols-3 gap-6 text-center">
        <div>
          <p className="text-2xl font-semibold text-black dark:text-white">{focusStats.today_minutes ?? 0}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">today</p>
        </div>
        <div>
          <p className="text-2xl font-semibold text-black dark:text-white">{focusStats.total_minutes ?? 0}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">total mins</p>
        </div>
        <div>
          <p className="text-2xl font-semibold text-black dark:text-white">{focusStats.sessions ?? focusStats.total_sessions ?? 0}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">sessions</p>
        </div>
      </div>
    </div>
  );
}
