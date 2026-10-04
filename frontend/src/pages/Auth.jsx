import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../AuthContext";

export default function Auth({ mode }) {
  const { user, authenticate } = useAuth();
  const [form, setForm] = useState({ username: "", email: "", password: "", faculty: "CSIT" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const isLogin = mode === "login";

  if (user) return <Navigate to="/dashboard" replace />;

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await authenticate(mode, form);
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  return (
    <div className="max-w-sm space-y-8">
      <div>
        <h1 className="text-2xl font-bold">{isLogin ? "Sign in" : "Create account"}</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {isLogin ? "Welcome back." : "Start tracking."}
        </p>
      </div>

      <form onSubmit={submit} className="space-y-4">
        {!isLogin && (
          <div className="space-y-1">
            <label className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Username</label>
            <input
              type="text"
              value={form.username}
              onChange={set("username")}
              required
              className="w-full border border-gray-300 dark:border-gray-700 bg-transparent px-3 py-2 text-sm focus:outline-none focus:border-black dark:focus:border-white"
            />
          </div>
        )}

        <div className="space-y-1">
          <label className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Email</label>
          <input
            type="email"
            value={form.email}
            onChange={set("email")}
            required
            className="w-full border border-gray-300 dark:border-gray-700 bg-transparent px-3 py-2 text-sm focus:outline-none focus:border-black dark:focus:border-white"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Password</label>
          <input
            type="password"
            minLength={6}
            value={form.password}
            onChange={set("password")}
            required
            className="w-full border border-gray-300 dark:border-gray-700 bg-transparent px-3 py-2 text-sm focus:outline-none focus:border-black dark:focus:border-white"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Faculty</label>
          <select
            value={form.faculty}
            onChange={set("faculty")}
            className="w-full border border-gray-300 dark:border-gray-700 bg-transparent px-3 py-2 text-sm focus:outline-none focus:border-black dark:focus:border-white"
          >
            <option value="CSIT" className="dark:bg-[#0a0a0a]">B.Sc. CSIT</option>
            <option value="BIT" className="dark:bg-[#0a0a0a]">BIT</option>
          </select>
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <button
          disabled={busy}
          className="w-full bg-black text-white dark:bg-white dark:text-black py-2 text-sm font-medium hover:opacity-80 transition-opacity disabled:opacity-50"
        >
          {busy ? "Wait..." : isLogin ? "Sign in" : "Create account"}
        </button>
      </form>

      <p className="text-sm text-gray-500 dark:text-gray-400">
        {isLogin ? (
          <>No account? <Link to="/register" className="text-black dark:text-white hover:underline">Register</Link></>
        ) : (
          <>Have an account? <Link to="/login" className="text-black dark:text-white hover:underline">Sign in</Link></>
        )}
      </p>
    </div>
  );
}
