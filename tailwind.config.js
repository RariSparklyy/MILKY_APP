/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#0f172a', // Deep Slate (Dark Mode Base)
        surface: '#1e293b',    // Lighter Slate (Card Background)
        primary: '#2dd4bf',    // Teal 400 (Focus/Success)
        urgent: '#f87171',     // Red 400 (Deadlines/Q1)
        muted: '#94a3b8',      // Slate 400 (Text)
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      }
    },
  },
  plugins: [],
}