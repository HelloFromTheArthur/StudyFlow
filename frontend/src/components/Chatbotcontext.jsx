import { createContext, useContext, useState, useEffect, useRef } from "react";
import axios from "axios";
import { useAuth } from "../AuthContext";
import { api } from "../api";

const GEMINI_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent`;

const ChatbotContext = createContext(null);

function createChat() {
  return {
    id: crypto.randomUUID(),
    title: "New chat",
    messages: [],
    createdAt: Date.now(),
  };
}

export function ChatbotProvider({ children }) {
  const { user } = useAuth();
  
  const [chats, setChats] = useState([createChat()]);
  const [activeId, setActiveId] = useState(chats[0].id);
  const loadedUserIdRef = useRef(null); // Tracks the user whose data is currently in state
  
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const abortRef = useRef(null);

  // Re-load on user change
  useEffect(() => {
    async function loadData() {
      // Mark as unloading
      loadedUserIdRef.current = null;
      let loaded = [createChat()];

      if (user) {
        try {
          const { ai_history } = await api("/ai_history");
          if (ai_history) {
            const serverSaved = JSON.parse(ai_history);
            if (Array.isArray(serverSaved) && serverSaved.length) {
              loaded = serverSaved;
            }
          }
        } catch (err) {
          console.error("Failed to load AI history from server", err);
        }
      }

      setChats(loaded);
      setActiveId(loaded[0].id);
      // Mark as fully loaded for THIS user
      loadedUserIdRef.current = user ? user.id : 'guest';
    }
    loadData();
  }, [user]);

  const activeChat = chats.find((c) => c.id === activeId) || chats[0];

  useEffect(() => {
    // ONLY save if the current chats actually belong to the currently logged in user
    if (!user || loadedUserIdRef.current !== user.id) return;
    
    try {
      const chatsJson = JSON.stringify(chats);
      api("/ai_history", "PUT", { 
        user_id: user.id,
        ai_history: chatsJson 
      }).catch(() => {});
    } catch {}
  }, [chats, user]);

  function updateChat(id, updater) {
    setChats((prev) => prev.map((c) => (c.id === id ? updater(c) : c)));
  }

  function addMessage(chatId, message) {
    updateChat(chatId, (c) => ({ ...c, messages: [...c.messages, message] }));
  }

  function newChat() {
    // don't keep making blank chats
    const empty = chats.find((c) => c.messages.length === 0);
    if (empty) {
      setActiveId(empty.id);
      return;
    }
    const chat = createChat();
    setChats((prev) => [chat, ...prev]);
    setActiveId(chat.id);
  }

  const [isWidgetOpen, setIsWidgetOpen] = useState(false);

  function selectChat(id) {
    setActiveId(id);
  }

  function deleteChat(id) {
    const remaining = chats.filter((c) => c.id !== id);
    if (remaining.length === 0) {
      const chat = createChat();
      setChats([chat]);
      setActiveId(chat.id);
      return;
    }
    setChats(remaining);
    if (id === activeChat.id) setActiveId(remaining[0].id);
  }

  function clearAll() {
    if (!window.confirm("Delete all chats? This cannot be undone.")) return;
    const chat = createChat();
    setChats([chat]);
    setActiveId(chat.id);
  }

  async function askQuestion(text, customTitle) {
    let targetChatId = activeId;

    if (customTitle) {
      const existing = chats.find((c) => c.title === customTitle);
      if (existing) {
        targetChatId = existing.id;
        setActiveId(existing.id);
      } else {
        const chat = createChat();
        chat.title = customTitle;
        setChats((prev) => [chat, ...prev]);
        setActiveId(chat.id);
        targetChatId = chat.id;
      }
    } else {
      const chat = createChat();
      setChats((prev) => [chat, ...prev]);
      setActiveId(chat.id);
      targetChatId = chat.id;
    }

    setIsWidgetOpen(true);
    // Slight delay to allow widget to open and chat to set
    setTimeout(() => {
       _sendMessageInternal(text, targetChatId);
    }, 100);
  }

  async function _sendMessageInternal(text, chatId) {
    if (!text || loading) return;

    const target = chats.find(c => c.id === chatId) || activeChat;
    const userMsg = { id: crypto.randomUUID(), role: "user", text };

    const history = [...target.messages, userMsg]
      .filter((m) => !m.error)
      .map((m) => ({ 
        role: m.role === "model" ? "model" : "user", 
        parts: [{ text: m.text }]
      }));

    updateChat(chatId, (c) => ({
      ...c,
      title: (c.messages.length === 0 && c.title === "New chat") ? text.slice(0, 40) : c.title,
      messages: [...c.messages, userMsg],
    }));
    setLoading(true);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "X-goog-api-key": GEMINI_KEY
        },
        body: JSON.stringify({ 
          contents: history 
        }),
        signal: controller.signal,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error?.message || "Something went wrong.");
      }

      const reply =
        data?.candidates?.[0]?.content?.parts?.[0]?.text || "I couldn't generate a response. Try rephrasing.";

      addMessage(chatId, { id: crypto.randomUUID(), role: "model", text: reply });
    } catch (err) {
      const errorText = err.name === "AbortError"
        ? "Generation stopped."
        : "Error: " + (err.message || "Something went wrong.");

      addMessage(chatId, {
        id: crypto.randomUUID(),
        role: "model",
        text: errorText,
        error: true,
      });
    } finally {
      setLoading(false);
      abortRef.current = null;
    }
  }

  async function sendMessage(text) {
     return _sendMessageInternal(text, activeChat.id);
  }

  function stopGeneration() {
    abortRef.current?.abort();
  }

  async function copyText(id, text) {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1500);
    } catch {
      // clipboard not available
    }
  }

  const value = {
    chats,
    activeChat,
    loading,
    copiedId,
    newChat,
    selectChat,
    deleteChat,
    clearAll,
    sendMessage,
    stopGeneration,
    copyText,
    isWidgetOpen,
    setIsWidgetOpen,
    askQuestion
  };

  return (
    <ChatbotContext.Provider value={value}>{children}</ChatbotContext.Provider>
  );
}

export function useChatbot() {
  const ctx = useContext(ChatbotContext);
  if (!ctx) throw new Error("useChatbot must be used inside ChatbotProvider");
  return ctx;
}
