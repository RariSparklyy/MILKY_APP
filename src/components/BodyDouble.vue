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

  // 1. Log User Message immediately
  store.addMilkyLog(text, 'user');
  userMessage.value = ''; // Clear input

  // 2. Log "Thinking..." placeholder and CAPTURE THE ID
  const loadingId = store.addMilkyLog("Thinking...", 'milky');

  // 3. DETERMINE CONTEXT (Friend vs Body Double)
  let context = "You are a supportive, empathetic ADHD friend/assistant.";
  
  // If timer is running + Body Double Mode is ON + Task is selected
  if (store.timer.isRunning && store.timer.bodyDoubleEnabled && store.timer.activeTaskId) {
    const taskName = store.getActiveTaskName();
    context = `
      You are a Body Double currently watching the user work.
      Current Task: "${taskName}".
      The user IS supposed to be focusing on this right now.
      
      - If they say they are distracted or bored, gently steer them back to "${taskName}".
      - If they ask for help with "${taskName}", help them break it down.
      - Keep responses short (max 2 sentences) and encouraging.
    `;
  } else {
    // General Chat Mode
    context += `
      - Keep it conversational and brief.
      - Do NOT give clinical advice.
      - If they seem overwhelmed, suggest a tiny first step.
    `;
  }

  // 4. Ask Milky
  const prompt = `User said: "${text}". Reply based on your context.`;
  const response = await askMilky(prompt, context);

  // 5. Update the specific placeholder log with the real response
  store.updateLogContent(loadingId, response);
};

// Formatting Helper
const parseMarkdown = (text) => {
  return marked.parse(String(text));
};
</script>

<template>
  <div class="flex flex-col gap-4 mb-6 h-full">
    
    <div class="bg-slate-900 border border-slate-700 rounded-xl p-2 flex gap-2 shadow-sm focus-within:border-primary transition-colors">
      <input 
        v-model="userMessage" 
        @keyup.enter="sendMessage"
        type="text" 
        placeholder="Chat with Milky..." 
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

    <TransitionGroup 
      name="list" 
      tag="div" 
      class="flex flex-col gap-3 relative"
    >
      <div v-for="(log, index) in store.milkyLogs" :key="log.id"
           class="flex w-full transition-all duration-500 ease-in-out"
           :class="log.type === 'user' ? 'justify-end' : 'justify-start'">
        
        <div class="relative max-w-[90%] rounded-2xl p-4 border transition-all"
             :class="[
               log.type === 'user' 
                 ? 'bg-blue-900/30 border-blue-500/30 rounded-tr-sm' 
                 : index === 0 
                    ? 'bg-slate-900 border-primary shadow-md rounded-tl-sm' // Active Milky
                    : 'bg-slate-900/40 border-slate-700/50 opacity-75 rounded-tl-sm' // History
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
    </TransitionGroup>
  </div>
</template>

<style scoped>
/* Smooth List Transitions */
.list-move,
.list-enter-active,
.list-leave-active {
  transition: all 0.5s ease;
}

.list-enter-from,
.list-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}

/* Ensure leaving items are taken out of layout flow so others move up/down smoothly */
.list-leave-active {
  position: absolute;
}
</style>