<script setup>
import { ref, computed } from 'vue';
import { useFocusStore } from '../stores/useFocusStore';
import { useMilky } from '../composables/useMilky';
import { Wand2, Trash2, CheckCircle2, Circle } from 'lucide-vue-next';
import { marked } from 'marked';

const store = useFocusStore();
const { askMilky, isThinking } = useMilky();
const newTask = ref('');
const selectedQuadrant = ref('do_first');

// Priority Map for Sorting (Lower number = Higher Priority)
const priorityMap = {
  do_first: 1,
  schedule: 2,
  delegate: 3,
  eliminate: 4
};

// Computed: Automatically sorts tasks based on Matrix rules
const sortedTasks = computed(() => {
  return [...store.tasks].sort((a, b) => {
    // 1. Move Completed items to the very bottom
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    
    // 2. Sort by Quadrant Priority (Do First -> Eliminate)
    const pA = priorityMap[a.quadrant] || 5;
    const pB = priorityMap[b.quadrant] || 5;
    if (pA !== pB) return pA - pB;
    
    // 3. Sort by Newest ID within same quadrant
    return b.id - a.id;
  });
});

const addNew = () => {
  if (!newTask.value) return;
  store.addTask(newTask.value, selectedQuadrant.value);
  newTask.value = '';
};

// "Wall of Awful" Breaker
const breakDown = async (task) => {
  if (task.aiSteps) return;
  const prompt = `Break down "${task.text}" into 3 very small steps. Return HTML <li> tags only.`;
  const result = await askMilky(prompt, "You are a task decomposition expert.");
  task.aiSteps = result;
};

// Handle Task Completion with AI Reward
const handleCheck = async (task) => {
  // 1. Toggle immediately for UI responsiveness
  store.toggleTaskComplete(task.id);

  // 2. If completed, trigger Milky for praise
  if (task.completed) {
    // Add temporary placeholder
    store.addMilkyLog(`🎉 Hooray! Finishing "${task.text}"...`);

    // 3. Context-Aware Prompt
    const qMap = {
      do_first: "Urgent Crisis (High Stress)",
      schedule: "Strategic Planning (High Value)",
      delegate: "Low Value Admin",
      eliminate: "Distraction"
    };
    
    const prompt = `
      User just completed a task.
      Task Name: "${task.text}"
      Priority Context: ${qMap[task.quadrant]}.
      
      Give specific, high-energy praise (max 1 sentence).
      - If Urgent: Celebrate the relief and lowering stress.
      - If Strategic: Celebrate the foresight and investment.
      - If Delegate/Eliminate: Celebrate clearing the clutter.
    `;

    // 4. Get Insight
    const praise = await askMilky(prompt, "You are an excited ADHD cheerleader.");
    
    // 5. Update the log
    store.milkyLogs[0].text = praise;
  }
};

// Styling Helpers
const getBadgeColor = (q) => {
  if (q === 'do_first') return 'bg-urgent text-slate-900';
  if (q === 'schedule') return 'bg-blue-500 text-slate-900';
  if (q === 'delegate') return 'bg-yellow-500 text-slate-900';
  return 'bg-slate-600 text-slate-200';
};

const getBorderColor = (q) => {
  if (q === 'do_first') return 'border-urgent';
  if (q === 'schedule') return 'border-blue-500';
  if (q === 'delegate') return 'border-yellow-500';
  return 'border-slate-600';
};

// Dynamic class for the selector dropdown
const selectorClass = computed(() => {
  if (selectedQuadrant.value === 'do_first') return 'text-urgent border-urgent';
  if (selectedQuadrant.value === 'schedule') return 'text-blue-400 border-blue-400';
  if (selectedQuadrant.value === 'delegate') return 'text-yellow-400 border-yellow-400';
  return 'text-slate-400 border-slate-600';
});
</script>

<template>
  <div class="bg-surface p-6 rounded-xl shadow-lg border border-slate-700 h-full flex flex-col">
    <div class="flex justify-between items-center mb-4">
      <h2 class="text-xl font-bold text-slate-100">Eisenhower Matrix</h2>
      <span class="text-xs text-muted uppercase tracking-wider">{{ store.tasks.filter(t => !t.completed).length }} Active</span>
    </div>
    
    <div class="flex flex-col gap-3 mb-6">
      <input v-model="newTask" @keyup.enter="addNew" placeholder="What needs doing?" 
             class="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-slate-200 focus:border-primary focus:outline-none transition-colors" />
      
      <div class="flex gap-2">
        <select v-model="selectedQuadrant" 
                class="bg-slate-900 text-xs font-bold uppercase tracking-wider border rounded px-3 py-2 outline-none cursor-pointer transition-colors w-full"
                :class="selectorClass">
          <option value="do_first" class="text-urgent font-bold">Do First (Urgent/Import)</option>
          <option value="schedule" class="text-blue-400 font-bold">Schedule (Not Urgent/Import)</option>
          <option value="delegate" class="text-yellow-400 font-bold">Delegate (Urgent/Not Import)</option>
          <option value="eliminate" class="text-slate-400 font-bold">Eliminate (None)</option>
        </select>
        
        <button @click="addNew" class="bg-slate-800 hover:bg-primary hover:text-slate-900 text-primary border border-primary/20 px-6 py-1 rounded text-sm font-bold transition">
          Add
        </button>
      </div>
    </div>

    <div class="space-y-3 overflow-y-auto pr-2 custom-scrollbar flex-1">
      <div v-if="sortedTasks.length === 0" class="text-center text-muted text-sm py-8 italic opacity-50">
        No tasks. The matrix is empty.
      </div>

      <div v-for="task in sortedTasks" :key="task.id" 
           class="bg-slate-900/40 p-3 rounded-lg border-l-4 transition-all group hover:bg-slate-900/80"
           :class="[getBorderColor(task.quadrant), task.completed ? 'opacity-50 grayscale' : 'opacity-100']">
        
        <div class="flex justify-between items-start gap-3">
          <div class="flex items-start gap-3 flex-1 cursor-pointer" @click="handleCheck(task)">
            <div class="mt-1 transition-colors" :class="task.completed ? 'text-primary' : 'text-slate-600 group-hover:text-slate-400'">
              <CheckCircle2 v-if="task.completed" class="w-5 h-5" />
              <Circle v-else class="w-5 h-5" />
            </div>
            
            <div class="flex flex-col w-full">
              <span class="text-sm leading-relaxed transition-all" 
                    :class="task.completed ? 'line-through text-slate-500' : 'text-slate-200'">
                {{ task.text }}
              </span>
              <div v-if="!task.completed" class="mt-1.5 flex items-center gap-2">
                 <span class="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded"
                      :class="getBadgeColor(task.quadrant)">
                  {{ task.quadrant.replace('_', ' ') }}
                </span>
              </div>
            </div>
          </div>
          
          <div class="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button v-if="!task.completed" @click.stop="breakDown(task)" class="p-1.5 text-slate-500 hover:text-purple-400 hover:bg-slate-800 rounded transition" title="AI Breakdown">
              <Wand2 class="w-4 h-4" :class="{ 'animate-spin': isThinking }" />
            </button>
            <button @click.stop="store.removeTask(task.id)" class="p-1.5 text-slate-500 hover:text-red-400 hover:bg-slate-800 rounded transition" title="Delete Task">
              <Trash2 class="w-4 h-4" />
            </button>
          </div>
        </div>

        <div v-if="task.aiSteps && !task.completed" class="mt-3 ml-8 text-xs text-slate-400 prose prose-invert border-l border-slate-700 pl-3">
           <div v-html="marked.parse(String(task.aiSteps))"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Custom scrollbar for the task list only */
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
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: #475569;
}
</style>