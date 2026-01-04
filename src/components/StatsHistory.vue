<script setup>
import { computed } from 'vue';
import { useFocusStore } from '../stores/useFocusStore';
import { Trophy, Clock, CheckCircle2, Calendar, Smile, Meh, Frown } from 'lucide-vue-next';

const store = useFocusStore();

// --- STATISTICS ---
const totalSessions = computed(() => (store.history || []).length);

const totalHours = computed(() => {
  const historyData = store.history || []; 
  const totalSeconds = historyData.reduce((acc, sess) => acc + (sess.duration || 0), 0);
  return (totalSeconds / 3600).toFixed(1);
});

const completedTasks = computed(() => {
  const tasksData = store.tasks || []; 
  return tasksData.filter(t => t.completed).length;
});

// --- FORMATTERS ---
const formatDate = (timestamp) => {
  if (!timestamp) return '';
  return new Date(timestamp).toLocaleDateString('en-US', { 
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
  });
};

const formatDuration = (seconds) => {
  const m = Math.floor((seconds || 0) / 60);
  return `${m}m`;
};
</script>

<template>
  <div class="bg-surface p-6 rounded-xl shadow-lg border border-slate-700 h-full flex flex-col">
    <h2 class="text-xl font-bold text-slate-100 mb-6 flex items-center gap-2">
      <Trophy class="w-5 h-5 text-yellow-500" />
      Progress
    </h2>

    <div class="grid grid-cols-1 gap-4 mb-6">
      
      <div class="bg-slate-900/50 p-4 rounded-lg border border-slate-700 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="p-2 bg-slate-800 rounded-lg text-primary">
            <Clock class="w-5 h-5" />
          </div>
          <span class="text-xs uppercase tracking-wide text-slate-500">Hours</span>
        </div>
        <span class="text-2xl font-bold text-slate-200">{{ totalHours }}</span>
      </div>

      <div class="bg-slate-900/50 p-4 rounded-lg border border-slate-700 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="p-2 bg-slate-800 rounded-lg text-blue-400">
            <Calendar class="w-5 h-5" />
          </div>
          <span class="text-xs uppercase tracking-wide text-slate-500">Sessions</span>
        </div>
        <span class="text-2xl font-bold text-slate-200">{{ totalSessions }}</span>
      </div>

      <div class="bg-slate-900/50 p-4 rounded-lg border border-slate-700 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="p-2 bg-slate-800 rounded-lg text-urgent">
             <CheckCircle2 class="w-5 h-5" />
          </div>
          <span class="text-xs uppercase tracking-wide text-slate-500">Tasks</span>
        </div>
        <span class="text-2xl font-bold text-slate-200">{{ completedTasks }}</span>
      </div>
    </div>

    <div class="border-t border-slate-700 pt-4 flex-1 overflow-hidden flex flex-col">
      <h3 class="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Recent History</h3>
      
      <div v-if="!store.history || store.history.length === 0" class="text-center text-slate-600 text-sm py-4 italic">
        No sessions yet.
      </div>

      <div v-else class="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
        <div v-for="session in store.history" :key="session.id" 
             class="flex items-center justify-between p-3 bg-slate-900 rounded-lg border border-slate-800 hover:border-slate-600 transition group">
          
          <div class="flex items-center gap-3">
            <div class="p-1.5 rounded-full bg-slate-800 group-hover:bg-slate-700 transition">
              <Smile v-if="session.mood === 'Great'" class="w-3 h-3 text-primary" />
              <Meh v-else-if="session.mood === 'Neutral'" class="w-3 h-3 text-blue-400" />
              <Frown v-else-if="session.mood === 'Struggling'" class="w-3 h-3 text-urgent" />
              <Clock v-else class="w-3 h-3 text-slate-500" />
            </div>
            
            <div class="flex flex-col">
              <span class="text-xs font-bold text-slate-300 capitalize">
                {{ (session.mode || 'focus').replace('_', ' ') }}
              </span>
              <span class="text-[10px] text-slate-500">{{ formatDate(session.timestamp) }}</span>
            </div>
          </div>

          <span class="text-xs font-mono font-bold text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">
            {{ formatDuration(session.duration) }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #334155;
  border-radius: 4px;
}
</style>