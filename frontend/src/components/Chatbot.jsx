import { useState } from "react";
import { useChatbot } from "./Chatbotcontext";
import ChatHistory from "./ChatHistory";
import ChatMessages from "./ChatMessages";
import ChatInput from "./ChatInput";

function Chatbot() {
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
  } = useChatbot();

  const [sidebarOpen, setSidebarOpen] = useState(false);

  function handleNewChat() {
    newChat();
    setSidebarOpen(false);
  }

  function handleSelectChat(id) {
    selectChat(id);
    setSidebarOpen(false);
  }

  return (
    <div className="relative flex h-[calc(100vh-8rem)] w-full overflow-hidden rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#0a0a0a] text-black dark:text-white">
      <ChatHistory
        chats={chats}
        activeId={activeChat.id}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onNewChat={handleNewChat}
        onSelectChat={handleSelectChat}
        onDeleteChat={deleteChat}
        onClearAll={clearAll}
      />

      <section className="flex min-w-0 flex-1 flex-col">
        <button
          className="md:hidden absolute top-4 left-4 z-30 p-2 bg-white dark:bg-[#0a0a0a] border border-gray-200 dark:border-gray-800 rounded-md"
          onClick={() => setSidebarOpen(true)}
          aria-label="Open chat history"
        >
          ☰
        </button>

        <ChatMessages
          messages={activeChat.messages}
          loading={loading}
          copiedId={copiedId}
          onCopy={copyText}
        />

        <ChatInput
          loading={loading}
          onSend={sendMessage}
          onStop={stopGeneration}
        />
      </section>
    </div>
  );
}

export default Chatbot;
