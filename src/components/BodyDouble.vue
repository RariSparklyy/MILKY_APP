<script setup>
import { useFocusStore } from '../stores/useFocusStore';
import { Bot, History } from 'lucide-vue-next'; // Added History icon for older logs
import { marked } from 'marked';

const store = useFocusStore();

// Helper to safely parse markdown
const parseMarkdown = (text) => {
  return marked.parse(String(text));
};
</script>

<template>
  <div class="w-full flex flex-col gap-4 mb-6">
    
    <div v-for="(log, index) in store.milkyLogs" :key="log.id"
         class="rounded-lg p-4 border-l-4 transition-all duration-300"
         :class="index === 0 ? 'bg-slate-900 border-primary shadow-lg' : 'bg-slate-900/40 border-slate-700 opacity-75'">
      
      <div class="flex items-start gap-4">
        <div class="p-2 rounded-lg shrink-0" 
             :class="index === 0 ? 'bg-slate-800' : 'bg-transparent'">
          <Bot v-if="index === 0" class="w-6 h-6 text-primary" />
          <History v-else class="w-5 h-5 text-slate-500" />
        </div>

        <div>
          <h3 class="text-xs font-bold uppercase tracking-wide mb-1"
              :class="index === 0 ? 'text-primary' : 'text-slate-500'">
            {{ index === 0 ? 'Milky (Active)' : 'Previous Log' }}
          </h3>

          <div 
            class="text-sm leading-relaxed prose prose-invert prose-p:my-1 prose-ul:my-1 prose-li:my-0 max-w-none"
            :class="index === 0 ? 'text-slate-200' : 'text-slate-400'"
            v-html="parseMarkdown(log.text)">
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<style>
/* Optional: Ensure markdown content doesn't add huge margins */
.prose p {
  margin-bottom: 0.5rem;
}
.prose ul {
  padding-left: 1rem;
  list-style-type: disc;
}
</style>