const BASE = import.meta.env.VITE_API_URL || "http://localhost:8080/api";

export async function api(path, method = "GET", body) {
  const token = localStorage.getItem("token");
  const res = await fetch(BASE + path, {
    method,
    credentials: "include", // Send cookies automatically
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401 && token) {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    throw new Error(data.error || "Request failed");
  }
  return data;
}
