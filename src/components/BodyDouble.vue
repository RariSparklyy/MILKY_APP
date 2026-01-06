<script setup>
import { ref, nextTick } from 'vue';
import { useFocusStore } from '../stores/useFocusStore';
import { useMilky } from '../composables/useMilky';
import { Bot, User, Send, History } from 'lucide-vue-next';
import { marked } from 'marked';

const store = useFocusStore();
const { askMilky, isThinking } = useMilky();
const userMessage = ref('');
const chatContainer = ref(null); // Reference for auto-scrolling

const sendMessage = async () => {
  const text = userMessage.value.trim();
  if (!text) return;

  store.addMilkyLog(text, 'user');
  userMessage.value = ''; 
  scrollToBottom(); // Scroll down

  const loadingId = store.addMilkyLog("Thinking...", 'milky');
  scrollToBottom(); // Scroll down again for placeholder

  let context = "You are a supportive, empathetic ADHD friend/assistant.";
  if (store.timer.isRunning && store.timer.bodyDoubleEnabled && store.timer.activeTaskId) {
    const taskName = store.getActiveTaskName();
    context = `
      You are a Body Double currently watching the user work.
      Current Task: "${taskName}".
      The user IS supposed to be focusing on this right now.
      - If they say they are distracted, gently steer them back to "${taskName}".
      - Keep responses short (max 2 sentences) and encouraging.
    `;
  }

  const prompt = `User said: "${text}". Reply based on your context.`;
  const response = await askMilky(prompt, context);
  store.updateLogContent(loadingId, response);
  scrollToBottom(); // Scroll down for final answer
};

// Helper: Auto-scroll to latest message
const scrollToBottom = () => {
  nextTick(() => {
    if (chatContainer.value) {
      chatContainer.value.scrollTop = chatContainer.value.scrollHeight;
    }
  });
};

const parseMarkdown = (text) => {
  return marked.parse(String(text));
};
</script>

<template>
  <div class="bg-surface rounded-xl shadow-lg border border-slate-700 flex flex-col h-full overflow-hidden">
    
    <div class="p-4 border-b border-slate-700 bg-slate-900/50 flex items-center gap-2">
      <Bot class="w-5 h-5 text-primary" />
      <span class="font-bold text-slate-200">Milky Chat</span>
      <span v-if="store.timer.bodyDoubleEnabled" class="text-[10px] bg-primary/20 text-primary px-2 py-0.5 rounded-full uppercase tracking-wider font-bold">Body Double Active</span>
    </div>

    <div ref="chatContainer" class="flex-1 overflow-y-auto p-4 custom-scrollbar flex flex-col gap-3">
      <TransitionGroup name="list">
        <div v-for="(log, index) in store.milkyLogs.slice().reverse()" :key="log.id"
             class="flex w-full"
             :class="log.type === 'user' ? 'justify-end' : 'justify-start'">
          
          <div class="relative max-w-[90%] rounded-2xl p-3 text-sm border transition-all"
               :class="[
                 log.type === 'user' 
                   ? 'bg-blue-900/30 border-blue-500/30 rounded-tr-sm text-blue-100' 
                   : 'bg-slate-900 border-slate-700 text-slate-300 rounded-tl-sm'
               ]">
            
            <div class="flex flex-col gap-1">
              <span class="text-[10px] font-bold uppercase tracking-wide opacity-50"
                  :class="log.type === 'user' ? 'text-right' : 'text-left text-primary'">
                {{ log.type === 'user' ? 'You' : 'Milky' }}
              </span>

              <div class="prose prose-invert prose-p:my-0 prose-ul:my-1 text-sm leading-relaxed"
                   v-html="parseMarkdown(log.text)">
              </div>
            </div>
          </div>

        </div>
      </TransitionGroup>
    </div>

    <div class="p-4 bg-slate-900 border-t border-slate-700">
      <div class="bg-slate-800/50 border border-slate-600 rounded-xl p-2 flex gap-2 shadow-inner focus-within:border-primary transition-colors">
        <input 
          v-model="userMessage" 
          @keyup.enter="sendMessage"
          type="text" 
          placeholder="Type a message..." 
          class="bg-transparent border-none text-sm text-slate-200 placeholder-slate-500 w-full px-2 focus:outline-none"
          :disabled="isThinking"
        />
        <button 
          @click="sendMessage" 
          :disabled="!userMessage || isThinking"
          class="p-2 bg-slate-700 rounded-lg text-primary hover:bg-slate-600 disabled:opacity-50 transition">
          <Send class="w-4 h-4" />
        </button>
      </div>
    </div>

  </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar { width: 4px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; border-radius: 4px; }

.list-enter-active,
.list-leave-active {
  transition: all 0.3s ease;
}
.list-enter-from,
.list-leave-to {
  opacity: 0;
  transform: translateY(10px);
}
</style>