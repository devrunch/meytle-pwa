import { io, type Socket } from 'socket.io-client'
import { useAuthStore } from '@/store/auth'

let socket: Socket | null = null

const WS_BASE = (import.meta.env.VITE_API_BASE_URL as string ?? '/api').replace(/\/api$/, '')

export function getSocket(): Socket {
  if (!socket) {
    socket = io(`${WS_BASE}/messages`, {
      auth: { token: useAuthStore.getState().token },
      autoConnect: false,
    })
  }
  return socket
}

export function connectSocket(): void {
  const s = getSocket()
  // Refresh token in case it changed since socket was created
  s.auth = { token: useAuthStore.getState().token }
  if (!s.connected) s.connect()
}

export function disconnectSocket(): void {
  socket?.disconnect()
  socket = null
}
