'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, X } from 'lucide-react';
import { useMeeting } from '../../context/MeetingContext';
import { Avatar } from '../common/Avatar';
import { formatTimestamp } from '../../utils/formatters';
import { REACTION_EMOJIS } from '../../utils/constants';

export function ChatSidebar() {
  const { messages, sendMessage, isChatOpen, setIsChatOpen, currentUser } =
    useMeeting();
  const [text, setText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isChatOpen) {
      scrollToBottom();
    }
  }, [messages, isChatOpen]);

  if (!isChatOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    sendMessage(text);
    setText('');
  };

  return (
    <aside className="absolute inset-0 sm:static sm:w-80 lg:w-96 h-full bg-[#0a0d14]/98 sm:bg-gray-900/95 backdrop-blur-2xl sm:border-l border-white/10 flex flex-col z-40 animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-white/10 bg-black/20">
        <div>
          <h3 className="font-bold text-white text-base">Uchrashuv Chati</h3>
          <p className="text-[11px] sm:text-xs text-gray-400">Barcha ishtirokchilarga ko&apos;rinadi</p>
        </div>
        <button
          type="button"
          onClick={() => setIsChatOpen(false)}
          className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-gray-500">
            <p className="text-sm font-medium">Hozircha xabarlar yo&apos;q</p>
            <p className="text-xs mt-1">Birinchi bo&apos;lib fikr bildiring!</p>
          </div>
        ) : (
          messages.map((msg) => {
            if (msg.isSystem) {
              return (
                <div key={msg.id} className="flex justify-center my-2">
                  <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[11px] text-gray-400">
                    {msg.text}
                  </span>
                </div>
              );
            }

            const isMe = msg.senderId === currentUser?.id;

            return (
              <div
                key={msg.id}
                className={`flex gap-2.5 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}
              >
                {!isMe && (
                  <Avatar
                    name={msg.senderName}
                    colorClass={msg.avatarColor}
                    size="sm"
                  />
                )}

                <div
                  className={`flex flex-col max-w-[80%] ${
                    isMe ? 'items-end' : 'items-start'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1 px-1">
                    <span className="text-[11px] sm:text-xs font-semibold text-gray-300">
                      {isMe ? 'Siz' : msg.senderName}
                    </span>
                    <span className="text-[10px] text-gray-500">
                      {formatTimestamp(msg.timestamp)}
                    </span>
                  </div>

                  <div
                    className={`px-3.5 py-2 sm:py-2.5 rounded-2xl text-xs sm:text-sm leading-relaxed break-words shadow-md ${
                      isMe
                        ? 'bg-blue-600 text-white rounded-tr-none'
                        : 'bg-white/10 text-gray-100 rounded-tl-none border border-white/5'
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Emojis */}
      <div className="flex items-center gap-1.5 px-3 sm:px-4 py-2 border-t border-white/5 overflow-x-auto bg-black/20">
        {REACTION_EMOJIS.slice(0, 6).map((emoji) => (
          <button
            key={emoji}
            type="button"
            onClick={() => setText((prev) => prev + emoji)}
            className="text-base hover:scale-125 transition-transform p-1 rounded hover:bg-white/10"
          >
            {emoji}
          </button>
        ))}
      </div>

      {/* Input Form */}
      <form
        onSubmit={handleSubmit}
        className="p-3 border-t border-white/10 bg-black/40 flex items-center gap-2"
      >
        <input
          type="text"
          placeholder="Xabar yozing..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="flex-1 px-4 py-2.5 bg-white/5 border border-white/10 rounded-2xl text-xs sm:text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
        />
        <button
          type="submit"
          disabled={!text.trim()}
          className="p-2.5 rounded-2xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white shadow-lg shadow-blue-600/30 transition-all active:scale-95 shrink-0"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </aside>
  );
}
