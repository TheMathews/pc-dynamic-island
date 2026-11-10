import { ref, onMounted, onUnmounted } from 'vue';

export interface MediaData {
  title: string;
  artist: string;
  playback_status: string;
}

export interface ClipboardItem {
  id: number;
  content: string;
  timestamp: string;
}

export interface NotificationData {
  title: string;
  message: string;
  type: string;
}

export interface TelemetryData {
  cpu_percent: number;
  ram_percent: number;
  battery: number;
  media: MediaData;
}

export function useBackendSocket(url = 'ws://127.0.0.1:8000/ws/telemetry') {
  const telemetry = ref<TelemetryData>({
    cpu_percent: 0,
    ram_percent: 0,
    battery: 100,
    media: { title: 'Cargando...', artist: '—', playback_status: 'Closed' }
  });
  const clipboardHistory = ref<ClipboardItem[]>([]);
  const notification = ref<NotificationData | null>(null);
  const isConnected = ref(false);
  let socket: WebSocket | null = null;
  let hideTimer: number | null = null;

  const fetchClipboard = async () => {
    try {
      const res = await fetch('http://127.0.0.1:8000/api/v1/clipboard/history');
      const data = await res.json();
      clipboardHistory.value = data.items || [];
    } catch (e) {
      console.error('Error fetching clipboard', e);
    }
  };

  const connect = () => {
    socket = new WebSocket(url);
    socket.onopen = () => { isConnected.value = true; };
    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'TELEMETRY_UPDATE') {
        telemetry.value = data;
        if (data.notification) {
          notification.value = data.notification;
          if (hideTimer) clearTimeout(hideTimer);
          hideTimer = window.setTimeout(() => {
            notification.value = null;
          }, 4000);
        }
      }
    };
    socket.onclose = () => {
      isConnected.value = false;
      setTimeout(connect, 2000);
    };
  };

  onMounted(() => {
    connect();
    fetchClipboard();
    setInterval(fetchClipboard, 5000);
  });

  onUnmounted(() => socket?.close());

  return { telemetry, clipboardHistory, notification, isConnected, fetchClipboard };
}