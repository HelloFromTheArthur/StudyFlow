import { useState, useEffect, useRef } from "react";

function ChatInput({ loading, onSend, onStop, compact = false }) {
  const [input, setInput] = useState("");
  const textareaRef = useRef(null);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 200) + "px";
  }, [input]);

  function submit() {
    const text = input.trim();
    if (!text || loading) return;
    onSend(text);
    setInput("");
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  }

  return (
    <div className={`border-t border-gray-200 dark:border-gray-800 ${compact ? "p-3" : "p-4"}`}>
      <div className="mx-auto flex max-w-3xl items-end gap-2 rounded border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-[#111] p-2">
        <textarea
          ref={textareaRef}
          rows={1}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            compact
              ? "Message…"
              : "Message… (Enter to send, Shift+Enter for new line)"
          }
          className="max-h-[200px] min-w-0 flex-1 resize-none bg-transparent px-2 py-2 text-sm outline-none placeholder:text-gray-400 text-black dark:text-white"
        />
        {loading ? (
          <button
            onClick={onStop}
            className="rounded bg-black text-white dark:bg-white dark:text-black px-4 py-2 text-sm font-semibold hover:opacity-80 transition-opacity"
          >
            Stop
          </button>
        ) : (
          <button
            onClick={submit}
            disabled={!input.trim()}
            className="rounded bg-black text-white dark:bg-white dark:text-black px-4 py-2 text-sm font-semibold hover:opacity-80 transition-opacity disabled:opacity-40"
          >
            Send
          </button>
        )}
      </div>
    </div>
  );
}

export default ChatInput;
