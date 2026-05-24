import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  IconArrowLeft, IconSend, IconSearch, IconMessages,
  IconLock, IconCalendar,
} from '@tabler/icons-react'
import { Avatar } from '../../components/ui'

// ─── Types ───────────────────────────────────────────────────────────────────

type BookingStatus = 'pending' | 'accepted' | 'completed' | 'cancelled'

interface Booking {
  status: BookingStatus
  service: string
  startTime: Date
  endTime: Date
}

interface Message {
  id: string
  senderId: 'me' | 'them'
  text: string
  time: string
}

interface Conversation {
  id: string
  name: string
  initials: string
  avatarUrl?: string
  lastMessage: string
  time: string
  unread: number
  online: boolean
  booking: Booking
  messages: Message[]
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function addHours(date: Date, h: number) {
  return new Date(date.getTime() + h * 60 * 60 * 1000)
}

function fmtTime(date: Date) {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function fmtDate(date: Date) {
  return date.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })
}

// Returns whether messaging is currently open, and a reason string if not
function getMessagingState(booking: Booking): {
  canMessage: boolean
  reason: string
  detail: string
} {
  const now = new Date()
  const windowOpen = addHours(booking.startTime, -3)

  if (booking.status === 'pending') {
    return {
      canMessage: false,
      reason: 'Waiting for confirmation',
      detail: 'Messaging opens once the companion accepts your booking request.',
    }
  }
  if (booking.status === 'cancelled') {
    return {
      canMessage: false,
      reason: 'Booking cancelled',
      detail: 'This booking was cancelled. No further messages can be sent.',
    }
  }
  if (booking.status === 'completed' || now > booking.endTime) {
    return {
      canMessage: false,
      reason: 'Session ended',
      detail: `Your ${booking.service} session ended at ${fmtTime(booking.endTime)}.`,
    }
  }
  if (now < windowOpen) {
    const diffMs = windowOpen.getTime() - now.getTime()
    const diffH = Math.floor(diffMs / (1000 * 60 * 60))
    const diffM = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
    const timeLabel = diffH > 0 ? `${diffH}h ${diffM}m` : `${diffM}m`
    return {
      canMessage: false,
      reason: 'Too early to message',
      detail: `Chat unlocks 3 hours before your booking on ${fmtDate(booking.startTime)} at ${fmtTime(booking.startTime)}. Opens in ${timeLabel}.`,
    }
  }
  // booking.status === 'accepted' && within window
  return { canMessage: true, reason: '', detail: '' }
}

// ─── Mock data ────────────────────────────────────────────────────────────────
// Relative to "now" so demo always shows meaningful states

const NOW = new Date()

const MOCK_CONVERSATIONS: Conversation[] = [
  {
    id: '1',
    name: 'Aanya',
    initials: 'A',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&crop=face',
    lastMessage: 'Looking forward to our coffee date!',
    time: '2m ago',
    unread: 2,
    online: true,
    // Accepted, starts in 1.5h → within 3h window → CAN message
    booking: {
      status: 'accepted',
      service: 'Coffee Date',
      startTime: addHours(NOW, 1.5),
      endTime:   addHours(NOW, 3.5),
    },
    messages: [
      { id: '1', senderId: 'them', text: 'Hey! I confirmed your booking for today.', time: fmtTime(addHours(NOW, -40/60)) },
      { id: '2', senderId: 'me',   text: 'Great, really excited!', time: fmtTime(addHours(NOW, -38/60)) },
      { id: '3', senderId: 'them', text: 'Looking forward to our coffee date!', time: fmtTime(addHours(NOW, -37/60)) },
    ],
  },
  {
    id: '2',
    name: 'Kabir',
    initials: 'K',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&crop=face',
    lastMessage: 'The restaurant has a 7pm reservation.',
    time: '1h ago',
    unread: 0,
    online: true,
    // Accepted, but starts in 6h → outside 3h window → CANNOT message yet
    booking: {
      status: 'accepted',
      service: 'Fine Dining',
      startTime: addHours(NOW, 6),
      endTime:   addHours(NOW, 9),
    },
    messages: [
      { id: '1', senderId: 'me',   text: 'Hi Kabir, looking forward to dinner!', time: fmtTime(addHours(NOW, -60/60)) },
      { id: '2', senderId: 'them', text: 'The restaurant has a 7pm reservation.', time: fmtTime(addHours(NOW, -15/60)) },
    ],
  },
  {
    id: '3',
    name: 'Priya',
    initials: 'P',
    avatarUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop&crop=face',
    lastMessage: 'Booking request sent.',
    time: 'Yesterday',
    unread: 0,
    online: false,
    // Still pending → CANNOT message
    booking: {
      status: 'pending',
      service: 'Fitness',
      startTime: addHours(NOW, 24),
      endTime:   addHours(NOW, 26),
    },
    messages: [
      { id: '1', senderId: 'me', text: 'Hi Priya! Just sent a booking request for Saturday.', time: 'Yesterday' },
    ],
  },
]

// ─── ConversationList ────────────────────────────────────────────────────────

function statusDot(booking: Booking): { color: string; label: string } {
  if (booking.status === 'pending')   return { color: 'bg-yellow-400',                      label: 'Pending' }
  if (booking.status === 'accepted')  return { color: 'bg-[var(--color-success)]',           label: 'Confirmed' }
  if (booking.status === 'completed') return { color: 'bg-[var(--color-border)]',            label: 'Done' }
  return                                     { color: 'bg-[var(--color-error)]',             label: 'Cancelled' }
}

function ConversationList({
  onSelect,
  activeId,
}: {
  onSelect: (id: string) => void
  activeId: string | null
}) {
  const [search, setSearch] = useState('')
  const filtered = MOCK_CONVERSATIONS.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 pt-5 pb-3 border-b border-[var(--color-border)]">
        <h1 className="text-[18px] font-semibold text-[var(--color-dark)] mb-3">Messages</h1>
        <div className="relative">
          <IconSearch size={14} stroke={1.5} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-gray)]" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full h-9 pl-9 pr-3 rounded-[8px] bg-[var(--color-gray-light)] border border-[var(--color-border)] text-[13px] placeholder:text-[var(--color-gray)] focus:outline-none focus:border-[var(--color-amber)] transition-colors"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto divide-y divide-[var(--color-border)]">
        {filtered.map(conv => {
          const { canMessage } = getMessagingState(conv.booking)
          const dot = statusDot(conv.booking)
          return (
            <button
              key={conv.id}
              onClick={() => onSelect(conv.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                activeId === conv.id
                  ? 'bg-[var(--color-amber-light)]'
                  : 'hover:bg-[var(--color-gray-light)]'
              }`}
            >
              <Avatar src={conv.avatarUrl} initials={conv.initials} size="lg" online={conv.online} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                  <p className="text-[14px] font-semibold text-[var(--color-dark)]">{conv.name}</p>
                  <p className="text-[11px] text-[var(--color-gray)]">{conv.time}</p>
                </div>
                <p className="text-[12px] text-[var(--color-gray)] truncate mb-1">{conv.lastMessage}</p>
                <div className="flex items-center gap-1.5">
                  <span className={`w-1.5 h-1.5 rounded-full ${dot.color}`} />
                  <span className="text-[10px] text-[var(--color-gray)]">{dot.label}</span>
                </div>
              </div>
              {canMessage && conv.unread > 0 ? (
                <div className="w-5 h-5 rounded-full bg-[var(--color-amber)] flex items-center justify-center flex-none">
                  <span className="text-[10px] text-white font-bold">{conv.unread}</span>
                </div>
              ) : !canMessage ? (
                <div className="w-7 h-7 rounded-full bg-[var(--color-amber-light)] flex items-center justify-center flex-none">
                  <IconLock size={14} stroke={1.5} className="text-[var(--color-amber)]" />
                </div>
              ) : null}
            </button>
          )
        })}
        {filtered.length === 0 && (
          <div className="py-16 text-center">
            <p className="text-[14px] text-[var(--color-gray)]">No conversations found</p>
          </div>
        )}
      </div>
    </div>
  )
}


// ─── ChatView ────────────────────────────────────────────────────────────────

function ChatView({
  conversationId,
  onBack,
}: {
  conversationId: string
  onBack: () => void
}) {
  const conv = MOCK_CONVERSATIONS.find(c => c.id === conversationId)
  const [text, setText] = useState('')
  const [messages, setMessages] = useState<Message[]>(conv?.messages ?? [])
  const bottomRef = useRef<HTMLDivElement>(null)

  // Re-evaluate every 30s so the window state stays live
  const [, setTick] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 30_000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  if (!conv) return null

  const { canMessage, reason, detail } = getMessagingState(conv.booking)

  function send() {
    if (!text.trim()) return
    setMessages(msgs => [
      ...msgs,
      {
        id: String(Date.now()),
        senderId: 'me',
        text: text.trim(),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ])
    setText('')
  }

  // Shared header used in both locked and open states
  const header = (
    <div className="bg-white border-b border-[var(--color-border)] px-4 py-3 flex items-center gap-3 flex-shrink-0">
      <button onClick={onBack} className="text-[var(--color-dark)] mr-1 md:hidden">
        <IconArrowLeft size={20} stroke={1.5} />
      </button>
      <Avatar src={conv.avatarUrl} initials={conv.initials} size="md" online={conv.online} />
      <div className="flex-1 min-w-0">
        <p className="text-[15px] font-semibold text-[var(--color-dark)]">{conv.name}</p>
        <div className="flex items-center gap-1.5">
          <span className={`w-1.5 h-1.5 rounded-full flex-none ${statusDot(conv.booking).color}`} />
          <p className="text-[11px] text-[var(--color-gray)]">
            {conv.booking.service} · {fmtDate(conv.booking.startTime)} {fmtTime(conv.booking.startTime)}
          </p>
        </div>
      </div>
    </div>
  )

  // Locked full-screen state
  if (!canMessage) {
    const isEarlyLock = conv.booking.status === 'accepted'
    return (
      <div className="flex flex-col h-full">
        {header}
        <div className="flex-1 flex flex-col items-center justify-center gap-5 px-6 bg-[var(--color-bg)]">
          <div className="w-16 h-16 rounded-full bg-[var(--color-amber-light)] flex items-center justify-center">
            <IconLock size={28} stroke={1.5} className="text-[var(--color-amber)]" />
          </div>
          <div className="text-center max-w-[300px]">
            <p className="text-[16px] font-semibold text-[var(--color-dark)] mb-1">{reason}</p>
            <p className="text-[13px] text-[var(--color-gray)] leading-relaxed">{detail}</p>
          </div>
          <div className="bg-white border border-[var(--color-border)] rounded-[12px] px-4 py-3 w-full max-w-[320px]">
            <div className="flex items-center gap-2 mb-1">
              <IconCalendar size={13} stroke={1.5} className="text-[var(--color-amber)]" />
              <p className="text-[12px] font-semibold text-[var(--color-dark)]">{conv.booking.service}</p>
              <span className={`ml-auto text-[10px] font-medium px-2 py-0.5 rounded-full ${
                conv.booking.status === 'pending'
                  ? 'bg-yellow-100 text-yellow-700'
                  : 'bg-[var(--color-success-bg)] text-[var(--color-success)]'
              }`}>
                {statusDot(conv.booking).label}
              </span>
            </div>
            <p className="text-[12px] text-[var(--color-gray)]">
              {fmtDate(conv.booking.startTime)} · {fmtTime(conv.booking.startTime)} – {fmtTime(conv.booking.endTime)}
            </p>
            {isEarlyLock && (
              <p className="text-[11px] text-[var(--color-amber)] mt-1.5 font-medium">
                Chat unlocks at {fmtTime(addHours(conv.booking.startTime, -3))}
              </p>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Open chat
  return (
    <div className="flex flex-col h-full">
      {header}

      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-2 bg-[var(--color-bg)]">
        <div className="flex justify-center mb-2">
          <div className="flex items-center gap-1.5 bg-white border border-[var(--color-border)] rounded-full px-3 py-1.5">
            <IconCalendar size={11} stroke={1.5} className="text-[var(--color-amber)]" />
            <span className="text-[10px] text-[var(--color-gray)]">
              {conv.booking.service} · {fmtDate(conv.booking.startTime)}, {fmtTime(conv.booking.startTime)} – {fmtTime(conv.booking.endTime)}
            </span>
          </div>
        </div>

        {messages.map(msg => (
          <div key={msg.id} className={`flex ${msg.senderId === 'me' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[72%] rounded-[14px] px-3.5 py-2.5 ${
              msg.senderId === 'me'
                ? 'bg-[var(--color-amber)] text-white rounded-br-[4px]'
                : 'bg-white border border-[var(--color-border)] text-[var(--color-dark)] rounded-bl-[4px]'
            }`}>
              <p className="text-[13px] leading-relaxed">{msg.text}</p>
              <p className={`text-[10px] mt-0.5 ${msg.senderId === 'me' ? 'text-white/70' : 'text-[var(--color-gray)]'}`}>
                {msg.time}
              </p>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="bg-white border-t border-[var(--color-border)] px-4 py-3 flex items-center gap-2 flex-shrink-0">
        <input
          type="text"
          placeholder="Type a message..."
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && send()}
          className="flex-1 h-10 px-3 rounded-[10px] bg-[var(--color-gray-light)] border border-[var(--color-border)] text-[13px] placeholder:text-[var(--color-gray)] focus:outline-none focus:border-[var(--color-amber)] transition-colors"
        />
        <button
          onClick={send}
          disabled={!text.trim()}
          className="w-10 h-10 rounded-[10px] bg-[var(--color-amber)] flex items-center justify-center disabled:opacity-40 transition-opacity"
        >
          <IconSend size={16} stroke={1.5} color="white" />
        </button>
      </div>
    </div>
  )
}

// ─── EmptyChat ────────────────────────────────────────────────────────────────

function EmptyChat() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center px-6">
      <div className="w-16 h-16 rounded-full bg-[var(--color-amber-light)] flex items-center justify-center">
        <IconMessages size={28} stroke={1.5} color="var(--color-amber)" />
      </div>
      <div>
        <p className="text-[15px] font-semibold text-[var(--color-dark)]">Your messages</p>
        <p className="text-[13px] text-[var(--color-gray)] mt-1 max-w-[240px]">
          Select a conversation to read and reply to your companions
        </p>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MessagesPage() {
  const { conversationId } = useParams()
  const navigate = useNavigate()
  const [activeId, setActiveId] = useState<string | null>(conversationId ?? null)

  function handleSelect(id: string) {
    setActiveId(id)
    navigate(`/app/messages/${id}`)
  }

  function handleBack() {
    setActiveId(null)
    navigate('/app/messages')
  }

  return (
    <div className="flex bg-white" style={{ height: 'calc(100vh - 52px)' }}>
      <div className={`flex-col border-r border-[var(--color-border)] bg-white
        w-full md:w-[320px] lg:w-[360px] flex-shrink-0
        ${activeId ? 'hidden md:flex' : 'flex'}
      `}>
        <ConversationList onSelect={handleSelect} activeId={activeId} />
      </div>

      <div className={`flex-col flex-1 ${activeId ? 'flex' : 'hidden md:flex'}`}>
        {activeId
          ? <ChatView conversationId={activeId} onBack={handleBack} />
          : <EmptyChat />
        }
      </div>
    </div>
  )
}
