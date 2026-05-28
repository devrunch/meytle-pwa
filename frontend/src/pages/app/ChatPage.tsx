import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';
import {
  IconArrowLeft, IconLoader2, IconSend, IconAlertCircle, IconWifi, IconWifiOff,
} from '@tabler/icons-react';
import toast from 'react-hot-toast';
import { client } from '../../api/client';
import { useAuthStore } from '../../store/authStore';
import type { Booking, Message } from '../../types';

function getToken(): string | null {
  try {
    return JSON.parse(localStorage.getItem('auth-store') ?? '{}')?.state?.token ?? null;
  } catch {
    return null;
  }
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-IN', {
    hour: '2-digit', minute: '2-digit', hour12: true,
  });
}

function fmtDay(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return 'Today';
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

// Group messages by day
function groupByDay(messages: Message[]): { day: string; msgs: Message[] }[] {
  const groups: { day: string; msgs: Message[] }[] = [];
  for (const msg of messages) {
    const day = fmtDay(msg.sentAt);
    const last = groups[groups.length - 1];
    if (last && last.day === day) {
      last.msgs.push(msg);
    } else {
      groups.push({ day, msgs: [msg] });
    }
  }
  return groups;
}

export function ChatPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [booking, setBooking] = useState<Booking | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState('');
  const [connected, setConnected] = useState(false);

  const socketRef = useRef<Socket | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = useCallback((smooth = true) => {
    bottomRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'instant' });
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages, scrollToBottom]);

  // Load booking + history
  useEffect(() => {
    if (!id) return;
    Promise.all([
      client.get<Booking>(`/bookings/${id}`),
      client.get<Message[]>(`/bookings/${id}/messages`),
    ])
      .then(([{ data: b }, { data: msgs }]) => {
        setBooking(b);
        setMessages(msgs);
      })
      .catch((err) => {
        const msg = (err?.response?.data?.message as string | undefined) ?? 'Could not load chat';
        toast.error(msg);
        navigate('/messages');
      })
      .finally(() => {
        setLoading(false);
        setTimeout(() => scrollToBottom(false), 100);
      });
  }, [id, navigate, scrollToBottom]);

  // Socket.IO
  useEffect(() => {
    if (!id) return;
    const token = getToken();
    if (!token) return;

    const socket = io('/messages', {
      auth: { token },
      transports: ['websocket', 'polling'],
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      socket.emit('join', id);
      socket.emit('read', id);
    });

    socket.on('disconnect', () => setConnected(false));

    socket.on('message', (msg: Message) => {
      setMessages((prev) => {
        if (prev.some((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
      socket.emit('read', id);
    });

    socket.on('error', (err: { message: string }) => {
      toast.error(err.message);
    });

    return () => {
      socket.emit('leave', id);
      socket.disconnect();
    };
  }, [id]);

  // Auto-resize textarea
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    const el = e.target;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 128)}px`;
  };

  const handleSend = () => {
    const text = input.trim();
    if (!text || !socketRef.current || !connected) return;
    socketRef.current.emit('send', { bookingId: id, content: text });
    setInput('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const companion = booking?.companion;
  const groups = groupByDay(messages);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <IconLoader2 size={32} className="animate-spin text-teal-500" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen" style={{ background: '#F8FAFB' }}>
      {/* Header */}
      <header
        className="shrink-0 bg-white border-b px-4 h-14 flex items-center gap-3"
        style={{ borderColor: 'rgba(0,0,0,0.06)' }}
      >
        <button
          onClick={() => navigate('/messages')}
          className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100 transition shrink-0 text-gray-500"
        >
          <IconArrowLeft size={18} />
        </button>

        <div className="w-9 h-9 rounded-xl overflow-hidden shrink-0 bg-gradient-to-br from-teal-400 to-blue-500 flex items-center justify-center text-white font-bold text-sm">
          {companion?.profilePhotoUrl ? (
            <img src={companion.profilePhotoUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            companion?.displayName?.[0] ?? '?'
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-gray-900 truncate leading-tight">
            {companion?.displayName ?? 'Chat'}
          </p>
          <div className="flex items-center gap-1 mt-0.5">
            {connected ? (
              <>
                <IconWifi size={9} className="text-teal-500" />
                <span className="text-[10px] text-teal-600 font-medium">Connected</span>
              </>
            ) : (
              <>
                <IconWifiOff size={9} className="text-gray-400" />
                <span className="text-[10px] text-gray-400">Reconnecting...</span>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center pb-8">
            <div className="w-14 h-14 rounded-2xl bg-white border border-black/5 shadow-sm flex items-center justify-center mb-3">
              <span className="text-2xl">👋</span>
            </div>
            <p className="text-sm font-semibold text-gray-700 mb-1">Start the conversation</p>
            <p className="text-xs text-gray-400 max-w-[220px]">
              Say hello to {companion?.displayName ?? 'your companion'} before your session
            </p>
          </div>
        ) : (
          <div className="space-y-1 max-w-2xl mx-auto">
            {groups.map(({ day, msgs }) => (
              <div key={day}>
                {/* Day separator */}
                <div className="flex items-center gap-3 py-3">
                  <div className="flex-1 h-px bg-gray-200/70" />
                  <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-1">
                    {day}
                  </span>
                  <div className="flex-1 h-px bg-gray-200/70" />
                </div>

                {/* Messages */}
                <div className="space-y-1.5">
                  {msgs.map((msg) => {
                    const isMe = msg.senderId === user?.id;

                    if (msg.isBlocked) {
                      return (
                        <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                          <div className="flex items-center gap-1.5 bg-red-50 border border-red-100 rounded-2xl px-3 py-2 max-w-xs">
                            <IconAlertCircle size={12} className="text-red-400 shrink-0" />
                            <p className="text-xs text-red-500 italic">
                              Message blocked — no phone numbers allowed
                            </p>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                        <div
                          className={`max-w-[75%] rounded-2xl px-4 py-2.5 shadow-sm ${
                            isMe
                              ? 'text-white rounded-br-sm'
                              : 'bg-white border text-gray-800 rounded-bl-sm'
                          }`}
                          style={
                            isMe
                              ? { background: 'linear-gradient(135deg,#00D4AA,#4F8CFF)' }
                              : { borderColor: 'rgba(0,0,0,0.07)' }
                          }
                        >
                          <p className="text-sm leading-relaxed break-words whitespace-pre-wrap">
                            {msg.content}
                          </p>
                          <p
                            className={`text-[9px] mt-1 ${
                              isMe ? 'text-white/60 text-right' : 'text-gray-400'
                            }`}
                          >
                            {fmtTime(msg.sentAt)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
        <div ref={bottomRef} className="h-1" />
      </div>

      {/* Input bar */}
      <div
        className="shrink-0 bg-white border-t px-4 py-3"
        style={{ borderColor: 'rgba(0,0,0,0.06)' }}
      >
        <div className="flex items-end gap-2 max-w-2xl mx-auto">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Type a message…"
            rows={1}
            className="flex-1 resize-none rounded-2xl border px-4 py-3 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400/50 transition"
            style={{
              borderColor: 'rgba(0,0,0,0.1)',
              lineHeight: '1.4',
              background: '#F8FAFB',
              maxHeight: '128px',
            }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || !connected}
            className="w-11 h-11 rounded-2xl flex items-center justify-center text-white transition-opacity hover:opacity-90 disabled:opacity-40 shrink-0"
            style={{ background: 'linear-gradient(135deg,#00D4AA,#4F8CFF)' }}
          >
            <IconSend size={16} />
          </button>
        </div>
        <p className="text-[10px] text-gray-400 text-center mt-2">
          Phone numbers are blocked to protect both parties
        </p>
      </div>
    </div>
  );
}
