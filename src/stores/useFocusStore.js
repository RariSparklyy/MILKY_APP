// src/stores/useFocusStore.js
import { defineStore } from 'pinia';
import { ref } from 'vue';
import { useStorage } from '@vueuse/core';

export const useFocusStore = defineStore('focus', () => {
  // --- STATE ---

  // 1. Task List (Persisted)
  const tasks = useStorage('milky-tasks', []);

  // 2. Milky Logs / Chat History (Persisted)
  const milkyLogs = useStorage('milky-logs', [
    { 
      id: Date.now(), 
      text: "Ready to start. I'm listening if you need to chat or focus.", 
      type: 'milky' 
    }
  ]);

  // 3. Stats History (Persisted) - Stores completed sessions
  const history = useStorage('milky-history', []);

  // 4. Timer Configuration (Persisted)
  const timer = useStorage('milky-timer-config', {
    timeLeft: 25 * 60,
    initialDuration: 25 * 60,
    mode: 'focus', // 'focus' | 'hyperfocus' | 'short_break' | 'long_break'
    isRunning: false,
    activeTaskId: null, // ID of the task currently being worked on (Body Double)
    bodyDoubleEnabled: false // Checkbox state
  });

  // 5. Last Session Stats (Not Persisted)
  // Used purely to pass data to the MoodReflection modal after a session ends
  const lastSession = ref({
    duration: 0,
    mode: 'focus',
    mood: null
  });

  // --- ACTIONS ---

  // Add a Log Entry & Return ID (Crucial for safe async updates)
  const addMilkyLog = (text, type = 'milky') => {
    const id = Date.now();
    milkyLogs.value.unshift({
      id: id,
      text: text,
      type: type // 'milky' or 'user'
    });

    // Keep history manageable (last 10 messages)
    if (milkyLogs.value.length > 10) {
      milkyLogs.value.pop();
    }
    
    return id; // <--- Returns ID so we can update this specific bubble later
  };

  // Update a specific log by ID (Prevents race conditions)
  const updateLogContent = (id, newText) => {
    const log = milkyLogs.value.find(l => l.id === id);
    if (log) {
      log.text = newText;
    }
  };

  // Add a New Task
  const addTask = (text, quadrant) => {
    tasks.value.push({
      id: Date.now(),
      text,
      quadrant, // 'do_first', 'schedule', 'delegate', 'eliminate'
      completed: false,
      aiSteps: [] // Initialize as empty array
    });
    
    // System log
    addMilkyLog(`Added to ${quadrant.replace('_', ' ').toUpperCase()}: "${text}"`, 'milky');
  };

  // Remove a Task
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
    }
  };

  // Set Timer Mode
  const setTimerMode = (mode) => {
    timer.value.mode = mode;
    timer.value.isRunning = false;
    // Reset active task when changing modes manually
    timer.value.activeTaskId = null; 
    
    // Default durations (UI slider will override these often)
    if (mode === 'focus') timer.value.initialDuration = 25 * 60;
    if (mode === 'short_break') timer.value.initialDuration = 5 * 60;
    if (mode === 'long_break') timer.value.initialDuration = 15 * 60;
    
    timer.value.timeLeft = timer.value.initialDuration;
  };

  // Helper: Get text of the currently active task
  const getActiveTaskName = () => {
    if (!timer.value.activeTaskId) return null;
    const task = tasks.value.find(t => t.id === timer.value.activeTaskId);
    return task ? task.text : "Unknown Task";
  };

  // Add Completed Session to History
  const addToHistory = (sessionData) => {
    history.value.unshift({
      id: Date.now(),
      timestamp: Date.now(),
      duration: sessionData.duration, // in seconds
      mode: sessionData.mode,
      mood: sessionData.mood
    });
  };

  // --- EXPORT ---
  return { 
    // State
    tasks, 
    milkyLogs, 
    timer, 
    lastSession, 
    history, 
    
    // Actions
    addTask, 
    removeTask, 
    toggleTaskComplete, 
    
    addMilkyLog, 
    updateLogContent, 
    
    setTimerMode, 
    getActiveTaskName, 
    
    addToHistory 
  };
});