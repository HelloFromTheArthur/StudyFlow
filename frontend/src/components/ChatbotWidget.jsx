import { useState, useRef, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { BiMessageRoundedDots, BiX } from "react-icons/bi";
import { useChatbot } from "./Chatbotcontext";
import ChatHistory from "./ChatHistory";
import ChatMessages from "./ChatMessages";
import ChatInput from "./ChatInput";

function ChatbotWidget() {
  const [showHistory, setShowHistory] = useState(false);
  const location = useLocation();
  
  // Dragging state
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef({ startX: 0, startY: 0, initialX: 0, initialY: 0 });

  const {
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
    setIsWidgetOpen
  } = useChatbot();

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging) return;
      setPosition({
        x: dragRef.current.initialX + (e.clientX - dragRef.current.startX),
        y: dragRef.current.initialY + (e.clientY - dragRef.current.startY)
      });
    };
    const handleMouseUp = () => setIsDragging(false);
    
    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging]);

  const handleMouseDown = (e) => {
    if (e.target.closest("button")) return;
    setIsDragging(true);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialX: position.x,
      initialY: position.y
    };
  };

  if (location.pathname === "/akhanda-mode") return null;

  function handleNewChat() {
    newChat();
    setShowHistory(false);
  }

  function handleSelectChat(id) {
    selectChat(id);
    setShowHistory(false);
  }

  return (
    <div className="fixed bottom-5 right-5 z-[110] flex flex-col items-end gap-3 pointer-events-none">
      {isWidgetOpen && (
        <div 
          className="pointer-events-auto resize overflow-hidden mb-12 flex flex-col rounded-lg border border-gray-200 dark:border-gray-800 bg-white/95 dark:bg-[#0a0a0a]/95 text-black dark:text-white shadow-2xl backdrop-blur-md"
          style={{ 
            transform: `translate(${position.x}px, ${position.y}px)`,
            minWidth: '320px',
            minHeight: '400px',
            width: '380px',
            height: '550px',
            maxWidth: '90vw',
            maxHeight: '85vh'
          }}
        >
          <header 
            onMouseDown={handleMouseDown}
            className="cursor-move flex items-center justify-between border-b border-gray-200 dark:border-gray-800 px-4 py-3 bg-gray-50 dark:bg-[#111] select-none"
          >
            <div>
              <p className="text-sm font-bold">
                {showHistory ? "Chat History" : "Akhanda Mode"}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">AI Study Assistant</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowHistory(!showHistory)}
                className="rounded border border-gray-200 dark:border-gray-700 px-2 py-1 text-xs font-medium hover:bg-gray-100 dark:hover:bg-[#1a1a1a] transition-colors"
              >
                {showHistory ? "Back" : "History"}
              </button>
              <button
                onClick={() => setIsWidgetOpen(false)}
                aria-label="Close chatbot"
                className="text-gray-400 hover:text-black dark:hover:text-white transition-colors"
              >
                <BiX size={20} />
              </button>
            </div>
          </header>

          {showHistory ? (
            <ChatHistory
              compact
              chats={chats}
              activeId={activeChat.id}
              onNewChat={handleNewChat}
              onSelectChat={handleSelectChat}
              onDeleteChat={deleteChat}
              onClearAll={clearAll}
            />
          ) : (
            <>
              <ChatMessages
                compact
                messages={activeChat.messages}
                loading={loading}
                copiedId={copiedId}
                onCopy={copyText}
              />
              <ChatInput
                compact
                loading={loading}
                onSend={sendMessage}
                onStop={stopGeneration}
              />
            </>
          )}
        </div>
      )}

      <button
        onClick={() => setIsWidgetOpen(!isWidgetOpen)}
        aria-label={isWidgetOpen ? "Close chatbot" : "Open chatbot"}
        className="pointer-events-auto flex h-12 w-12 items-center justify-center rounded-full border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#0a0a0a] text-2xl text-black dark:text-white shadow-lg transition duration-300 hover:bg-gray-50 dark:hover:bg-[#111]"
      >
        {isWidgetOpen ? <BiX size={24} /> : <BiMessageRoundedDots size={24} />}
      </button>
    </div>
  );
}

export default ChatbotWidget;
