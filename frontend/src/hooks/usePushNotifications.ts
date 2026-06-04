import { useEffect } from 'react';
import { client } from '../api/client';
import { useAuthStore } from '../store/authStore';

const VAPID_PUBLIC_KEY = 'BPhaAtyzm1IE3KBKgmCVUGwZ8btdLHmRrWjLU33n1cbZTvBLkDMnfkQuOWSkL5kvGzIFIOap3-Y3Sws4zGYZh54';

function urlBase64ToUint8Array(base64: string): ArrayBuffer {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(b64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr.buffer as ArrayBuffer;
}

export function usePushNotifications() {
  const token = useAuthStore((s) => s.token);

  useEffect(() => {
    if (!token) return;
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;

    const register = async () => {
      try {
        const reg = await navigator.serviceWorker.register('/sw.js');

        const permission = await Notification.requestPermission();
        if (permission !== 'granted') return;

        const existing = await reg.pushManager.getSubscription();
        const sub = existing ?? await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
        });

        const { endpoint, keys } = sub.toJSON() as { endpoint: string; keys: { p256dh: string; auth: string } };
        await client.post('/notifications/push-subscribe', { endpoint, p256dh: keys.p256dh, auth: keys.auth });
      } catch {
        // Silently fail — push is non-critical
      }
    };

    register();
  }, [token]);
}
