<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';
import { useBackendSocket } from '../composables/useBackendSocket';

const isExpanded = ref(false);
const activeTab = ref<'system' | 'media' | 'clipboard' | 'shortcuts'>('system');
const autoStart = ref(false);
const copiedId = ref<number | null>(null);

const { telemetry, clipboardHistory, notification, isConnected, fetchClipboard } = useBackendSocket();

onMounted(async () => {
  if (window.electronAPI?.getStartup) {
    autoStart.value = await window.electronAPI.getStartup();
  }
  window.electronAPI?.onToggleExpand((val: boolean) => {
    isExpanded.value = val;
  });
});

const toggleAutoStart = () => {
  autoStart.value = !autoStart.value;
  window.electronAPI?.setStartup(autoStart.value);
};

watch(notification, (newVal) => {
  if (newVal) {
    isExpanded.value = true;
    window.electronAPI?.setIgnoreMouseEvents(false);
  }
});

const handleMouseEnter = () => {
  isExpanded.value = true;
  window.electronAPI?.setIgnoreMouseEvents(false);
  fetchClipboard();
};

const handleMouseLeave = () => {
  if (!notification.value) {
    isExpanded.value = false;
    window.electronAPI?.setIgnoreMouseEvents(true);
  }
};

const dismissNotification = () => {
  notification.value = null;
  isExpanded.value = false;
  window.electronAPI?.setIgnoreMouseEvents(true);
};

const runShortcut = async (target: string) => {
  await fetch('http://127.0.0.1:8000/api/v1/actions/trigger', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action_id: crypto.randomUUID(), target }),
  });
};

const sendMediaCommand = async (command: string) => {
  await fetch('http://127.0.0.1:8000/api/v1/media/control', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ command }),
  });
};

const saveCurrentClipboard = async () => {
  try {
    const text = await navigator.clipboard.readText();
    if (text) {
      await fetch('http://127.0.0.1:8000/api/v1/clipboard/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: text }),
      });
      await fetchClipboard();
    }
  } catch (e) {
    console.error(e);
  }
};

const copyToClipboard = async (id: number, text: string) => {
  await navigator.clipboard.writeText(text);
  copiedId.value = id;
  setTimeout(() => {
    copiedId.value = null;
  }, 1200);
};
</script>

<template>
  <div class="w-full flex justify-center pt-1.5 select-none">
    <div
      @mouseenter="handleMouseEnter"
      @mouseleave="handleMouseLeave"
      :class="[
        'bg-black text-white ring-1 ring-white/15 shadow-[0_14px_32px_rgba(0,0,0,0.9)] transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] overflow-hidden',
        isExpanded
          ? 'w-[440px] h-[215px] rounded-[28px] p-3.5'
          : 'w-[240px] h-[36px] rounded-full px-3.5 flex items-center justify-between'
      ]"
    >
      <!-- PÍLDORA COMPACTA -->
      <div v-if="!isExpanded" class="w-full flex items-center justify-between text-[11px] font-medium tracking-tight">
        <div class="flex items-center gap-2 truncate max-w-[140px]">
          <span
            :class="[
              'w-2 h-2 rounded-full shrink-0',
              isConnected ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]' : 'bg-rose-500 animate-pulse'
            ]"
          ></span>
          <span class="truncate text-zinc-100">
            {{
              !isConnected
                ? 'Conectando...'
                : telemetry.media.title !== 'Sin reproducción' && telemetry.media.title !== 'Cargando...'
                  ? telemetry.media.title
                  : `CPU ${telemetry.cpu_percent.toFixed(0)}%`
            }}
          </span>
        </div>

        <div class="flex items-center gap-1.5 shrink-0">
          <span class="px-2 py-0.5 rounded-full bg-zinc-900 text-zinc-300 border border-white/5">
            RAM {{ telemetry.ram_percent.toFixed(0) }}%
          </span>
        </div>
      </div>

      <!-- VISTA EXPANDIDA -->
      <div v-else class="flex flex-col justify-between h-full">
        <!-- NOTIFICACIÓN EMERGENTE -->
        <div v-if="notification" class="flex flex-col justify-between h-full p-1">
          <div class="flex justify-between items-center">
            <span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 uppercase tracking-wider">
              {{ notification.type }}
            </span>
            <button @click="dismissNotification" class="text-xs text-zinc-400 hover:text-white cursor-pointer">✕</button>
          </div>
          <div class="my-auto px-1">
            <p class="text-sm font-semibold text-white truncate">{{ notification.title }}</p>
            <p class="text-xs text-zinc-400 line-clamp-2 mt-0.5">{{ notification.message }}</p>
          </div>
          <div class="text-[10px] text-zinc-500 text-center">Notificación en tiempo real</div>
        </div>

        <!-- INTERFAZ PRINCIPAL POR PESTAÑAS -->
        <template v-else>
          <!-- Barra de navegación estilo iOS Segmented Control -->
          <div class="grid grid-cols-4 gap-1 bg-zinc-900/90 p-1 rounded-2xl border border-white/5">
            <button
              @click="activeTab = 'system'"
              :class="['text-[11px] py-1 rounded-xl transition font-medium cursor-pointer', activeTab === 'system' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-200']"
            >
              Sistema
            </button>
            <button
              @click="activeTab = 'media'"
              :class="['text-[11px] py-1 rounded-xl transition font-medium cursor-pointer', activeTab === 'media' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-200']"
            >
              Música
            </button>
            <button
              @click="activeTab = 'clipboard'"
              :class="['text-[11px] py-1 rounded-xl transition font-medium cursor-pointer', activeTab === 'clipboard' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-200']"
            >
              Portapapeles
            </button>
            <button
              @click="activeTab = 'shortcuts'"
              :class="['text-[11px] py-1 rounded-xl transition font-medium cursor-pointer', activeTab === 'shortcuts' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-200']"
            >
              Atajos
            </button>
          </div>

          <!-- PESTAÑA 1: SISTEMA -->
          <div v-if="activeTab === 'system'" class="flex flex-col justify-between h-full pt-2.5">
            <div class="grid grid-cols-2 gap-2.5">
              <div class="bg-zinc-900/80 border border-white/5 rounded-2xl p-2.5">
                <div class="flex justify-between text-xs mb-1.5">
                  <span class="text-zinc-400">CPU</span>
                  <span class="font-semibold text-indigo-400">{{ telemetry.cpu_percent.toFixed(0) }}%</span>
                </div>
                <div class="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                  <div class="bg-indigo-500 h-full transition-all duration-500" :style="{ width: telemetry.cpu_percent + '%' }"></div>
                </div>
              </div>

              <div class="bg-zinc-900/80 border border-white/5 rounded-2xl p-2.5">
                <div class="flex justify-between text-xs mb-1.5">
                  <span class="text-zinc-400">RAM</span>
                  <span class="font-semibold text-emerald-400">{{ telemetry.ram_percent.toFixed(0) }}%</span>
                </div>
                <div class="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                  <div class="bg-emerald-500 h-full transition-all duration-500" :style="{ width: telemetry.ram_percent + '%' }"></div>
                </div>
              </div>
            </div>

            <div class="flex justify-between items-center bg-zinc-900/60 border border-white/5 rounded-2xl px-3 py-2">
              <div class="flex items-center gap-2">
                <span class="text-xs text-zinc-300">Iniciar con Windows</span>
                <span class="text-[10px] px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400">Bat {{ telemetry.battery }}%</span>
              </div>
              <button
                @click="toggleAutoStart"
                :class="[
                  'px-3 py-1 rounded-xl text-[11px] font-semibold transition cursor-pointer',
                  autoStart ? 'bg-indigo-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:text-white'
                ]"
              >
                {{ autoStart ? 'Activo' : 'Inactivo' }}
              </button>
            </div>
          </div>

          <!-- PESTAÑA 2: MÚSICA -->
          <div v-if="activeTab === 'media'" class="flex flex-col justify-between h-full pt-2.5">
            <div class="bg-zinc-900/80 border border-white/5 rounded-2xl p-3 flex items-center justify-between">
              <div class="truncate pr-3">
                <p class="text-[10px] uppercase tracking-wider text-indigo-400 font-semibold">
                  {{ telemetry.media.playback_status === 'Playing' ? 'Reproduciendo' : 'En pausa' }}
                </p>
                <p class="text-sm font-semibold text-white truncate mt-0.5">{{ telemetry.media.title }}</p>
                <p class="text-xs text-zinc-400 truncate">{{ telemetry.media.artist }}</p>
              </div>
              <div class="flex items-center gap-1.5 shrink-0">
                <button @click="sendMediaCommand('previous')" class="w-8 h-8 rounded-xl bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-xs transition cursor-pointer">⏮</button>
                <button @click="sendMediaCommand('play_pause')" class="px-3.5 h-8 rounded-xl bg-white text-black font-bold text-xs hover:bg-zinc-200 transition cursor-pointer">
                  {{ telemetry.media.playback_status === 'Playing' ? 'Pausa' : 'Play' }}
                </button>
                <button @click="sendMediaCommand('next')" class="w-8 h-8 rounded-xl bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-xs transition cursor-pointer">⏭</button>
              </div>
            </div>
            <p class="text-[10px] text-zinc-500 text-center">Atajo global: Tecla Play/Pause o Ctrl+Shift+Espacio</p>
          </div>

          <!-- PESTAÑA 3: PORTAPAPELES -->
          <div v-if="activeTab === 'clipboard'" class="flex flex-col justify-between h-full pt-2">
            <div class="flex justify-between items-center mb-1.5 px-1">
              <span class="text-[11px] text-zinc-400">Historial en SQLite</span>
              <button
                @click="saveCurrentClipboard"
                class="text-[11px] px-2.5 py-0.5 rounded-lg bg-indigo-600/20 text-indigo-300 hover:bg-indigo-600/30 border border-indigo-500/30 transition cursor-pointer"
              >
                + Guardar actual
              </button>
            </div>
            <div class="overflow-y-auto max-h-[100px] space-y-1 pr-1">
              <div v-if="clipboardHistory.length === 0" class="text-xs text-zinc-500 py-5 text-center bg-zinc-900/50 rounded-2xl border border-white/5">
                Copia un texto y pulsa «+ Guardar actual»
              </div>
              <div
                v-for="item in clipboardHistory"
                :key="item.id"
                @click="copyToClipboard(item.id, item.content)"
                class="bg-zinc-900/90 hover:bg-zinc-800 border border-white/5 px-3 py-1.5 rounded-xl text-xs flex justify-between items-center cursor-pointer transition"
              >
                <span class="truncate text-zinc-200 pr-2">{{ item.content }}</span>
                <span class="text-[10px] font-medium px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-400 shrink-0">
                  {{ copiedId === item.id ? '¡Copiado!' : 'Copiar' }}
                </span>
              </div>
            </div>
          </div>

          <!-- PESTAÑA 4: ATAJOS -->
          <div v-if="activeTab === 'shortcuts'" class="grid grid-cols-3 gap-2.5 pt-2.5 h-full">
            <button
              @click="runShortcut('terminal')"
              class="bg-zinc-900/90 hover:bg-zinc-800 border border-white/5 active:scale-95 transition rounded-2xl flex flex-col items-center justify-center gap-1 cursor-pointer"
            >
              <span class="text-base font-mono text-indigo-400">&gt;_</span>
              <span class="text-xs font-medium text-zinc-200">Terminal</span>
            </button>
            <button
              @click="runShortcut('taskmgr')"
              class="bg-zinc-900/90 hover:bg-zinc-800 border border-white/5 active:scale-95 transition rounded-2xl flex flex-col items-center justify-center gap-1 cursor-pointer"
            >
              <span class="text-base text-emerald-400">⚡</span>
              <span class="text-xs font-medium text-zinc-200">Procesos</span>
            </button>
            <button
              @click="runShortcut('calculator')"
              class="bg-zinc-900/90 hover:bg-zinc-800 border border-white/5 active:scale-95 transition rounded-2xl flex flex-col items-center justify-center gap-1 cursor-pointer"
            >
              <span class="text-base text-amber-400">±</span>
              <span class="text-xs font-medium text-zinc-200">Calculadora</span>
            </button>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>