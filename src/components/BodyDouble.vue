<script setup>
import { ref } from 'vue';
import { useFocusStore } from '../stores/useFocusStore';
import { useMilky } from '../composables/useMilky';
import { Bot, User, Send, History } from 'lucide-vue-next';
import { marked } from 'marked';

const store = useFocusStore();
const { askMilky, isThinking } = useMilky();
const userMessage = ref('');

// Send Message Logic
const sendMessage = async () => {
  const text = userMessage.value.trim();
  if (!text) return;

  // 1. Log User Message
  store.addMilkyLog(text, 'user');
  userMessage.value = ''; 

  // 2. Log Placeholder
  const loadingId = store.addMilkyLog("Thinking...", 'milky');

  // --- NEW: Context Injection ---
  let context = "You are a supportive friend.";
  if (store.timer.isRunning && store.timer.activeTaskId) {
    const taskName = store.getActiveTaskName();
    context = `
      You are a Body Double currently watching the user work.
      Current Task: "${taskName}".
      The user is supposed to be focusing on this right now.
      If they are chatting about something unrelated, gently steer them back to "${taskName}".
      If they are asking for help with the task, help them.
    `;
  }
  // -----------------------------

  const prompt = `User said: "${text}". Reply briefly based on context.`;
  const response = await askMilky(prompt, context);

  // 4. Update Log
  store.updateLogContent(loadingId, response);
};


// Formatting Helper
const parseMarkdown = (text) => {
  return marked.parse(String(text));
};
</script>

<template>
  <div class="flex flex-col gap-4 mb-6">
    
    <div class="bg-slate-900 border border-slate-700 rounded-xl p-2 flex gap-2 shadow-sm focus-within:border-primary transition-colors">
      <input 
        v-model="userMessage" 
        @keyup.enter="sendMessage"
        type="text" 
        placeholder="Chat with Milky (e.g., 'I can't focus...')" 
        class="bg-transparent border-none text-sm text-slate-200 placeholder-slate-500 w-full px-2 focus:outline-none"
        :disabled="isThinking"
      />
      <button 
        @click="sendMessage" 
        :disabled="!userMessage || isThinking"
        class="p-2 bg-slate-800 rounded-lg text-primary hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition">
        <Send class="w-4 h-4" />
      </button>
    </div>

    <div class="flex flex-col gap-3">
      <div v-for="(log, index) in store.milkyLogs" :key="log.id"
           class="flex w-full animate-fade-in"
           :class="log.type === 'user' ? 'justify-end' : 'justify-start'">
        
        <div class="relative max-w-[85%] rounded-2xl p-4 border transition-all"
             :class="[
               log.type === 'user' 
                 ? 'bg-blue-900/30 border-blue-500/30 rounded-tr-sm' 
                 : index === 0 
                    ? 'bg-slate-900 border-primary shadow-md rounded-tl-sm'
                    : 'bg-slate-900/40 border-slate-700/50 opacity-75 rounded-tl-sm'
             ]">
          
          <div class="flex items-start gap-3" :class="log.type === 'user' ? 'flex-row-reverse' : 'flex-row'">
            
            <div class="p-1.5 rounded-lg shrink-0" 
                 :class="log.type === 'user' ? 'bg-blue-500/20' : 'bg-slate-800'">
              <User v-if="log.type === 'user'" class="w-4 h-4 text-blue-400" />
              <Bot v-else-if="index === 0" class="w-4 h-4 text-primary" />
              <History v-else class="w-4 h-4 text-slate-500" />
            </div>

            <div>
              <h3 class="text-[10px] font-bold uppercase tracking-wide mb-1 opacity-70"
                  :class="log.type === 'user' ? 'text-right text-blue-300' : 'text-left text-primary'">
                {{ log.type === 'user' ? 'You' : (index === 0 ? 'Milky' : 'History') }}
              </h3>

              <div 
                class="text-sm leading-relaxed prose prose-invert prose-p:my-1 prose-ul:my-1 prose-li:my-0 max-w-none break-words"
                :class="log.type === 'user' ? 'text-blue-100 text-right' : 'text-slate-300 text-left'"
                v-html="parseMarkdown(log.text)">
              </div>
            </div>
          </div>
        </div>

      </div>
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