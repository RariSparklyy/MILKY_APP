<script setup>
import HyperfocusTimer from './components/HyperfocusTimer.vue';
import TaskList from './components/TaskList.vue';
import BodyDouble from './components/BodyDouble.vue';
import MoodReflection from './components/MoodReflection.vue';
import StatsHistory from './components/StatsHistory.vue';
</script>

<template>
  <div class="min-h-screen bg-background text-slate-200 p-6 font-sans">
    <div class="max-w-[1600px] mx-auto grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
      
      <div class="xl:col-span-3 space-y-6 flex flex-col h-full">
        <header>
          <h1 class="text-3xl font-bold tracking-tight text-primary">Milky</h1>
          <p class="text-muted text-sm mt-1">Local-First ADHD Assistant</p>
        </header>
        
        <HyperfocusTimer />
        <MoodReflection />
        
        <StatsHistory />
      </div>

      <div class="xl:col-span-6 h-[85vh]"> 
        <TaskList />
      </div>

      <div class="xl:col-span-3 h-[85vh]">
        <BodyDouble />
      </div>

    </div>
  </div>
</template>