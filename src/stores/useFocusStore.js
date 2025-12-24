import { defineStore } from 'pinia';
import { ref } from 'vue';
import { useStorage } from '@vueuse/core';

export const useFocusStore = defineStore('focus', () => {
  // Persistence (Saved to localStorage)
  const tasks = useStorage('milky-tasks', []);
  const history = useStorage('milky-history', []);
  
  // NEW: Store logs as an array, persisted so they survive refresh
  const milkyLogs = useStorage('milky-logs', [
    { id: Date.now(), text: "Ready to start. Select a task or start the timer." }
  ]);

  // Timer State
  const timer = useStorage('milky-timer-config', {
    timeLeft: 25 * 60,
    initialDuration: 25 * 60,
    mode: 'focus', 
    isRunning: false,
    activeTaskId: null
  });

  // Actions
  const addTask = (text, quadrant) => {
    tasks.value.push({
      id: Date.now(),
      text,
      quadrant, 
      completed: false,
      aiSteps: '' 
    });
  };

  const toggleTaskComplete = (id) => {
    const task = tasks.value.find(t => t.id === id);
    if (task) task.completed = !task.completed;
  };

  // NEW: Action to add a log and keep only the latest 5
  const addMilkyLog = (text) => {
    // Add new log to the beginning of the array
    milkyLogs.value.unshift({
      id: Date.now(),
      text: text
    });

    // Remove the oldest if we have more than 5
    if (milkyLogs.value.length > 5) {
      milkyLogs.value.pop();
    }
  };

  return { tasks, history, milkyLogs, timer, addTask, toggleTaskComplete, addMilkyLog };
});