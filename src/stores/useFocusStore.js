import { defineStore } from 'pinia';
import { ref } from 'vue';
import { useStorage } from '@vueuse/core';

export const useFocusStore = defineStore('focus', () => {
  // --- STATE ---

  // 1. Task List
  const tasks = useStorage('milky-tasks', []);

  // 2. Milky Logs / Chat History
  const milkyLogs = useStorage('milky-logs', [
    { 
      id: Date.now(), 
      text: "Ready to start. I'm listening if you need to chat or focus.", 
      type: 'milky' 
    }
  ]);

  // 3. Stats History
  const history = useStorage('milky-history', []);

  // 4. Timer Configuration
  const timer = useStorage('milky-timer-config', {
    timeLeft: 25 * 60,
    initialDuration: 25 * 60,
    mode: 'focus', 
    isRunning: false,
    activeTaskId: null, 
    bodyDoubleEnabled: false 
  });

  // 5. Last Session Stats
  const lastSession = ref({
    duration: 0,
    mode: 'focus',
    mood: null
  });

  // --- ACTIONS ---

  // FIX: Use Randomness to prevent ID collisions
  const generateId = () => Date.now() + Math.random().toString(36).substr(2, 9);

  const addMilkyLog = (text, type = 'milky') => {
    const id = generateId(); // <--- UPDATED: Uses random string + timestamp
    
    milkyLogs.value.unshift({
      id: id,
      text: text,
      type: type 
    });

    if (milkyLogs.value.length > 10) {
      milkyLogs.value.pop();
    }
    
    return id; 
  };

  const updateLogContent = (id, newText) => {
    const log = milkyLogs.value.find(l => l.id === id);
    if (log) {
      log.text = newText;
    }
  };

  const addTask = (text, quadrant) => {
    const id = generateId(); // Use the safer ID here too
    tasks.value.push({
      id: id,
      text,
      quadrant, 
      completed: false,
      aiSteps: []
    });
    
    addMilkyLog(`Added to ${quadrant.replace('_', ' ').toUpperCase()}: "${text}"`, 'milky');
  };

  const removeTask = (id) => {
    const index = tasks.value.findIndex(t => t.id === id);
    if (index !== -1) {
      tasks.value.splice(index, 1);
    }
  };

  const toggleTaskComplete = (id) => {
    const task = tasks.value.find(t => t.id === id);
    if (task) {
      task.completed = !task.completed;
    }
  };

  const setTimerMode = (mode) => {
    timer.value.mode = mode;
    timer.value.isRunning = false;
    timer.value.activeTaskId = null; 
    
    if (mode === 'focus') timer.value.initialDuration = 25 * 60;
    if (mode === 'short_break') timer.value.initialDuration = 5 * 60;
    if (mode === 'long_break') timer.value.initialDuration = 15 * 60;
    
    timer.value.timeLeft = timer.value.initialDuration;
  };

  const getActiveTaskName = () => {
    if (!timer.value.activeTaskId) return null;
    const task = tasks.value.find(t => t.id === timer.value.activeTaskId);
    return task ? task.text : "Unknown Task";
  };

  const addToHistory = (sessionData) => {
    history.value.unshift({
      id: generateId(), // Safer ID
      timestamp: Date.now(),
      duration: sessionData.duration,
      mode: sessionData.mode,
      mood: sessionData.mood
    });
  };

  // --- EXPORT ---
  return { 
    tasks, 
    milkyLogs, 
    timer, 
    lastSession, 
    history, 
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