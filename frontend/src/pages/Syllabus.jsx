import { useEffect, useState } from "react";
import { api } from "../api";
import { useAppContext } from "../AppContext";
import { useAuth } from "../AuthContext";
import { AlertCircle, FileText } from "lucide-react";
import PastPaperModal from "../components/PastPaperModal";

export default function Syllabus() {
  const [subjects, setSubjects] = useState([]);
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState("");
  const [selectedSubjectForExam, setSelectedSubjectForExam] = useState(null);
  const { semester } = useAppContext();
  const { user } = useAuth();

  const loadSummary = () =>
    api("/progress/summary").then(setSummary).catch((e) => setError(e.message));

  useEffect(() => {
    api(`/syllabus?semester=${semester}`).then(setSubjects).catch((e) => setError(e.message));
    loadSummary();
  }, [semester]);

  async function toggle(subjectId, topic) {
    const completed = !topic.completed;
    setSubjects((list) =>
      list.map((s) =>
        s.id !== subjectId
          ? s
          : { ...s, topics: s.topics.map((t) => (t.id === topic.id ? { ...t, completed } : t)) }
      )
    );
    try {
      await api(`/progress/${topic.id}`, "POST", { completed });
      loadSummary();
    } catch (e) {
      setSubjects((list) =>
        list.map((s) =>
          s.id !== subjectId
            ? s
            : { ...s, topics: s.topics.map((t) => (t.id === topic.id ? { ...t, completed: !completed } : t)) }
        )
      );
      setError(e.message);
    }
  }

  const currentSemData = summary?.semesters?.find((x) => x.semester === semester);
  const currentSubjects = subjects.filter((s) => s.semester === semester);

  const getExamBanner = () => {
    if (!user?.exam_date) return null;
    const exam = new Date(user.exam_date);
    const now = new Date();
    const diff = Math.ceil((exam - now) / (1000 * 60 * 60 * 24));
    
    if (diff < 0) return null;
    
    let colorClass = "bg-green-50 border-green-200 text-green-700 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400";
    let msg = `You have plenty of time! ${diff} days remaining. Keep a steady pace.`;
    
    if (diff <= 7) {
      colorClass = "bg-red-50 border-red-200 text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400";
      msg = `Hurry up! Only ${diff} days remaining until your exam! Time to grind.`;
    } else if (diff <= 30) {
      colorClass = "bg-orange-50 border-orange-200 text-orange-700 dark:bg-orange-900/20 dark:border-orange-800 dark:text-orange-400";
      msg = `The exam is approaching. ${diff} days left. Start wrapping things up!`;
    }

    return (
      <div className={`flex items-center gap-3 px-4 py-3 rounded-lg border text-sm font-medium mb-8 ${colorClass}`}>
        <AlertCircle size={16} />
        {msg}
      </div>
    );
  };

  return (
    <div className="max-w-3xl mx-auto">
      {getExamBanner()}

      {error && <p className="text-sm text-red-500 mb-4">{error}</p>}

      <div className="mb-10">
        <div className="flex justify-between items-baseline mb-2">
          <h2 className="text-2xl font-bold text-black dark:text-white">Semester {semester} Dashboard</h2>
          <span className="text-3xl font-bold text-black dark:text-white">{currentSemData?.percent ?? 0}%</span>
        </div>
        <div className="w-full h-1 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-black dark:bg-white transition-all duration-500 ease-out rounded-full"
            style={{ width: `${currentSemData?.percent ?? 0}%` }}
          />
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 font-medium">
          {currentSemData?.completed_topics ?? 0} out of {currentSemData?.total_topics ?? 0} units completed
        </p>
      </div>

      {currentSubjects.length === 0 && (
        <div className="text-center py-12 border border-dashed border-gray-200 dark:border-gray-800 rounded-lg">
          <p className="text-sm text-gray-500 dark:text-gray-400">No subjects found in this semester.</p>
        </div>
      )}

      <div className="space-y-12">
        {currentSubjects.map((s) => {
          const total = s.topics.length;
          const done = s.topics.filter((t) => t.completed).length;
          return (
            <div key={s.id}>
              <div className="flex justify-between items-baseline mb-1">
                <div className="flex items-center gap-3">
                  <h3 className="font-semibold text-lg text-black dark:text-white">{s.title}</h3>
                  <button 
                    onClick={() => setSelectedSubjectForExam(s)}
                    className="flex items-center gap-1.5 px-2 py-1 bg-gray-100 hover:bg-gray-200 dark:bg-[#1a1a1a] dark:hover:bg-[#222] text-xs font-medium text-black dark:text-white rounded transition-colors border border-gray-200 dark:border-gray-800"
                  >
                    <FileText size={12} />
                    Past Paper
                  </button>
                </div>
                <span className="text-sm font-medium text-gray-400 dark:text-gray-500">{done}/{total}</span>
              </div>
              <p className="text-xs font-medium text-gray-400 dark:text-gray-500 mb-4 uppercase tracking-wider">{s.code} · {s.credit_hours} CH</p>

              <ul className="space-y-3">
                {s.topics.map((t) => (
                  <li key={t.id} className="group">
                    <label className="flex items-start gap-4 cursor-pointer p-2 -ml-2 rounded-md hover:bg-gray-50 dark:hover:bg-[#111] transition-colors">
                      <div className="relative flex items-center justify-center mt-0.5">
                        <input
                          type="checkbox"
                          checked={t.completed}
                          onChange={() => toggle(s.id, t)}
                          className="peer appearance-none w-4 h-4 border-2 border-gray-300 dark:border-gray-600 rounded-sm checked:bg-black checked:border-black dark:checked:bg-white dark:checked:border-white transition-colors cursor-pointer"
                        />
                        <svg className="absolute w-3 h-3 text-white dark:text-black opacity-0 peer-checked:opacity-100 pointer-events-none" viewBox="0 0 14 14" fill="none">
                          <path d="M3 8L6 11L11 3.5" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" stroke="currentColor"/>
                        </svg>
                      </div>
                      <span
                        className={`text-sm leading-snug transition-colors ${
                          t.completed
                            ? "text-gray-400 dark:text-gray-600 line-through"
                            : "text-gray-800 dark:text-gray-200 group-hover:text-black dark:group-hover:text-white"
                        }`}
                      >
                        <span className="font-medium mr-2">{t.unit_no}.</span>{t.title}
                        {t.hours > 0 && (
                          <span className="ml-2 text-xs text-gray-400 dark:text-gray-500">({t.hours} hrs)</span>
                        )}
                      </span>
                    </label>
                  </li>
                ))}
                {total === 0 && <li className="text-sm text-gray-400 dark:text-gray-500 italic">No units listed.</li>}
              </ul>
            </div>
          );
        })}
      </div>

      {selectedSubjectForExam && (
        <PastPaperModal 
          subject={selectedSubjectForExam} 
          facultyCode={user?.faculty} 
          semester={semester} 
          onClose={() => setSelectedSubjectForExam(null)} 
        />
      )}
    </div>
  );
}
