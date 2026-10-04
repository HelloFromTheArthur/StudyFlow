import { useEffect, useRef } from "react";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

function ChatMessages({ messages, loading, copiedId, onCopy, compact = false }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  return (
    <div
      className={`min-h-0 flex-1 overflow-y-auto ${
        compact ? "px-3 py-4" : "px-4 py-6"
      }`}
    >
      <div
        className={`mx-auto max-w-3xl ${compact ? "space-y-4" : "space-y-6"}`}
      >
        {messages.length === 0 && (
          <div
            className={`text-center text-gray-500 dark:text-gray-400 ${
              compact ? "pt-12" : "pt-24"
            }`}
          >
            <p
              className={`font-bold text-black dark:text-white ${
                compact ? "text-lg" : "text-2xl"
              }`}
            >
              What do you want to study today?
            </p>
            <p className="mt-2 text-sm">
              Ask anything. Your chats are saved in this browser.
            </p>
          </div>
        )}

        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex ${
              m.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`group relative max-w-[85%] break-words rounded px-4 py-3 text-sm leading-relaxed ${
                m.role === "user"
                  ? "bg-gray-100 dark:bg-[#1a1a1a] text-black dark:text-white whitespace-pre-wrap"
                  : m.error
                  ? "border border-red-500/50 bg-red-50 dark:bg-[#2a1d1f] text-red-700 dark:text-red-300 whitespace-pre-wrap"
                  : "border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#0a0a0a] prose prose-sm prose-gray dark:prose-invert max-w-none"
              }`}
            >
              {m.role === "model" && !m.error ? (
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {m.text}
                </ReactMarkdown>
              ) : (
                m.text
              )}
              {m.role === "model" && !m.error && (
                <button
                  onClick={() => onCopy(m.id, m.text)}
                  className="mt-2 block text-xs text-gray-400 hover:text-black dark:hover:text-white transition-colors"
                >
                  {copiedId === m.id ? "Copied ✓" : "Copy"}
                </button>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="rounded border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#0a0a0a] px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
              <span className="animate-pulse">Thinking…</span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}

export default ChatMessages;
