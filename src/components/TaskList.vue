<script setup>
import { ref, computed } from 'vue';
import { useFocusStore } from '../stores/useFocusStore';
import { useMilky } from '../composables/useMilky';
import { Wand2, Trash2, CheckCircle2, Circle, CornerDownRight, CheckSquare, Square } from 'lucide-vue-next';

const store = useFocusStore();
const { askMilky, isThinking } = useMilky();
const newTask = ref('');
const selectedQuadrant = ref('do_first');

// Priority Map for Sorting
const priorityMap = {
  do_first: 1,
  schedule: 2,
  delegate: 3,
  eliminate: 4
};

const sortedTasks = computed(() => {
  return [...store.tasks].sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    const pA = priorityMap[a.quadrant] || 5;
    const pB = priorityMap[b.quadrant] || 5;
    if (pA !== pB) return pA - pB;
    return b.id - a.id;
  });
});

const addNew = () => {
  if (!newTask.value) return;
  store.addTask(newTask.value, selectedQuadrant.value);
  newTask.value = '';
};

// --- UPDATED: Interactive Breakdown Logic ---
const breakDown = async (task) => {
  // If steps already exist (and it's an array with items), don't fetch again
  if (Array.isArray(task.aiSteps) && task.aiSteps.length > 0) return;

  const prompt = `
    Break down the task "${task.text}" into 3-5 small, concrete actionable steps.
    Return ONLY a raw JSON array of strings. 
    Example format: ["Step 1", "Step 2"]
    Do not add markdown formatting.
  `;
  
  try {
    const result = await askMilky(prompt, "You are a JSON generator.");
    
    // 1. Extract JSON array (in case AI adds extra text)
    const jsonMatch = result.match(/\[.*\]/s);
    if (jsonMatch) {
      const strings = JSON.parse(jsonMatch[0]);
      
      // 2. Convert strings to interactive objects
      task.aiSteps = strings.map((s, i) => ({
        id: Date.now() + i,
        text: s,
        completed: false
      }));
    }
  } catch (e) {
    console.error("Failed to parse steps", e);
    store.addMilkyLog("Sorry, I couldn't break that down correctly.", 'milky');
  }
};

// Toggle a sub-step
const toggleStep = (step) => {
  step.completed = !step.completed;
};

const handleCheck = async (task) => {
  store.toggleTaskComplete(task.id);

  if (task.completed) {
    const loadingId = store.addMilkyLog(`🎉 Hooray! Finishing "${task.text}"...`);

    const qMap = {
      do_first: "Urgent Crisis",
      schedule: "Strategic Work",
      delegate: "Admin Task",
      eliminate: "Distraction"
    };
    
    const prompt = `User finished "${task.text}" (${qMap[task.quadrant]}). Give 1 short sentence of high-energy praise.`;
    const praise = await askMilky(prompt, "You are a cheerleader.");
    store.updateLogContent(loadingId, praise);
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

const selectorClass = computed(() => {
  if (selectedQuadrant.value === 'do_first') return 'text-urgent border-urgent';
  if (selectedQuadrant.value === 'schedule') return 'text-blue-400 border-blue-400';
  if (selectedQuadrant.value === 'delegate') return 'text-yellow-400 border-yellow-400';
  return 'text-slate-400 border-slate-600';
});
</script>

<template>
  <div class="bg-surface p-6 rounded-xl shadow-lg border border-slate-700 h-full min-h-[500px] flex flex-col">
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
          <option value="do_first" class="text-urgent font-bold">Do First (Urgent)</option>
          <option value="schedule" class="text-blue-400 font-bold">Schedule (Important)</option>
          <option value="delegate" class="text-yellow-400 font-bold">Delegate (Low Value)</option>
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
            <button v-if="!task.completed" @click.stop="breakDown(task)" class="p-1.5 text-slate-500 hover:text-purple-400 hover:bg-slate-800 rounded transition" title="Breakdown">
              <Wand2 class="w-4 h-4" :class="{ 'animate-spin': isThinking }" />
            </button>
            <button @click.stop="store.removeTask(task.id)" class="p-1.5 text-slate-500 hover:text-red-400 hover:bg-slate-800 rounded transition" title="Delete">
              <Trash2 class="w-4 h-4" />
            </button>
          </div>
        </div>

        <div v-if="Array.isArray(task.aiSteps) && task.aiSteps.length > 0 && !task.completed" 
             class="mt-3 ml-2 pl-4 border-l-2 border-slate-700/50 space-y-2 animate-fade-in">
          
          <div v-for="step in task.aiSteps" :key="step.id"
               class="flex items-center gap-3 cursor-pointer group/step"
               @click.stop="toggleStep(step)">
            
            <div class="shrink-0 text-slate-600 transition-colors"
                 :class="step.completed ? 'text-green-500' : 'group-hover/step:text-slate-400'">
              <CheckSquare v-if="step.completed" class="w-3.5 h-3.5" />
              <Square v-else class="w-3.5 h-3.5" />
            </div>

            <span class="text-xs transition-all select-none"
                  :class="step.completed ? 'line-through text-slate-600' : 'text-slate-400 group-hover/step:text-slate-300'">
              {{ step.text }}
            </span>
          </div>
          
        </div>

      </div>
    </div>
  </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar { width: 4px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; border-radius: 4px; }
.custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #475569; }

.animate-fade-in {
  animation: fadeIn 0.3s ease-out forwards;
}
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-5px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>