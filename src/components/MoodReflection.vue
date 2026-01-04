<script setup>
import { useFocusStore } from '../stores/useFocusStore';
import { useMilky } from '../composables/useMilky';
import { Smile, Meh, Frown } from 'lucide-vue-next';

const store = useFocusStore();
const { askMilky } = useMilky();

const logMood = async (mood) => {
  store.lastSession.mood = mood; 
  
  // 1. NEW: Save to History Stats
  store.addToHistory({
    duration: store.lastSession.duration,
    mode: store.lastSession.mode,
    mood: mood
  });

  // 2. Log placeholder and CAPTURE ID
  const loadingId = store.addMilkyLog("Analyzing session data...");

  // ... (rest of the AI logging logic remains the same) ...
  
  const prompt = `User finished a ${store.lastSession.mode} session...`; // etc
  const response = await askMilky(prompt, "You are a factual but supportive logger.");
  store.updateLogContent(loadingId, response);
  
  store.lastSession.duration = 0; 
};

</script>

<template>
  <div v-if="store.lastSession.duration > 0 && !store.lastSession.mood" 
       class="mb-6 p-4 bg-slate-800 border border-primary/50 rounded-xl animate-fade-in">
    <h3 class="text-sm font-bold text-slate-200 mb-3 text-center">How was that session?</h3>
    <div class="flex justify-center gap-4">
      <button @click="logMood('Great')" class="flex flex-col items-center gap-1 group">
        <div class="p-3 bg-slate-700 rounded-full group-hover:bg-primary transition">
          <Smile class="w-6 h-6 text-slate-300 group-hover:text-slate-900" />
        </div>
        <span class="text-xs text-slate-400">Great</span>
      </button>

      <button @click="logMood('Neutral')" class="flex flex-col items-center gap-1 group">
        <div class="p-3 bg-slate-700 rounded-full group-hover:bg-blue-400 transition">
          <Meh class="w-6 h-6 text-slate-300 group-hover:text-slate-900" />
        </div>
        <span class="text-xs text-slate-400">Okay</span>
      </button>

      <button @click="logMood('Struggling')" class="flex flex-col items-center gap-1 group">
        <div class="p-3 bg-slate-700 rounded-full group-hover:bg-urgent transition">
          <Frown class="w-6 h-6 text-slate-300 group-hover:text-slate-900" />
        </div>
        <span class="text-xs text-slate-400">Hard</span>
      </button>
    </div>
  </div>
</template>