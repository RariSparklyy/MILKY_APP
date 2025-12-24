<script setup>
import { computed, watch, onUnmounted } from 'vue';
import { Play, Pause, RotateCcw } from 'lucide-vue-next';
import { useFocusStore } from '../stores/useFocusStore';
import { useMilky } from '../composables/useMilky';

const store = useFocusStore();
const { askMilky } = useMilky();
let interval = null;

// Visual Math for SVG Ring [cite: 420]
const radius = 120;
const circumference = 2 * Math.PI * radius;
const dashOffset = computed(() => {
  if (store.timer.mode === 'hyperfocus') return 0; // Full ring during hyperfocus
  const percent = Math.max(0, store.timer.timeLeft) / store.timer.initialDuration;
  return circumference * (1 - percent);
});

const formatTime = computed(() => {
  const absSeconds = Math.abs(store.timer.timeLeft);
  const m = Math.floor(absSeconds / 60);
  const s = absSeconds % 60;
  return `${store.timer.timeLeft < 0 ? '+' : ''}${m}:${s.toString().padStart(2, '0')}`;
});

const toggleTimer = () => {
  store.timer.isRunning = !store.timer.isRunning;
  if (store.timer.isRunning) {
    interval = setInterval(() => {
      store.timer.timeLeft--;
      
      // Hyperfocus Logic: If < 0, we don't stop. We enter Hyperfocus.
      if (store.timer.timeLeft < 0 && store.timer.mode === 'focus') {
        store.timer.mode = 'hyperfocus';
      }
    }, 1000);
  } else {
    clearInterval(interval);
  }
};

// AI Watcher: When session ends
const stopSession = async () => {
  store.timer.isRunning = false;
  clearInterval(interval);
  
  // 1. Add a temporary "Thinking" log so the user sees immediate feedback
  store.addMilkyLog("Analyzing your session... processing data...");
  
  // 2. Generate the prompt
  const prompt = `User finished a ${store.timer.mode} session. Duration: ${store.timer.initialDuration} seconds. Provide a summary with formatting.`;
  
  // 3. Ask Milky
  const response = await askMilky(prompt, "Be brief, supportive, and use bolding for key stats.");
  
  // 4. Update the latest log with the real response
  // Since we just added the "Thinking" log, it's at index 0. We can overwrite it.
  store.milkyLogs[0].text = response;
  
  // Reset Timer
  store.timer.timeLeft = 25 * 60;
  store.timer.mode = 'focus';
};

onUnmounted(() => clearInterval(interval));
</script>

<template>
  <div class="flex flex-col items-center p-6 bg-surface rounded-xl shadow-lg border border-slate-700">
    <div class="relative mb-6">
      <svg class="w-64 h-64 transform -rotate-90">
        <circle cx="128" cy="128" :r="radius" stroke="#334155" stroke-width="8" fill="transparent" />
        <circle 
          cx="128" cy="128" :r="radius" 
          stroke="currentColor" stroke-width="8" fill="transparent"
          :stroke-dasharray="circumference"
          :stroke-dashoffset="dashOffset"
          class="transition-all duration-1000 ease-linear"
          :class="store.timer.mode === 'hyperfocus' ? 'text-purple-500' : 'text-primary'"
        />
      </svg>
      <div class="absolute inset-0 flex flex-col items-center justify-center">
        <span class="text-5xl font-mono font-bold tracking-wider" 
              :class="store.timer.mode === 'hyperfocus' ? 'text-purple-400' : 'text-slate-100'">
          {{ formatTime }}
        </span>
        <span class="text-xs uppercase tracking-widest text-muted mt-2">{{ store.timer.mode }}</span>
      </div>
    </div>

    <div class="flex gap-4">
      <button @click="toggleTimer" class="p-4 bg-slate-800 rounded-full hover:bg-slate-700 transition">
        <component :is="store.timer.isRunning ? Pause : Play" class="w-6 h-6 text-primary" />
      </button>
      <button @click="stopSession" class="p-4 bg-slate-800 rounded-full hover:bg-slate-700 transition">
        <RotateCcw class="w-6 h-6 text-muted" />
      </button>
    </div>
  </div>
</template>