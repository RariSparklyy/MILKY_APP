<script setup>
import { computed, onUnmounted, ref, watch } from 'vue';
import { Play, Pause, RotateCcw, Eye, EyeOff } from 'lucide-vue-next';
import { useFocusStore } from '../stores/useFocusStore';
import { useMilky } from '../composables/useMilky';

const store = useFocusStore();
const { askMilky } = useMilky();
let interval = null;

// Local state for UI controls
const showDigitalTime = ref(true); 
const setTimeValue = ref(25); // Default slider value (minutes)

// Visual Math for SVG Ring
const radius = 120;
const circumference = 2 * Math.PI * radius;

// Update the store's duration whenever the slider moves
watch(setTimeValue, (newVal) => {
  if (!store.timer.isRunning) {
    store.timer.initialDuration = newVal * 60;
    store.timer.timeLeft = newVal * 60;
  }
});

const dashOffset = computed(() => {
  if (store.timer.mode === 'hyperfocus') return 0; // Ring stays full in hyperfocus
  const percent = Math.max(0, store.timer.timeLeft) / store.timer.initialDuration;
  return circumference * (1 - percent);
});

const formatTime = computed(() => {
  const absSeconds = Math.abs(store.timer.timeLeft);
  const m = Math.floor(absSeconds / 60);
  const s = absSeconds % 60;
  // If hidden, show nothing or a calm symbol
  if (!showDigitalTime.value && store.timer.isRunning) return ''; 
  return `${store.timer.timeLeft < 0 ? '+' : ''}${m}:${s.toString().padStart(2, '0')}`;
});

const toggleTimer = () => {
  store.timer.isRunning = !store.timer.isRunning;
  
  if (store.timer.isRunning) {
    interval = setInterval(() => {
      store.timer.timeLeft--;
      
      // Hyperfocus Logic: Crossing 0 into negative time
      if (store.timer.timeLeft < 0 && store.timer.mode === 'focus') {
        store.timer.mode = 'hyperfocus';
      } else if (store.timer.timeLeft <= 0 && store.timer.mode !== 'focus') {
        // Breaks shouldn't have hyperfocus, they just end
        stopSession(); 
      }
    }, 1000);
  } else {
    clearInterval(interval);
  }
};

const stopSession = async () => {
  store.timer.isRunning = false;
  clearInterval(interval);
  
  // Calculate REAL duration for AI
  const duration = store.timer.mode === 'hyperfocus' 
    ? store.timer.initialDuration + Math.abs(store.timer.timeLeft) 
    : store.timer.initialDuration - store.timer.timeLeft;

  // Trigger Mood Reflection
  store.lastSession = {
    duration: duration,
    mode: store.timer.mode,
    mood: null 
  };

  // Reset to the slider value
  store.timer.mode = 'focus';
  store.timer.timeLeft = setTimeValue.value * 60;
  store.timer.initialDuration = setTimeValue.value * 60;
};

// Preset Quick Actions
const setMode = (mode, minutes) => {
  store.timer.mode = mode;
  setTimeValue.value = minutes; // Update slider position
  store.timer.initialDuration = minutes * 60;
  store.timer.timeLeft = minutes * 60;
  store.timer.isRunning = false;
  clearInterval(interval);
};

onUnmounted(() => clearInterval(interval));
</script>

<template>
  <div class="flex flex-col items-center p-6 bg-surface rounded-xl shadow-lg border border-slate-700 w-full">
    
    <div class="relative mb-6 group">
      <svg class="w-64 h-64 transform -rotate-90">
        <circle cx="128" cy="128" :r="radius" stroke="#334155" stroke-width="8" fill="transparent" />
        
        <circle 
          cx="128" cy="128" :r="radius" 
          stroke="currentColor" stroke-width="8" fill="transparent"
          :stroke-dasharray="circumference"
          :stroke-dashoffset="dashOffset"
          class="transition-all duration-1000 ease-linear"
          :class="store.timer.mode === 'hyperfocus' ? 'text-purple-500' : store.timer.mode !== 'focus' ? 'text-blue-400' : 'text-primary'"
        />
      </svg>
      
      <div class="absolute inset-0 flex flex-col items-center justify-center">
        <span v-if="showDigitalTime || !store.timer.isRunning" 
              class="text-5xl font-mono font-bold tracking-wider text-slate-100">
          {{ formatTime }}
        </span>
        <span v-else class="text-primary animate-pulse">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </span>

        <span class="text-xs uppercase tracking-widest text-muted mt-2">
          {{ store.timer.mode === 'hyperfocus' ? 'Flow State' : store.timer.mode.replace('_', ' ') }}
        </span>
      </div>

      <button @click="showDigitalTime = !showDigitalTime" 
              class="absolute top-0 right-0 p-2 text-slate-600 hover:text-slate-300 transition opacity-0 group-hover:opacity-100"
              title="Toggle Digital Clock (Reduce Anxiety)">
        <component :is="showDigitalTime ? Eye : EyeOff" class="w-4 h-4" />
      </button>
    </div>

    <div v-if="!store.timer.isRunning" class="w-full px-4 mb-6 animate-fade-in">
      <div class="flex justify-between text-xs text-muted mb-2 uppercase tracking-wide">
        <span>Duration</span>
        <span class="text-primary font-bold">{{ setTimeValue }} min</span>
      </div>
      <input 
        type="range" 
        v-model.number="setTimeValue" 
        min="5" max="120" step="5"
        class="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-primary hover:accent-teal-300 transition-colors"
      />
      <div class="flex justify-between text-[10px] text-slate-600 mt-1">
        <span>5m</span>
        <span>1h</span>
        <span>2h</span>
      </div>
    </div>

    <div class="flex gap-4 mb-6">
      <button @click="toggleTimer" 
              class="p-4 rounded-full transition border border-slate-600 shadow-lg hover:scale-105 active:scale-95"
              :class="store.timer.isRunning ? 'bg-slate-800' : 'bg-primary'">
        <component :is="store.timer.isRunning ? Pause : Play" 
                   class="w-6 h-6" 
                   :class="store.timer.isRunning ? 'text-primary' : 'text-slate-900'" />
      </button>
      
      <button @click="stopSession" class="p-4 bg-slate-800 rounded-full hover:bg-slate-700 transition border border-slate-600" title="Finish Session">
        <RotateCcw class="w-6 h-6 text-muted" />
      </button>
    </div>

    <div class="grid grid-cols-3 gap-2 w-full">
      <button @click="setMode('focus', 25)" 
              class="py-2 rounded text-xs font-bold uppercase transition border border-transparent"
              :class="store.timer.mode === 'focus' ? 'bg-slate-700 text-primary border-primary/30' : 'bg-slate-900 text-slate-500 hover:text-slate-300'">
        Standard (25)
      </button>
      <button @click="setMode('short_break', 5)" 
              class="py-2 rounded text-xs font-bold uppercase transition border border-transparent"
              :class="store.timer.mode === 'short_break' ? 'bg-slate-700 text-blue-400 border-blue-400/30' : 'bg-slate-900 text-slate-500 hover:text-slate-300'">
        Short Break
      </button>
      <button @click="setMode('long_break', 15)" 
              class="py-2 rounded text-xs font-bold uppercase transition border border-transparent"
              :class="store.timer.mode === 'long_break' ? 'bg-slate-700 text-blue-500 border-blue-500/30' : 'bg-slate-900 text-slate-500 hover:text-slate-300'">
        Long Break
      </button>
    </div>
  </div>
</template>

<style scoped>
/* Custom Slider Styling for consistency */
input[type=range]::-webkit-slider-thumb {
  -webkit-appearance: none;
  height: 16px;
  width: 16px;
  border-radius: 50%;
  background: #2dd4bf; /* Primary Teal */
  margin-top: -4px;
  box-shadow: 0 0 10px rgba(45, 212, 191, 0.5);
}
</style>