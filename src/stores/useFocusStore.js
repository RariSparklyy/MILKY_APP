import { defineStore } from 'pinia';
import { ref } from 'vue';
import { useStorage } from '@vueuse/core';

export const useFocusStore = defineStore('focus', () => {
  // Persistence
  const tasks = useStorage('milky-tasks', []);
  const milkyLogs = useStorage('milky-logs', [
    { id: Date.now(), text: "Ready to start. Select a task or start the timer." }
  ]);
  
  // NEW: Store last session stats for the AI to reference accurately
  const lastSession = ref({
    duration: 0,
    mode: 'focus',
    mood: null
  });

  const timer = useStorage('milky-timer-config', {
    timeLeft: 25 * 60,
    initialDuration: 25 * 60,
    mode: 'focus', 
    isRunning: false
  });

  // Actions
  const addMilkyLog = (text) => {
    milkyLogs.value.unshift({ id: Date.now(), text });
    if (milkyLogs.value.length > 5) milkyLogs.value.pop();
  };

  const addTask = (text, quadrant) => {
    tasks.value.push({
      id: Date.now(),
      text,
      quadrant,
      completed: false,
      aiSteps: ''
    });
    // Log the event for the user/AI context
    // We don't ask AI here to save tokens, just a system log
    addMilkyLog(`Created new ${quadrant.replace('_', ' ').toUpperCase()} task: "${text}"`);
  };

  const toggleTaskComplete = (id) => {
    const task = tasks.value.find(t => t.id === id);
    if (task) {
      task.completed = !task.completed;
    }
  };

  const removeTask = (id) => {
    const index = tasks.value.findIndex(t => t.id === id);
    if (index !== -1) {
      tasks.value.splice(index, 1);
    }
  };

  // Helper to set timer mode
  const setTimerMode = (mode) => {
    timer.value.mode = mode;
    timer.value.isRunning = false;
    if (mode === 'focus') timer.value.initialDuration = 25 * 60;
    if (mode === 'short_break') timer.value.initialDuration = 5 * 60;
    if (mode === 'long_break') timer.value.initialDuration = 15 * 60;
    timer.value.timeLeft = timer.value.initialDuration;
  };

  return { 
    tasks, 
    milkyLogs, 
    timer, 
    lastSession, 
    addTask, 
    toggleTaskComplete, 
    addMilkyLog, 
    setTimerMode,
    removeTask
  };
});