import { useEffect, useState } from "react";
import { api } from "../api";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useAppContext } from "../AppContext";

export default function Stats() {
  const [history, setHistory] = useState([]);
  const [range, setRange] = useState("week");
  const [error, setError] = useState("");
  const { darkMode } = useAppContext();

  useEffect(() => {
    api(`/pomodoro/history?range=${range}`)
      .then(data => {
        // Format dates nicely for the chart
        const formatted = data.map(d => {
          const dateStr = new Date(d.date + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" });
          return { ...d, displayDate: dateStr };
        });
        setHistory(formatted);
      })
      .catch((e) => setError(e.message));
  }, [range]);

  const textColor = darkMode ? '#a3a3a3' : '#737373';
  const gridColor = darkMode ? '#262626' : '#e5e5e5';
  const barColor = darkMode ? '#ffffff' : '#000000';

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="flex items-baseline justify-between">
        <div>
          <h1 className="text-2xl font-bold text-black dark:text-white">Study Graph</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Minutes focused per day
          </p>
        </div>

        {/* Range selector */}
        <div className="flex gap-1 bg-gray-100 dark:bg-[#111] p-1 rounded-md">
          {[
            { key: "week", label: "7 days" },
            { key: "month", label: "30 days" },
            { key: "all", label: "All time" },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setRange(key)}
              className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                range === key
                  ? "bg-white dark:bg-[#222] text-black dark:text-white shadow-sm"
                  : "text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      {history.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-gray-200 dark:border-gray-800 rounded-lg">
          <p className="text-sm text-gray-400 dark:text-gray-600">
            No study sessions recorded for this period.
          </p>
        </div>
      ) : (
        <>
          {/* Summary */}
          <div className="grid grid-cols-3 gap-6 border border-gray-200 dark:border-gray-800 rounded-lg p-5">
            <div className="text-center">
              <p className="text-2xl font-bold text-black dark:text-white">
                {history.reduce((sum, h) => sum + h.minutes, 0)}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">total mins</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-black dark:text-white">{history.length}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">active days</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-black dark:text-white">
                {Math.round(history.reduce((sum, h) => sum + h.minutes, 0) / history.length)}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">avg mins/day</p>
            </div>
          </div>

          {/* Recharts Bar Chart */}
          <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-6 h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={history} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                <XAxis 
                  dataKey="displayDate" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: textColor, fontSize: 12 }} 
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: textColor, fontSize: 12 }}
                />
                <Tooltip 
                  cursor={{ fill: darkMode ? '#1a1a1a' : '#f3f4f6' }}
                  contentStyle={{ 
                    backgroundColor: darkMode ? '#0a0a0a' : '#ffffff',
                    borderColor: darkMode ? '#262626' : '#e5e5e5',
                    color: darkMode ? '#ffffff' : '#000000',
                    borderRadius: '8px',
                    fontSize: '12px'
                  }}
                  formatter={(value) => [`${value} mins`, 'Focused']}
                />
                <Bar 
                  dataKey="minutes" 
                  fill={barColor}
                  radius={[4, 4, 0, 0]}
                  barSize={40}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  );
}
