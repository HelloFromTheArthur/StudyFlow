import { createContext, useContext, useEffect, useState } from "react";
import { api } from "./api";

const Ctx = createContext(null);
export const useAuth = () => useContext(Ctx);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api("/me")
      .then(setUser)
      .catch(() => {
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  function clearCache() {
    localStorage.removeItem("global_semester");
  }

  async function authenticate(mode, form) {
    clearCache();
    
    const d = await api("/" + mode, "POST", form);
    localStorage.setItem("token", d.token);
    const me = await api("/me");
    setUser(me);
  }

  async function logout() {
    try {
      await api("/logout", "POST");
    } catch {}
    localStorage.removeItem("token");
    clearCache();
    // Hard redirect to flush all React state
    window.location.href = "/";
  }

  return (
    <Ctx.Provider value={{ user, setUser, loading, authenticate, logout }}>
      {children}
    </Ctx.Provider>
  );
}
