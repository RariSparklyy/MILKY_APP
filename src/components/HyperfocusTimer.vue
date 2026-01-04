<script setup>
import { computed, onUnmounted, ref, watch } from 'vue';
import { Play, Pause, RotateCcw, Eye, EyeOff, UserCheck, Info, X, Clock, Zap } from 'lucide-vue-next';
import { useFocusStore } from '../stores/useFocusStore';
import { useMilky } from '../composables/useMilky';

const store = useFocusStore();
const { askMilky } = useMilky();
let interval = null;

const showDigitalTime = ref(true); 
const setTimeValue = ref(25); 
const showInfo = ref(false); 

// Visual Math
const radius = 120;
const circumference = 2 * Math.PI * radius;

const sliderMax = computed(() => {
  if (store.timer.mode === 'short_break') return 10;
  return 120; 
});

watch(setTimeValue, (newVal) => {
  if (!store.timer.isRunning) {
    store.timer.initialDuration = newVal * 60;
    store.timer.timeLeft = newVal * 60;
  }
});

const dashOffset = computed(() => {
  if (store.timer.mode === 'hyperfocus') return 0; 
  const percent = Math.max(0, store.timer.timeLeft) / store.timer.initialDuration;
  return circumference * (1 - percent);
});

const formatTime = computed(() => {
  const absSeconds = Math.abs(store.timer.timeLeft);
  const m = Math.floor(absSeconds / 60);
  const s = absSeconds % 60;
  if (!showDigitalTime.value && store.timer.isRunning) return ''; 
  return `${store.timer.timeLeft < 0 ? '+' : ''}${m}:${s.toString().padStart(2, '0')}`;
});

const availableTasks = computed(() => store.tasks.filter(t => !t.completed));

const triggerCheckIn = async () => {
  if (!store.timer.bodyDoubleEnabled || !store.timer.activeTaskId) return;

  const taskName = store.getActiveTaskName();
  const loadingId = store.addMilkyLog("Checking in...", 'milky');

  const prompt = `
    User is ${Math.floor(store.timer.initialDuration / 60 / 2)} minutes into a session.
    Task: "${taskName}".
    Give a very brief, gentle check-in (1 sentence). 
  `;
  
  const response = await askMilky(prompt, "You are a gentle body double.");
  store.updateLogContent(loadingId, response);
};

const toggleTimer = async () => {
  store.timer.isRunning = !store.timer.isRunning;
  
  if (store.timer.isRunning) {
    if (store.timer.mode === 'focus' && store.timer.bodyDoubleEnabled && store.timer.activeTaskId) {
      const taskName = store.getActiveTaskName();
      store.addMilkyLog(`I'll be watching while you work on: "${taskName}". Good luck!`, 'milky');
    }

    interval = setInterval(() => {
      store.timer.timeLeft--;

      if (store.timer.mode === 'focus') {
        const midwayPoint = Math.floor(store.timer.initialDuration / 2);
        if (store.timer.timeLeft === midwayPoint) {
          triggerCheckIn();
        }
      }
      
      if (store.timer.timeLeft === 0 && store.timer.mode === 'focus') {
        store.timer.mode = 'hyperfocus';

        if (store.timer.bodyDoubleEnabled && store.timer.activeTaskId) {
          const taskName = store.getActiveTaskName();
          const loadingId = store.addMilkyLog("Hyperfocus activated! 🚀", 'milky');
          const prompt = `
            The timer just hit 00:00, but the user is still going!
            They have entered HYPERFOCUS mode on task: "${taskName}".
            Give them a short, high-energy encouragement.
          `;
          askMilky(prompt, "You are an excited flow-state coach.")
            .then(response => store.updateLogContent(loadingId, response));
        }
      }

      else if (store.timer.timeLeft <= 0 && (store.timer.mode === 'short_break' || store.timer.mode === 'long_break')) {
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
  
  const duration = store.timer.mode === 'hyperfocus' 
    ? store.timer.initialDuration + Math.abs(store.timer.timeLeft) 
    : store.timer.initialDuration - store.timer.timeLeft;

  store.lastSession = {
    duration: duration,
    mode: store.timer.mode,
    mood: null 
  };

  store.timer.mode = 'focus';
  store.timer.activeTaskId = null; 
  setTimeValue.value = 25;
  store.timer.timeLeft = 25 * 60;
  store.timer.initialDuration = 25 * 60;
};

const setMode = (mode, minutes) => {
  store.timer.mode = mode;
  setTimeValue.value = minutes; 
  store.timer.initialDuration = minutes * 60;
  store.timer.timeLeft = minutes * 60;
  store.timer.isRunning = false;
  clearInterval(interval);
};

onUnmounted(() => clearInterval(interval));
</script>

<template>
  <div class="flex flex-col items-center p-6 bg-surface rounded-xl shadow-lg border border-slate-700 w-full relative">
    
    <div class="absolute top-4 right-4 flex gap-2 z-10">
      <button @click="showDigitalTime = !showDigitalTime" class="p-2 text-slate-500 hover:text-slate-200 transition bg-slate-800/50 rounded-lg hover:bg-slate-700" title="Toggle Clock">
        <component :is="showDigitalTime ? Eye : EyeOff" class="w-4 h-4" />
      </button>
      <button @click="showInfo = true" class="p-2 text-slate-500 hover:text-primary transition bg-slate-800/50 rounded-lg hover:bg-slate-700" title="How to use">
        <Info class="w-4 h-4" />
      </button>
    </div>

    <Transition name="fade">
      <div v-if="showInfo" class="absolute inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/80 backdrop-blur-sm rounded-xl" @click="showInfo = false"></div>
        
        <div class="bg-slate-900 border border-slate-600 rounded-xl p-6 shadow-2xl relative w-full h-full overflow-y-auto custom-scrollbar">
          <button @click="showInfo = false" class="absolute top-4 right-4 text-slate-400 hover:text-slate-100">
            <X class="w-5 h-5" />
          </button>

          <h3 class="text-xl font-bold text-primary mb-4 flex items-center gap-2">
            <Info class="w-5 h-5" /> How to use Milky
          </h3>

          <div class="space-y-6 text-sm text-slate-300">
            
            <div class="bg-slate-800/50 p-3 rounded-lg border border-slate-700">
              <h4 class="font-bold text-slate-100 mb-2 flex items-center gap-2">
                <Clock class="w-4 h-4 text-blue-400" /> Adaptive Pomodoro
              </h4>
              <p class="mb-2">This is an evolved version of the Pomodoro technique.</p>
              <ul class="list-disc pl-4 space-y-1 text-slate-400">
                <li><strong>Dynamic Time:</strong> Use the slider to change duration instantly.</li>
                <li><strong>Hyperfocus Safety:</strong> If the timer hits 00:00 and you're in the zone, <span class="text-purple-400 font-bold">don't stop!</span> The timer will count UP (negative time) to track your flow state.</li>
              </ul>
            </div>

            <div class="bg-slate-800/50 p-3 rounded-lg border border-slate-700">
              <h4 class="font-bold text-slate-100 mb-2 flex items-center gap-2">
                <UserCheck class="w-4 h-4 text-primary" /> Body Double Mode
              </h4>
              <p class="text-slate-400">
                Turn this on and select a task. Milky becomes your accountability partner.
                It will check in on you halfway through, and you can chat with it for gentle pressure if you get distracted.
              </p>
            </div>

            <div class="bg-slate-800/50 p-3 rounded-lg border border-slate-700">
              <h4 class="font-bold text-slate-100 mb-2 flex items-center gap-2">
                <Zap class="w-4 h-4 text-yellow-400" /> Pro Tips
              </h4>
              <div class="space-y-2">
                <div class="flex gap-2 items-start">
                  <span class="text-xs font-bold bg-slate-700 px-1.5 rounded text-blue-300 mt-0.5">FOCUS</span>
                  <span class="text-slate-400">Start with 25m. If you feel resistance, lower it to 10m just to start.</span>
                </div>
                <div class="flex gap-2 items-start">
                  <span class="text-xs font-bold bg-slate-700 px-1.5 rounded text-green-300 mt-0.5">BREAK</span>
                  <span class="text-slate-400">Short breaks are capped at 10m to keep momentum. Stand up and hydrate!</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </Transition>

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
        <span v-if="showDigitalTime || !store.timer.isRunning" class="text-5xl font-mono font-bold tracking-wider text-slate-100">
          {{ formatTime }}
        </span>
        <span v-else class="text-primary animate-pulse">
           <UserCheck v-if="store.timer.bodyDoubleEnabled" class="w-12 h-12" />
           <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
             <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
           </svg>
        </span>
        <span class="text-xs uppercase tracking-widest text-muted mt-2">
          {{ store.timer.mode === 'hyperfocus' ? 'Flow State' : store.timer.mode.replace('_', ' ') }}
        </span>
      </div>
    </div>

    <div v-if="!store.timer.isRunning && store.timer.mode === 'focus'" class="w-full mb-6 animate-fade-in bg-slate-900/50 p-3 rounded-lg border border-slate-700">
      
      <div class="flex items-center justify-between mb-3 cursor-pointer" @click="store.timer.bodyDoubleEnabled = !store.timer.bodyDoubleEnabled">
        <div class="flex items-center gap-2">
          <UserCheck class="w-4 h-4" :class="store.timer.bodyDoubleEnabled ? 'text-primary' : 'text-slate-500'" />
          <span class="text-sm font-bold" :class="store.timer.bodyDoubleEnabled ? 'text-slate-200' : 'text-slate-500'">Body Double Mode</span>
        </div>
        <div class="w-8 h-4 rounded-full relative transition-colors" :class="store.timer.bodyDoubleEnabled ? 'bg-primary' : 'bg-slate-700'">
          <div class="absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full transition-all" 
               :class="store.timer.bodyDoubleEnabled ? 'translate-x-4' : 'translate-x-0'"></div>
        </div>
      </div>

      <div v-if="store.timer.bodyDoubleEnabled" class="animate-fade-in">
        <select v-model="store.timer.activeTaskId" 
                class="w-full bg-slate-800 text-sm text-slate-200 border border-slate-600 rounded px-2 py-2 outline-none focus:border-primary">
          <option :value="null" disabled>Select a task to focus on...</option>
          <option v-for="task in availableTasks" :key="task.id" :value="task.id">
            {{ task.text }}
          </option>
        </select>
      </div>
    </div>

    <div v-if="!store.timer.isRunning" class="w-full px-4 mb-6">
      <div class="flex justify-between text-xs text-muted mb-2 uppercase tracking-wide">
        <span>Duration</span>
        <span class="text-primary font-bold">{{ setTimeValue }} min</span>
      </div>
      
      <input 
        type="range" 
        v-model.number="setTimeValue" 
        min="1" 
        :max="sliderMax" 
        step="1" 
        class="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-primary hover:accent-teal-300 transition-colors" 
      />
      
      <div class="flex justify-between text-[10px] text-slate-600 mt-1">
        <span>1m</span>
        <span v-if="sliderMax === 10">5m</span>
        <span v-else>1h</span>
        <span>{{ sliderMax }}m</span>
      </div>
    </div>

    <div class="flex gap-4 mb-6">
      <button @click="toggleTimer" 
              :disabled="store.timer.mode === 'focus' && store.timer.bodyDoubleEnabled && !store.timer.activeTaskId"
              class="p-4 rounded-full transition border border-slate-600 shadow-lg hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              :class="store.timer.isRunning ? 'bg-slate-800' : 'bg-primary'">
        <component :is="store.timer.isRunning ? Pause : Play" class="w-6 h-6" :class="store.timer.isRunning ? 'text-primary' : 'text-slate-900'" />
      </button>
      <button @click="stopSession" class="p-4 bg-slate-800 rounded-full hover:bg-slate-700 transition border border-slate-600">
        <RotateCcw class="w-6 h-6 text-muted" />
      </button>
    </div>

    <div class="grid grid-cols-3 gap-2 w-full">
      <button @click="setMode('focus', 25)" class="py-2 rounded text-xs font-bold uppercase transition border" :class="store.timer.mode === 'focus' ? 'bg-slate-700 text-primary border-primary/30' : 'bg-slate-900 text-slate-500 border-transparent'">Standard</button>
      <button @click="setMode('short_break', 5)" class="py-2 rounded text-xs font-bold uppercase transition border" :class="store.timer.mode === 'short_break' ? 'bg-slate-700 text-blue-400 border-blue-400/30' : 'bg-slate-900 text-slate-500 border-transparent'">Short Break</button>
      <button @click="setMode('long_break', 15)" class="py-2 rounded text-xs font-bold uppercase transition border" :class="store.timer.mode === 'long_break' ? 'bg-slate-700 text-blue-500 border-blue-500/30' : 'bg-slate-900 text-slate-500 border-transparent'">Long Break</button>
    </div>

  </div>
</template>

<style scoped>
input[type=range]::-webkit-slider-thumb {
  -webkit-appearance: none;
  height: 16px;
  width: 16px;
  border-radius: 50%;
  background: #2dd4bf;
  margin-top: -4px;
  box-shadow: 0 0 10px rgba(45, 212, 191, 0.5);
}

.custom-scrollbar::-webkit-scrollbar { width: 4px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; border-radius: 4px; }

/* Modal Transitions */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>