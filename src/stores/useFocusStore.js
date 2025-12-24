import { defineStore } from 'pinia';
import { ref } from 'vue';
import { useStorage } from '@vueuse/core';

export const useFocusStore = defineStore('focus', () => {
  // --- STATE ---
  const tasks = useStorage('milky-tasks', []);
  
  const milkyLogs = useStorage('milky-logs', [
    { 
      id: Date.now(), 
      text: "Ready to start. I'm listening if you need to chat or focus.", 
      type: 'milky' 
    }
  ]);

  const timer = useStorage('milky-timer-config', {
    timeLeft: 25 * 60,
    initialDuration: 25 * 60,
    mode: 'focus', 
    isRunning: false,
    activeTaskId: null, // NEW: Tracks which task is being worked on
    bodyDoubleEnabled: false // NEW: Toggle state
  });

  const lastSession = ref({
    duration: 0,
    mode: 'focus',
    mood: null
  });

  // --- ACTIONS ---

  const addMilkyLog = (text, type = 'milky') => {
    const id = Date.now();
    milkyLogs.value.unshift({ id, text, type });
    if (milkyLogs.value.length > 10) milkyLogs.value.pop();
    return id; 
  };

  const updateLogContent = (id, newText) => {
    const log = milkyLogs.value.find(l => l.id === id);
    if (log) log.text = newText;
  };

  const addTask = (text, quadrant) => {
    tasks.value.push({
      id: Date.now(),
      text,
      quadrant, 
      completed: false,
      aiSteps: '' 
    });
    addMilkyLog(`Added to ${quadrant.replace('_', ' ').toUpperCase()}: "${text}"`, 'milky');
  };

  const removeTask = (id) => {
    const index = tasks.value.findIndex(t => t.id === id);
    if (index !== -1) tasks.value.splice(index, 1);
  };

  const toggleTaskComplete = (id) => {
    const task = tasks.value.find(t => t.id === id);
    if (task) task.completed = !task.completed;
  };

  const setTimerMode = (mode) => {
    timer.value.mode = mode;
    timer.value.isRunning = false;
    // Reset active task when changing modes manually
    timer.value.activeTaskId = null; 
    
    if (mode === 'focus') timer.value.initialDuration = 25 * 60;
    if (mode === 'short_break') timer.value.initialDuration = 5 * 60;
    if (mode === 'long_break') timer.value.initialDuration = 15 * 60;
    timer.value.timeLeft = timer.value.initialDuration;
  };

  // --- NEW: Helper to get the active task text ---
  const getActiveTaskName = () => {
    if (!timer.value.activeTaskId) return null;
    const task = tasks.value.find(t => t.id === timer.value.activeTaskId);
    return task ? task.text : "Unknown Task";
  };

  return { 
    tasks, milkyLogs, timer, lastSession, 
    addTask, removeTask, toggleTaskComplete, addMilkyLog, updateLogContent, setTimerMode,
    getActiveTaskName // Export this helper
  };
});