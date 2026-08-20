'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, X, Smile, MessageSquare, Bot } from 'lucide-react';
import { ChatMessage } from '@/types/meeting';

const QUICK_EMOJIS = ['👍', '👏', '🔥', '🚀', '💯', '❤️', '🤝'];

interface ChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  currentUserId: string;
}

export function ChatDrawer({
  isOpen,
  onClose,
  messages,
  onSendMessage,
  currentUserId,
}: ChatDrawerProps) {
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    onSendMessage(inputText.trim());
    setInputText('');
  };

  const handleQuickEmoji = (emoji: string) => {
    onSendMessage(emoji);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm sm:hidden z-40"
        onClick={onClose}
      />

      <aside className="fixed sm:relative inset-x-0 bottom-0 sm:inset-auto h-[85dvh] sm:h-full w-full sm:w-80 lg:w-96 flex flex-col bg-slate-950 border-t sm:border-t-0 sm:border-l border-slate-800/80 shadow-2xl z-50 sm:z-40 transition-all duration-300 rounded-t-3xl sm:rounded-none overflow-hidden">
        {/* Mobile Pull Drag Bar */}
        <div className="w-12 h-1 bg-slate-700/60 rounded-full mx-auto my-2 sm:hidden shrink-0" />

        {/* Header */}
        <div className="h-14 sm:h-16 px-4 flex items-center justify-between border-b border-slate-800/80 bg-slate-900/60 shrink-0">
          <div className="flex items-center gap-2 text-white font-semibold text-sm">
            <MessageSquare className="w-4 h-4 text-blue-400" />
            <span>Meeting Chati</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Messages List */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3.5">
          {messages.map((msg) => {
            const isMine = msg.senderId === currentUserId;
            const time = new Date(msg.timestamp).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            });

            if (msg.isSystem) {
              return (
                <div key={msg.id} className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-400 flex items-start gap-2">
                  <Bot className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-blue-400 mb-0.5">Tizim bildirishnomasi</p>
                    <p className="text-slate-300">{msg.text}</p>
                  </div>
                </div>
              );
            }

            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}
              >
                <div className="flex items-center gap-1.5 mb-1 px-1">
                  <span className="text-[11px] font-semibold text-slate-400">
                    {isMine ? 'Siz' : msg.senderName}
                  </span>
                  <span className="text-[10px] text-slate-500">{time}</span>
                </div>
                <div
                  className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-md break-words ${
                    isMine
                      ? 'bg-blue-600 text-white rounded-tr-none'
                      : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-none'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Reaction Bar */}
        <div className="px-4 py-2 border-t border-slate-800/80 bg-slate-900/40 flex items-center gap-1 overflow-x-auto shrink-0">
          <span className="text-[11px] text-slate-500 mr-1 flex items-center gap-1 shrink-0">
            <Smile className="w-3 h-3" />
          </span>
          {QUICK_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => handleQuickEmoji(emoji)}
              className="p-1 text-sm hover:scale-125 transition-transform shrink-0"
            >
              {emoji}
            </button>
          ))}
        </div>

        {/* Input Box */}
        <form onSubmit={handleSubmit} className="p-3 border-t border-slate-800 bg-slate-950 shrink-0 pb-safe">
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Xabar yozing..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              disabled={!inputText.trim()}
              className="p-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white shadow-md transition-all shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </form>
      </aside>
    </>
  );
}
