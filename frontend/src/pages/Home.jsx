import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../AuthContext";

export default function Home() {
  const { user } = useAuth();

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[65vh] text-center space-y-8 animate-fade-in">
      <div className="space-y-4 max-w-2xl">
        <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight text-black dark:text-white">
          TU Course Tracker
        </h1>
        <p className="text-gray-500 dark:text-gray-400 text-lg md:text-xl leading-relaxed">
          A minimalist study environment. Track syllabus progress, run focus sessions, and generate mock exams. Currently supporting CSIT and B.I.T.
        </p>
      </div>
      
      <div className="flex items-center gap-4 pt-4">
        <Link 
          to="/register" 
          className="bg-black text-white dark:bg-white dark:text-black px-6 py-2.5 text-sm font-semibold hover:opacity-80 transition-opacity"
        >
          Get Started
        </Link>
        <Link 
          to="/login" 
          className="border border-gray-300 dark:border-gray-700 text-black dark:text-white px-6 py-2.5 text-sm font-semibold hover:border-black dark:hover:border-white transition-colors"
        >
          Log In
        </Link>
      </div>
    </div>
  );
}
