import { useEffect, useState } from "react";
import { api } from "../api";
import { Trash2, Plus, Check } from "lucide-react";

export default function Todos() {
  const [todos, setTodos] = useState([]);
  const [title, setTitle] = useState("");
  const [error, setError] = useState("");

  const load = () => api("/todos").then(setTodos).catch((e) => setError(e.message));
  useEffect(() => { load(); }, []);

  async function act(fn) {
    try { await fn(); await load(); } catch (e) { setError(e.message); }
  }

  const add = (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    act(async () => {
      await api("/todos", "POST", { title: title.trim() });
      setTitle("");
    });
  };

  const toggle = (t) => act(() => api(`/todos/${t.id}`, "PUT", { done: !t.done }));
  const remove = (t) => act(() => api(`/todos/${t.id}`, "DELETE"));

  const pending = todos.filter((t) => !t.done);
  const done = todos.filter((t) => t.done);

  return (
    <div className="max-w-2xl mx-auto space-y-10">
      <div>
        <h1 className="text-2xl font-bold text-black dark:text-white">To-do List</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Keep track of your tasks, assignments, and goals.</p>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <form onSubmit={add} className="relative group">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="What needs to be done?"
          className="w-full text-base bg-white dark:bg-[#111] text-black dark:text-white border border-gray-300 dark:border-gray-800 focus:border-black dark:focus:border-white focus:outline-none rounded-lg px-4 py-3 pr-12 shadow-sm transition-colors placeholder-gray-400 dark:placeholder-gray-600"
        />
        <button
          type="submit"
          className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black dark:hover:text-white p-2 transition-colors disabled:opacity-50"
          disabled={!title.trim()}
        >
          <Plus size={18} />
        </button>
      </form>

      <div className="space-y-8">
        {/* Pending tasks */}
        {pending.length > 0 && (
          <ul className="space-y-3">
            {pending.map((t) => (
              <li 
                key={t.id} 
                className="flex items-center gap-4 group bg-white dark:bg-[#111] border border-gray-200 dark:border-gray-800 rounded-lg p-3 hover:border-black dark:hover:border-white transition-colors"
              >
                <button
                  onClick={() => toggle(t)}
                  className="shrink-0 w-5 h-5 rounded-full border border-gray-300 dark:border-gray-600 flex items-center justify-center hover:border-black dark:hover:border-white transition-colors"
                >
                  <span className="opacity-0 scale-50 transition-all duration-200 group-hover:scale-100 group-hover:opacity-20 bg-black dark:bg-white w-2.5 h-2.5 rounded-full" />
                </button>
                <span className="flex-1 text-sm text-gray-800 dark:text-gray-200">{t.title}</span>
                <button
                  onClick={() => remove(t)}
                  className="text-gray-300 dark:text-gray-600 hover:text-red-500 dark:hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                >
                  <Trash2 size={16} />
                </button>
              </li>
            ))}
          </ul>
        )}

        {/* Done tasks */}
        {done.length > 0 && (
          <div className="space-y-4 pt-4 border-t border-gray-100 dark:border-gray-900">
            <h3 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Completed</h3>
            <ul className="space-y-3">
              {done.map((t) => (
                <li 
                  key={t.id} 
                  className="flex items-center gap-4 group bg-gray-50 dark:bg-[#0a0a0a] border border-transparent p-3 rounded-lg"
                >
                  <button
                    onClick={() => toggle(t)}
                    className="shrink-0 w-5 h-5 rounded-full bg-black dark:bg-white flex items-center justify-center"
                  >
                    <Check size={12} className="text-white dark:text-black" />
                  </button>
                  <span className="flex-1 text-sm text-gray-400 dark:text-gray-600 line-through">{t.title}</span>
                  <button
                    onClick={() => remove(t)}
                    className="text-gray-300 dark:text-gray-700 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                  >
                    <Trash2 size={16} />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {todos.length === 0 && (
          <div className="text-center py-12 border border-dashed border-gray-200 dark:border-gray-800 rounded-lg">
            <p className="text-sm text-gray-400 dark:text-gray-600">No tasks yet. Enjoy your free time!</p>
          </div>
        )}
      </div>
    </div>
  );
}
