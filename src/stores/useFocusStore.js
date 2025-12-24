// src/stores/useFocusStore.js
import { defineStore } from 'pinia';
import { ref } from 'vue';
import { useStorage } from '@vueuse/core';

export const useFocusStore = defineStore('focus', () => {
  // --- STATE ---

  // 1. Task List (Persisted)
  const tasks = useStorage('milky-tasks', []);

  // 2. Milky Logs / Chat History (Persisted)
  // initialized with a welcome message
  const milkyLogs = useStorage('milky-logs', [
    { 
      id: Date.now(), 
      text: "Ready to start. I'm listening if you need to chat or focus.", 
      type: 'milky' 
    }
  ]);

  // 3. Timer Configuration (Persisted)
  const timer = useStorage('milky-timer-config', {
    timeLeft: 25 * 60,
    initialDuration: 25 * 60,
    mode: 'focus', // 'focus' | 'hyperfocus' | 'short_break' | 'long_break'
    isRunning: false
  });

  // 4. Last Session Stats (Not Persisted - resets on reload)
  // Used to trigger the Mood Reflection modal after a session
  const lastSession = ref({
    duration: 0,
    mode: 'focus',
    mood: null
  });

  // --- ACTIONS ---

  // Add a Log Entry (System or User Chat)
  const addMilkyLog = (text, type = 'milky') => {
    milkyLogs.value.unshift({
      id: Date.now(),
      text: text,
      type: type // 'milky' (left side) or 'user' (right side)
    });

    // Keep history manageable (last 10 messages)
    if (milkyLogs.value.length > 10) {
      milkyLogs.value.pop();
    }
  };

  // Add a New Task
  const addTask = (text, quadrant) => {
    tasks.value.push({
      id: Date.now(),
      text,
      quadrant, // 'do_first', 'schedule', 'delegate', 'eliminate'
      completed: false,
      aiSteps: '' // Initialize as empty string to prevent Marked.js crashes
    });
    
    // Log the creation event (System log)
    addMilkyLog(`Added to ${quadrant.replace('_', ' ').toUpperCase()}: "${text}"`, 'milky');
  };

  // Remove a Task (Trash Can)
  const removeTask = (id) => {
    const index = tasks.value.findIndex(t => t.id === id);
    if (index !== -1) {
      tasks.value.splice(index, 1);
    }
  };

  // Toggle Completion Status
  const toggleTaskComplete = (id) => {
    const task = tasks.value.find(t => t.id === id);
    if (task) {
      task.completed = !task.completed;
      // Note: We DO NOT log here. The TaskList component handles the logging
      // so it can ask the AI for specific praise first.
    }
  };

  // Set Timer Mode (Focus / Break)
  const setTimerMode = (mode) => {
    timer.value.mode = mode;
    timer.value.isRunning = false;
    
    // Default durations (can be overridden by the slider in the component)
    if (mode === 'focus') timer.value.initialDuration = 25 * 60;
    if (mode === 'short_break') timer.value.initialDuration = 5 * 60;
    if (mode === 'long_break') timer.value.initialDuration = 15 * 60;
    
    timer.value.timeLeft = timer.value.initialDuration;
  };

  // --- EXPORT ---
  return { 
    tasks, 
    milkyLogs, 
    timer, 
    lastSession, 
    addTask, 
    removeTask,
    toggleTaskComplete, 
    addMilkyLog, 
    setTimerMode 
  };
});