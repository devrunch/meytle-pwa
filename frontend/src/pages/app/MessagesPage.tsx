import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  IconArrowLeft, IconSend, IconSearch, IconMessages,
  IconLock, IconCalendar,
} from '@tabler/icons-react'
import { Avatar } from '../../components/ui'
import { api } from '../../lib/api'
import { connectSocket, disconnectSocket, getSocket } from '../../lib/socket'
import { useAuthStore } from '../../store/auth'

// ─── Types ───────────────────────────────────────────────────────────────────

type BookingStatus = 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled'

interface ApiBooking {
  id: string
  serviceType: string
  bookedStart: string
  bookedEnd: string
  status: BookingStatus
  companion?: {
    id: string
    displayName: string
    profilePhotoUrl: string
    isAvailableNow: boolean
  }
}

interface ApiMessage {
  id: string
  senderId: string
  content: string
  sentAt: string
}

interface Conversation {
  bookingId: string
  name: string
  initials: string
  avatarUrl?: string
  online: boolean
  service: string
  bookedStart: Date
  bookedEnd: Date
  status: BookingStatus
  lastMessage: string
  time: string
  unread: number
}

interface Message {
  id: string
  senderId: 'me' | 'other'
  text: string
  time: string
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

function getMessagingState(status: BookingStatus, bookedStart: Date, bookedEnd: Date, service: string) {
  const now = new Date()
  const windowOpen = addHours(bookedStart, -3)

  if (status === 'pending') {
    return { canMessage: false, reason: 'Waiting for confirmation', detail: 'Messaging opens once the companion accepts your booking request.' }
  }
  if (status === 'cancelled') {
    return { canMessage: false, reason: 'Booking cancelled', detail: 'This booking was cancelled.' }
  }
  if (status === 'completed' && now > addHours(bookedEnd, 24)) {
    return { canMessage: false, reason: 'Chat closed', detail: `Your ${service} session chat has closed.` }
  }
  if (now < windowOpen) {
    const diffMs = windowOpen.getTime() - now.getTime()
    const diffH = Math.floor(diffMs / (1000 * 60 * 60))
    const diffM = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
    const timeLabel = diffH > 0 ? `${diffH}h ${diffM}m` : `${diffM}m`
    return {
      canMessage: false,
      reason: 'Too early to message',
      detail: `Chat unlocks 3 hours before your booking on ${fmtDate(bookedStart)} at ${fmtTime(bookedStart)}. Opens in ${timeLabel}.`,
    }
  }
  return { canMessage: true, reason: '', detail: '' }
}

function statusDotColor(status: BookingStatus): string {
  if (status === 'pending')   return 'bg-yellow-400'
  if (status === 'confirmed' || status === 'in_progress') return 'bg-[var(--color-success)]'
  if (status === 'completed') return 'bg-[var(--color-border)]'
  return 'bg-[var(--color-error)]'
}

function statusLabel(status: BookingStatus): string {
  if (status === 'pending')     return 'Pending'
  if (status === 'confirmed')   return 'Confirmed'
  if (status === 'in_progress') return 'In Progress'
  if (status === 'completed')   return 'Done'
  return 'Cancelled'
}

// ─── ConversationList ────────────────────────────────────────────────────────

function ConversationList({ conversations, activeId, onSelect, loading }: {
  conversations: Conversation[]
  activeId: string | null
  onSelect: (id: string) => void
  loading: boolean
}) {
  const [search, setSearch] = useState('')
  const filtered = conversations.filter(c => c.name.toLowerCase().includes(search.toLowerCase()))

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
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-3 animate-pulse">
              <div className="w-10 h-10 rounded-full bg-[var(--color-gray-light)]" />
              <div className="flex-1 flex flex-col gap-1.5">
                <div className="h-3 w-24 rounded bg-[var(--color-gray-light)]" />
                <div className="h-2.5 w-40 rounded bg-[var(--color-gray-light)]" />
              </div>
            </div>
          ))
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-[14px] text-[var(--color-gray)]">No conversations yet</p>
            <p className="text-[11px] text-[var(--color-gray)] mt-1">Confirmed bookings will appear here</p>
          </div>
        ) : (
          filtered.map(conv => {
            const { canMessage } = getMessagingState(conv.status, conv.bookedStart, conv.bookedEnd, conv.service)
            return (
              <button
                key={conv.bookingId}
                onClick={() => onSelect(conv.bookingId)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                  activeId === conv.bookingId
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
                  <p className="text-[12px] text-[var(--color-gray)] truncate mb-1">{conv.service}</p>
                  <div className="flex items-center gap-1.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${statusDotColor(conv.status)}`} />
                    <span className="text-[10px] text-[var(--color-gray)]">{statusLabel(conv.status)}</span>
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
          })
        )}
      </div>
    </div>
  )
}

// ─── ChatView ────────────────────────────────────────────────────────────────

function ChatView({ conv, myUserId, onBack }: {
  conv: Conversation
  myUserId: string
  onBack: () => void
}) {
  const [text, setText] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [loadingMsgs, setLoadingMsgs] = useState(true)
  const bottomRef = useRef<HTMLDivElement>(null)
  const [, setTick] = useState(0)

  const { canMessage, reason, detail } = getMessagingState(conv.status, conv.bookedStart, conv.bookedEnd, conv.service)

  // Fetch message history
  useEffect(() => {
    setLoadingMsgs(true)
    api.get<ApiMessage[]>(`/bookings/${conv.bookingId}/messages`)
      .then(res => {
        setMessages(res.data.map(m => ({
          id: m.id,
          senderId: m.senderId === myUserId ? 'me' : 'other',
          text: m.content,
          time: fmtTime(new Date(m.sentAt)),
        })))
      })
      .catch(() => setMessages([]))
      .finally(() => setLoadingMsgs(false))
  }, [conv.bookingId, myUserId])

  // Socket room management
  useEffect(() => {
    const socket = getSocket()
    socket.emit('join', conv.bookingId)

    const onMessage = (msg: ApiMessage) => {
      setMessages(prev => [
        ...prev,
        {
          id: msg.id,
          senderId: msg.senderId === myUserId ? 'me' : 'other',
          text: msg.content,
          time: fmtTime(new Date(msg.sentAt)),
        },
      ])
    }

    socket.on('message', onMessage)

    return () => {
      socket.emit('leave', conv.bookingId)
      socket.off('message', onMessage)
    }
  }, [conv.bookingId, myUserId])

  // Re-evaluate messaging window state every 30s
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 30_000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  function send() {
    if (!text.trim()) return
    getSocket().emit('send', { bookingId: conv.bookingId, content: text.trim() })
    setText('')
  }

  const header = (
    <div className="bg-white border-b border-[var(--color-border)] px-4 py-3 flex items-center gap-3 flex-shrink-0">
      <button onClick={onBack} className="text-[var(--color-dark)] mr-1 md:hidden">
        <IconArrowLeft size={20} stroke={1.5} />
      </button>
      <Avatar src={conv.avatarUrl} initials={conv.initials} size="md" online={conv.online} />
      <div className="flex-1 min-w-0">
        <p className="text-[15px] font-semibold text-[var(--color-dark)]">{conv.name}</p>
        <div className="flex items-center gap-1.5">
          <span className={`w-1.5 h-1.5 rounded-full flex-none ${statusDotColor(conv.status)}`} />
          <p className="text-[11px] text-[var(--color-gray)]">
            {conv.service} · {fmtDate(conv.bookedStart)} {fmtTime(conv.bookedStart)}
          </p>
        </div>
      </div>
    </div>
  )

  if (!canMessage) {
    const isEarlyLock = (conv.status === 'confirmed' || conv.status === 'in_progress')
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
              <p className="text-[12px] font-semibold text-[var(--color-dark)]">{conv.service}</p>
              <span className={`ml-auto text-[10px] font-medium px-2 py-0.5 rounded-full ${
                conv.status === 'pending'
                  ? 'bg-yellow-100 text-yellow-700'
                  : 'bg-[var(--color-success-bg)] text-[var(--color-success)]'
              }`}>
                {statusLabel(conv.status)}
              </span>
            </div>
            <p className="text-[12px] text-[var(--color-gray)]">
              {fmtDate(conv.bookedStart)} · {fmtTime(conv.bookedStart)} – {fmtTime(conv.bookedEnd)}
            </p>
            {isEarlyLock && (
              <p className="text-[11px] text-[var(--color-amber)] mt-1.5 font-medium">
                Chat unlocks at {fmtTime(addHours(conv.bookedStart, -3))}
              </p>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {header}

      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-2 bg-[var(--color-bg)]">
        <div className="flex justify-center mb-2">
          <div className="flex items-center gap-1.5 bg-white border border-[var(--color-border)] rounded-full px-3 py-1.5">
            <IconCalendar size={11} stroke={1.5} className="text-[var(--color-amber)]" />
            <span className="text-[10px] text-[var(--color-gray)]">
              {conv.service} · {fmtDate(conv.bookedStart)}, {fmtTime(conv.bookedStart)} – {fmtTime(conv.bookedEnd)}
            </span>
          </div>
        </div>

        {loadingMsgs ? (
          <div className="flex flex-col gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className={`flex ${i % 2 === 0 ? 'justify-start' : 'justify-end'}`}>
                <div className="h-9 w-40 rounded-[14px] bg-white border border-[var(--color-border)] animate-pulse" />
              </div>
            ))}
          </div>
        ) : (
          messages.map(msg => (
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
          ))
        )}
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
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const myUserId = useAuthStore(s => s.user?.id ?? '')

  // Fetch conversations from bookings
  const fetchConversations = useCallback(() => {
    api.get<ApiBooking[]>('/bookings')
      .then(res => {
        const convs: Conversation[] = res.data
          .filter(b => b.status !== 'cancelled' && b.companion)
          .map(b => {
            const name = b.companion!.displayName
            const initials = name.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2)
            const start = new Date(b.bookedStart)
            return {
              bookingId: b.id,
              name,
              initials,
              avatarUrl: b.companion!.profilePhotoUrl,
              online: b.companion!.isAvailableNow,
              service: b.serviceType,
              bookedStart: start,
              bookedEnd: new Date(b.bookedEnd),
              status: b.status,
              lastMessage: b.serviceType,
              time: start.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
              unread: 0,
            }
          })
        setConversations(convs)
      })
      .catch(() => setConversations([]))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    fetchConversations()
    connectSocket()
    return () => { disconnectSocket() }
  }, [fetchConversations])

  const activeConv = conversations.find(c => c.bookingId === activeId)

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
        <ConversationList
          conversations={conversations}
          activeId={activeId}
          onSelect={handleSelect}
          loading={loading}
        />
      </div>

      <div className={`flex-col flex-1 ${activeId ? 'flex' : 'hidden md:flex'}`}>
        {activeId && activeConv
          ? <ChatView conv={activeConv} myUserId={myUserId} onBack={handleBack} />
          : <EmptyChat />
        }
      </div>
    </div>
  )
}
