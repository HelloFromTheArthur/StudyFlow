export default function ChatHistory({
  chats,
  activeId,
  isOpen,
  onClose,
  onNewChat,
  onSelectChat,
  onDeleteChat,
  onClearAll,
  compact = false,
}) {
  const content = (
    <>
      <div className="p-3">
        <button
          onClick={onNewChat}
          className="w-full rounded border border-gray-200 dark:border-gray-800 px-3 py-2 text-left text-sm font-medium hover:bg-gray-50 dark:hover:bg-[#111] transition-colors"
        >
          + New chat
        </button>
      </div>

      <div className="flex-1 space-y-1 overflow-y-auto px-2">
        {chats.map((chat) => (
          <div
            key={chat.id}
            onClick={() => onSelectChat(chat.id)}
            className={`group flex cursor-pointer items-center justify-between rounded px-3 py-2 text-sm transition-colors ${
              chat.id === activeId ? "bg-gray-100 dark:bg-[#1a1a1a] font-medium" : "hover:bg-gray-50 dark:hover:bg-[#111]"
            }`}
          >
            <span className="truncate">{chat.title}</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDeleteChat(chat.id);
              }}
              title="Delete chat"
              className={`ml-2 text-gray-400 hover:text-red-500 transition-colors ${
                compact ? "block" : "hidden group-hover:block"
              }`}
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      <div className="border-t border-gray-200 dark:border-gray-800 p-3">
        <button
          onClick={onClearAll}
          className="w-full text-left text-xs font-medium text-gray-500 hover:text-red-500 transition-colors"
        >
          Clear all chats
        </button>
      </div>
    </>
  );

  if (compact) {
    return (
      <div className="flex min-h-0 flex-1 flex-col bg-white dark:bg-[#0a0a0a]">
        {content}
      </div>
    );
  }

  return (
    <>
      <aside
        className={`absolute inset-y-0 left-0 z-20 flex w-64 flex-col border-r border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-[#111] transition-transform md:static md:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {content}
      </aside>

      {isOpen && (
        <div
          className="absolute inset-0 z-10 bg-black/50 md:hidden"
          onClick={onClose}
        />
      )}
    </>
  );
}
