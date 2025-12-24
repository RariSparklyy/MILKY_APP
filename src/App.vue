<script setup>
import HyperfocusTimer from './components/HyperfocusTimer.vue';
import TaskList from './components/TaskList.vue';
import BodyDouble from './components/BodyDouble.vue';
import MoodReflection from './components/MoodReflection.vue'; // <--- NEW IMPORT
</script>

<template>
  <div class="min-h-screen bg-background text-slate-200 p-8 font-sans">
    <div class="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
      
      <div class="lg:col-span-1 space-y-8">
        <header>
          <h1 class="text-3xl font-bold tracking-tight text-primary">Milky</h1>
          <p class="text-muted text-sm mt-1">Local-First ADHD Assistant</p>
        </header>
        
        <HyperfocusTimer />
        <MoodReflection /> <BodyDouble />
      </div>

      <div class="lg:col-span-2">
        <TaskList />
      </div>

    </div>
  </div>
</template>