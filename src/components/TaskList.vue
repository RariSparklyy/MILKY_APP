<script setup>
import { ref } from 'vue';
import { useFocusStore } from '../stores/useFocusStore';
import { useMilky } from '../composables/useMilky';
import { Trash2, Wand2 } from 'lucide-vue-next';
import { marked } from 'marked';

const store = useFocusStore();
const { askMilky, isThinking } = useMilky();
const newTask = ref('');

const addNew = () => {
  if (!newTask.value) return;
  // Default to Q1 for demo, usually involves a selector
  store.addTask(newTask.value, 'do_first');
  newTask.value = '';
};

// The "Wall of Awful" Breaker [cite: 125]
const breakDown = async (task) => {
  if (task.aiSteps.length > 0) return; // Don't redo
  
  const prompt = `The user is stuck on "${task.text}". Break this into 3 tiny, concrete micro-steps. Return standard HTML <li> tags only.`;
  const result = await askMilky(prompt, "You are a task decomposition expert.");
  task.aiSteps = result; // Store the raw HTML string
};
</script>

<template>
  <div class="bg-surface p-6 rounded-xl shadow-lg border border-slate-700 h-full overflow-y-auto">
    <h2 class="text-xl font-bold mb-4 text-slate-100">Tasks</h2>
    
    <div class="flex gap-2 mb-6">
      <input v-model="newTask" @keyup.enter="addNew" placeholder="Add a new task..." 
             class="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-slate-200 focus:outline-none focus:border-primary" />
    </div>

    <div class="space-y-3">
      <div v-for="task in store.tasks" :key="task.id" 
           class="bg-slate-900/50 p-4 rounded-lg border-l-4"
           :class="task.quadrant === 'do_first' ? 'border-urgent' : 'border-blue-500'">
        
        <div class="flex justify-between items-start">
          <div class="flex items-center gap-3">
            <input type="checkbox" :checked="task.completed" @change="store.toggleTaskComplete(task.id)" 
                   class="w-5 h-5 rounded border-slate-600 text-primary focus:ring-0 bg-slate-800" />
            <span :class="{ 'line-through text-muted': task.completed }">{{ task.text }}</span>
          </div>
          
          <button @click="breakDown(task)" class="text-muted hover:text-primary transition" title="AI Breakdown">
            <Wand2 class="w-4 h-4" :class="{ 'animate-spin': isThinking }" />
          </button>
        </div>

        <div v-if="task.aiSteps" class="mt-3 ml-8 text-sm text-slate-400 prose prose-invert">
            <div v-html="marked(String(task.aiSteps))"></div>
        </div>
      </div>
    </div>
  </div>
</template>