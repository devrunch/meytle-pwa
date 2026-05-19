import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { IconArrowLeft, IconSend, IconSearch, IconMessages } from '@tabler/icons-react'
import { Avatar } from '../../components/ui'

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
  messages: Message[]
}

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
    messages: [
      { id: '1', senderId: 'them', text: 'Hey! I confirmed your booking for tomorrow.', time: '10:30 AM' },
      { id: '2', senderId: 'me',   text: 'Great, really excited!', time: '10:32 AM' },
      { id: '3', senderId: 'them', text: 'Looking forward to our coffee date!', time: '10:33 AM' },
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
    messages: [
      { id: '1', senderId: 'me',   text: 'Hi Kabir, looking forward to dinner!', time: '9:00 AM' },
      { id: '2', senderId: 'them', text: 'The restaurant has a 7pm reservation.', time: '9:45 AM' },
    ],
  },
  {
    id: '3',
    name: 'Priya',
    initials: 'P',
    avatarUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop&crop=face',
    lastMessage: 'Your session is confirmed for Saturday morning.',
    time: 'Yesterday',
    unread: 0,
    online: false,
    messages: [
      { id: '1', senderId: 'them', text: 'Your session is confirmed for Saturday morning.', time: 'Yesterday' },
    ],
  },
]

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
      {/* Header */}
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

      {/* List */}
      <div className="flex-1 overflow-y-auto divide-y divide-[var(--color-border)]">
        {filtered.map(conv => (
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
              <p className="text-[12px] text-[var(--color-gray)] truncate">{conv.lastMessage}</p>
            </div>
            {conv.unread > 0 && (
              <div className="w-5 h-5 rounded-full bg-[var(--color-amber)] flex items-center justify-center flex-none">
                <span className="text-[10px] text-white font-bold">{conv.unread}</span>
              </div>
            )}
          </button>
        ))}

        {filtered.length === 0 && (
          <div className="py-16 text-center">
            <p className="text-[14px] text-[var(--color-gray)]">No conversations found</p>
          </div>
        )}
      </div>
    </div>
  )
}

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

  if (!conv) return null

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

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="bg-white border-b border-[var(--color-border)] px-4 py-3 flex items-center gap-3 flex-shrink-0">
        <button onClick={onBack} className="text-[var(--color-dark)] mr-1 md:hidden">
          <IconArrowLeft size={20} stroke={1.5} />
        </button>
        <Avatar src={conv.avatarUrl} initials={conv.initials} size="md" online={conv.online} />
        <div className="flex-1">
          <p className="text-[15px] font-semibold text-[var(--color-dark)]">{conv.name}</p>
          <p className="text-[11px] text-[var(--color-gray)]">{conv.online ? 'Online now' : 'Offline'}</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-2 bg-[var(--color-bg)]">
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
      </div>

      {/* Input */}
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

      {/* Conversation list — full width on mobile (when no chat open), sidebar on desktop */}
      <div className={`flex-col border-r border-[var(--color-border)] bg-white
        w-full md:w-[320px] lg:w-[360px] flex-shrink-0
        ${activeId ? 'hidden md:flex' : 'flex'}
      `}>
        <ConversationList onSelect={handleSelect} activeId={activeId} />
      </div>

      {/* Chat panel — full width on mobile (when open), flex-1 on desktop */}
      <div className={`flex-col flex-1 ${activeId ? 'flex' : 'hidden md:flex'}`}>
        {activeId
          ? <ChatView conversationId={activeId} onBack={handleBack} />
          : <EmptyChat />
        }
      </div>

    </div>
  )
}
