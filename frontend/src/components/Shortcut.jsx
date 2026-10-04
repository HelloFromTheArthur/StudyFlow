import { useState, useEffect } from "react";
import { useAppContext } from "../AppContext";

const SHORTCUTS_KEY = "studyflow_shortcuts";
const COLLAPSED_KEY = "studyflow_shortcuts_collapsed";

function loadShortcuts() {
  try {
    const parsed = JSON.parse(localStorage.getItem(SHORTCUTS_KEY));
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (s) =>
        s &&
        typeof s.id === "string" &&
        typeof s.name === "string" &&
        typeof s.url === "string" &&
        typeof s.domain === "string"
    );
  } catch {
    return [];
  }
}

function loadCollapsed() {
  try {
    return localStorage.getItem(COLLAPSED_KEY) === "true";
  } catch {
    return true; // default to collapsed
  }
}

function parseWebsite(input) {
  const trimmed = input.trim();
  if (!trimmed) return { error: "Please enter a website." };
  if (/\s/.test(trimmed)) return { error: "That doesn't look like a valid website." };

  const hasProtocol = /^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed);
  const withProtocol = hasProtocol ? trimmed : `https://${trimmed}`;

  let parsed;
  try {
    parsed = new URL(withProtocol);
  } catch {
    return { error: "That doesn't look like a valid website." };
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return { error: "Only http and https websites are supported." };
  }

  const domain = parsed.hostname.replace(/^www\./, "").toLowerCase();
  if (!/^([a-z0-9-]+\.)+[a-z0-9-]{2,}$/.test(domain)) {
    return { error: "Please enter a valid domain, like github.com." };
  }

  const label = domain.split(".")[0];
  return {
    domain,
    url: `https://${parsed.hostname}`,
    name: label.charAt(0).toUpperCase() + label.slice(1),
  };
}

function ShortcutIcon({ domain, name }) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-200 dark:bg-[#222] text-sm font-semibold text-black dark:text-white border border-gray-300 dark:border-gray-700">
        {name.charAt(0).toUpperCase()}
      </span>
    );
  }

  return (
    <img
      src={`https://www.google.com/s2/favicons?domain=${domain}&sz=64`}
      alt=""
      onError={() => setFailed(true)}
      className="h-9 w-9 rounded-full bg-white border border-gray-200 dark:border-gray-800 p-1.5 object-contain"
    />
  );
}

const Shortcut = () => {
  const { shortcutsEnabled } = useAppContext();
  const [shortcuts, setShortcuts] = useState(loadShortcuts);
  const [collapsed, setCollapsed] = useState(loadCollapsed);
  const [modalOpen, setModalOpen] = useState(false);
  const [input, setInput] = useState("");
  const [error, setError] = useState("");
  const [tip, setTip] = useState({ text: "", top: 0, left: 0, visible: false });

  // Auto collapse after 10s
  useEffect(() => {
    if (collapsed || modalOpen) return;
    const timer = setTimeout(() => {
      setCollapsed(true);
    }, 10000);
    return () => clearTimeout(timer);
  }, [collapsed, modalOpen]);

  useEffect(() => {
    try {
      localStorage.setItem(SHORTCUTS_KEY, JSON.stringify(shortcuts));
    } catch {}
  }, [shortcuts]);

  useEffect(() => {
    try {
      localStorage.setItem(COLLAPSED_KEY, String(collapsed));
    } catch {}
  }, [collapsed]);

  useEffect(() => {
    if (!modalOpen) return;
    const onKey = (e) => e.key === "Escape" && closeModal();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [modalOpen]);

  if (!shortcutsEnabled) return null;

  const openModal = () => {
    setInput("");
    setError("");
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setError("");
  };

  const handleAdd = (e) => {
    e.preventDefault();
    const result = parseWebsite(input);
    if (result.error) {
      setError(result.error);
      return;
    }
    if (shortcuts.some((s) => s.domain === result.domain)) {
      setError("This website has already been added.");
      return;
    }
    setShortcuts((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        name: result.name,
        url: result.url,
        domain: result.domain,
      },
    ]);
    closeModal();
  };

  const handleDelete = (shortcut) => {
    if (!window.confirm(`Remove ${shortcut.name}?`)) return;
    setShortcuts((prev) => prev.filter((s) => s.id !== shortcut.id));
    hideTip();
  };

  const showTip = (e, text) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setTip({
      text,
      top: rect.top + rect.height / 2,
      left: rect.right + 8,
      visible: true,
    });
  };

  const hideTip = () => setTip((t) => ({ ...t, visible: false }));

  if (collapsed) {
    return (
      <aside className="fixed left-0 top-32 z-40 transition-all duration-300 group">
        <button
          onClick={() => setCollapsed(false)}
          aria-label="Expand shortcuts"
          className="flex h-10 w-4 items-center justify-center bg-gray-200 dark:bg-[#1a1a1a] border-y border-r border-gray-300 dark:border-gray-800 rounded-r-md text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white hover:bg-gray-300 dark:hover:bg-[#222] transition-colors shadow-sm"
        >
          <span className="text-[10px] font-bold">&gt;</span>
        </button>
      </aside>
    );
  }

  return (
    <>
      <aside className="fixed left-3 top-32 z-40">
        <div className="flex w-12 flex-col items-center gap-1 rounded-full border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#0a0a0a] py-2 shadow-lg">
          <button
            onClick={() => setCollapsed(true)}
            aria-label="Collapse shortcuts"
            className="h-6 w-8 rounded-full text-lg leading-none text-gray-400 dark:text-gray-500 transition hover:bg-gray-100 dark:hover:bg-[#111] hover:text-black dark:hover:text-white mb-1"
          >
            ‹
          </button>

          <div
            onScroll={hideTip}
            className="flex max-h-[calc(100vh-20rem)] flex-col items-center gap-2 overflow-y-auto p-1.5 [scrollbar-width:none]"
          >
            {shortcuts.map((s) => (
              <div key={s.id} className="group relative shrink-0">
                <a
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Open ${s.name}`}
                  onMouseEnter={(e) => showTip(e, s.name)}
                  onMouseLeave={hideTip}
                  onFocus={(e) => showTip(e, s.name)}
                  onBlur={hideTip}
                  className="block rounded-full transition hover:scale-105 focus:outline-none"
                >
                  <ShortcutIcon domain={s.domain} name={s.name} />
                </a>
                <button
                  onClick={() => handleDelete(s)}
                  aria-label={`Delete ${s.name}`}
                  className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-black dark:bg-white text-[10px] leading-none text-white dark:text-black opacity-0 transition focus:opacity-100 group-hover:opacity-100 group-focus-within:opacity-100 shadow-sm border border-transparent dark:border-black"
                >
                  ×
                </button>
              </div>
            ))}
          </div>

          <button
            onClick={openModal}
            aria-label="Add shortcut"
            onMouseEnter={(e) => showTip(e, "Add shortcut")}
            onMouseLeave={hideTip}
            className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-100 dark:bg-[#111] border border-gray-200 dark:border-gray-800 text-xl text-gray-500 dark:text-gray-400 transition hover:bg-gray-200 dark:hover:bg-[#222] hover:text-black dark:hover:text-white"
          >
            +
          </button>
        </div>
      </aside>

      <div
        role="tooltip"
        style={{ top: tip.top, left: tip.left }}
        className={`pointer-events-none fixed z-50 -translate-y-1/2 whitespace-nowrap rounded border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#0a0a0a] px-2 py-1 text-xs font-medium text-black dark:text-white shadow-md transition-opacity duration-150 ${
          tip.visible ? "opacity-100" : "opacity-0"
        }`}
      >
        {tip.text}
      </div>

      {modalOpen && (
        <div
          onClick={closeModal}
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
        >
          <form
            onSubmit={handleAdd}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#0a0a0a] p-5 shadow-2xl"
          >
            <h2 className="mb-4 font-bold text-black dark:text-white">Add shortcut</h2>
            <input
              autoFocus
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                setError("");
              }}
              placeholder="github.com"
              aria-label="Website URL or domain"
              className="w-full rounded border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-[#111] p-2.5 text-sm text-black dark:text-white focus:border-black dark:focus:border-white focus:outline-none transition-colors"
            />
            {error && <p className="mt-2 text-xs text-red-500">{error}</p>}
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={closeModal}
                className="rounded px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded bg-black text-white dark:bg-white dark:text-black px-4 py-2 text-sm font-medium hover:opacity-80 transition-opacity"
              >
                Add
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
};

export default Shortcut;
