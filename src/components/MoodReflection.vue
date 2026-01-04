<script setup>
import { useFocusStore } from '../stores/useFocusStore';
import { useMilky } from '../composables/useMilky';
import { Smile, Meh, Frown } from 'lucide-vue-next';

const store = useFocusStore();
const { askMilky } = useMilky();

const logMood = async (mood) => {
  store.lastSession.mood = mood; 
  
  // 1. Save to History
  store.addToHistory({
    duration: store.lastSession.duration,
    mode: store.lastSession.mode,
    mood: mood
  });

  // 2. Log placeholder
  const loadingId = store.addMilkyLog("Analyzing session data...");

  // 3. Construct Context-Aware Prompt
  const durationMins = Math.floor(store.lastSession.duration / 60);
  const isBreak = store.lastSession.mode.includes('break'); // Check if it was a break

  let prompt = '';

  if (isBreak) {
    // --- BREAK PROMPT ---
    prompt = `
      User just finished a ${store.lastSession.mode.replace('_', ' ')}.
      Duration: ${durationMins} minutes.
      Self-reported Mood: ${mood}.
      
      Generate a short, gentle log entry to welcome them back to work.
      - Do NOT ask what tasks they completed (it was a break).
      - Do NOT provide a review form.
      - If mood is 'Struggling', say it's okay to start slow.
      - If mood is 'Great', suggest using that energy now.
      - Keep it to 1 sentence.
    `;
  } else {
    // --- FOCUS PROMPT ---
    prompt = `
      User finished a Focus session.
      Actual duration: ${durationMins} minutes.
      Self-reported Mood: ${mood}.
      
      Generate a short log entry summarizing the session.
      - Mention the duration.
      - IF mood is 'Struggling', be empathetic. 
      - IF mood is 'Great', be celebratory.
      - Use bolding for stats.
    `;
  }

  const response = await askMilky(prompt, "You are a supportive, concise ADHD assistant.");
  
  // 4. Update Log
  store.updateLogContent(loadingId, response);
  
  // Reset
  store.lastSession.duration = 0; 
};
</script>

<template>
  <div v-if="store.lastSession.duration > 0 && !store.lastSession.mood" 
       class="mb-6 p-4 bg-slate-800 border border-primary/50 rounded-xl animate-fade-in">
    <h3 class="text-sm font-bold text-slate-200 mb-3 text-center">
      {{ store.lastSession.mode.includes('break') ? 'How was your break?' : 'How was that session?' }}
    </h3>
    
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

<style scoped>
.animate-fade-in {
  animation: fadeIn 0.3s ease-out forwards;
}
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-5px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>