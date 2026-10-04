import { useEffect, useState } from "react";
import { api } from "../api";
import { useAppContext } from "../AppContext";
import { useAuth } from "../AuthContext";
import { Clock } from "lucide-react";

export default function Leaderboard() {
  const [leaders, setLeaders] = useState([]);
  const [error, setError] = useState("");
  const [timeLeft, setTimeLeft] = useState("");
  const { semester } = useAppContext();
  const { user } = useAuth();

  useEffect(() => {
    let isMounted = true;
    const fetchLeaders = () => {
      api(`/leaderboard?semester=${semester}`)
        .then(data => {
          if (isMounted) setLeaders(data);
        })
        .catch((e) => {
          if (isMounted) setError(e.message);
        });
    };

    fetchLeaders(); // initial fetch
    const pollId = setInterval(fetchLeaders, 5000); // 5-second real-time polling

    return () => {
      isMounted = false;
      clearInterval(pollId);
    };
  }, [semester]);

  useEffect(() => {
    // Calculate time until next Monday 00:00:00
    const updateTime = () => {
      const now = new Date();
      const nextMonday = new Date();
      nextMonday.setDate(now.getDate() + ((1 + 7 - now.getDay()) % 7 || 7));
      nextMonday.setHours(0, 0, 0, 0);

      const diff = nextMonday - now;
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      setTimeLeft(`${days}d ${hours}h`);
    };
    
    updateTime();
    const interval = setInterval(updateTime, 1000 * 60 * 60); // update every hour
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-black dark:text-white">Weekly Leaderboard</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Ranking for {user?.faculty === 'CSIT' ? 'B.Sc. CSIT' : user?.faculty === 'BIT' ? 'B.I.T.' : user?.faculty || "your faculty"} · Semester {semester}
          </p>
        </div>
        
        <div className="flex items-center gap-1.5 bg-gray-50 dark:bg-[#111] border border-gray-200 dark:border-gray-800 px-2.5 py-1 rounded">
          <Clock size={12} className="text-gray-400" />
          <span className="text-[11px] uppercase tracking-wider font-semibold text-gray-500 dark:text-gray-400">Resets in {timeLeft}</span>
        </div>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 dark:bg-[#0a0a0a] border-b border-gray-200 dark:border-gray-800">
            <tr>
              <th className="px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Rank</th>
              <th className="px-4 py-3 font-medium text-gray-600 dark:text-gray-400">User</th>
              <th className="px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Study Score (Hrs)</th>
              <th className="px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Weekly Focus</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-800 bg-white dark:bg-[#111]">
            {leaders.length === 0 ? (
              <tr>
                <td colSpan="4" className="px-4 py-12 text-center text-gray-500 dark:text-gray-400 italic">
                  No one has covered any topics this semester yet.
                </td>
              </tr>
            ) : (
              leaders.map((l, i) => {
                const isMe = l.username === user?.username;
                return (
                  <tr key={l.username} className={isMe ? "bg-gray-50 dark:bg-[#1a1a1a]" : ""}>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400">#{i + 1}</td>
                    <td className="px-4 py-3 font-medium text-black dark:text-white flex items-center gap-2">
                      {l.username}
                      {isMe && (
                        <span className="text-[10px] bg-black text-white dark:bg-white dark:text-black px-1.5 py-0.5 rounded-sm uppercase tracking-wider">You</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{l.topics_completed}</td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{l.focus_minutes}m</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
