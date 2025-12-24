<script setup>
import { useFocusStore } from '../stores/useFocusStore';
import { useMilky } from '../composables/useMilky';
import { Smile, Meh, Frown } from 'lucide-vue-next';

const store = useFocusStore();
const { askMilky } = useMilky();

const logMood = async (mood) => {
  store.lastSession.mood = mood; 
  
  // 1. Log placeholder and CAPTURE ID
  const loadingId = store.addMilkyLog("Analyzing session data...");

  // 2. Generate Prompt
  const durationMins = Math.floor(store.lastSession.duration / 60);
  const prompt = `
    User finished a ${store.lastSession.mode} session.
    Actual duration: ${durationMins} minutes.
    Self-reported Mood: ${mood}.
    
    Generate a log entry. 
    IF mood is 'Struggling', be empathetic. 
    IF mood is 'Great', be celebratory.
    Mention the EXACT duration provided. Use bolding for stats.
  `;

  const response = await askMilky(prompt, "You are a factual but supportive logger.");
  
  // 3. Update SPECIFIC log
  store.updateLogContent(loadingId, response);
  
  // Reset session
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