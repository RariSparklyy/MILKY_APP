# Milky - Local-First ADHD Assistant

**Milky** is a privacy-focused productivity dashboard designed specifically for neurodivergent individuals. It combines an adaptive **Hyperfocus Timer**, an **Eisenhower Matrix** task manager, and an **AI Body Double** powered by a local LLM (Ollama) to help you get things done without the stress.

> **Note:** This application was developed as part of the Final Year Project for the Digital Systems module of the May 2023 Bachelor of Computer Science cohort at UWE / Villa College.

---

## Key Features

### Adaptive Hyperfocus Timer
* **Dynamic Duration:** Change timer duration instantly with a slider.
* **Hyperfocus Mode:** If the timer hits `00:00` and you are in the zone, Milky doesn't ring an alarm. instead, it enters "Flow State," counting *up* to track your bonus productivity.
* **Smart Breaks:** Short breaks are capped at 10 minutes to prevent momentum loss.

### AI Body Double
* **Accountability Partner:** Toggle "Body Double Mode" during a focus session.
* **Context Aware:** Milky knows exactly which task you selected. If you chat with it, it gently steers you back to work.
* **Auto Check-ins:** Milky will check in on you halfway through your session to ensure you haven't drifted off.

### Eisenhower Matrix Task List
* **Prioritization:** Sorts tasks into 4 quadrants: *Do First (Urgent)*, *Schedule*, *Delegate*, and *Eliminate*.
* **Magic Wand (AI Breakdown):** Overwhelmed by a vague task like "Clean Room"? Click the wand, and Milky breaks it down into interactive, bite-sized sub-steps.
* **Gamified Praise:** Get context-aware, high-energy praise whenever you tick off a task.

### Mood & Stats
* **Reflection:** Log your mood after every session (Great, Neutral, Struggling).
* **History:** Track total focus hours, session counts, and completed tasks over time.

---

## Tech Stack

* **Framework:** [Vue 3](https://vuejs.org/) (Composition API)
* **Build Tool:** [Vite](https://vitejs.dev/)
* **Styling:** [Tailwind CSS](https://tailwindcss.com/)
* **State Management:** [Pinia](https://pinia.vuejs.org/) + [VueUse](https://vueuse.org/) (Local Storage Persistence)
* **Icons:** [Lucide Vue](https://lucide.dev/)
* **AI Backend:** [Ollama](https://ollama.com/) (Local LLM)

---

### Prerequisites

1.  **Node.js** (v18 or higher)
2.  **Ollama** installed and running on your machine.

### 1. Setup Ollama (The AI Brain)

Milky relies on a local LLM to function. The application can still be launched without a live ollama server but the AI functionalities will be disabled.
1.  Download and install [Ollama](https://ollama.com/download).
2.  Pull a model (`llama3` or `mistral` works). Open your terminal/command prompt and run:
    ```bash
    ollama run llama3
    ```
3.  Keep this terminal window running in the background. Milky connects to it via port `11434`.

### 2. Install Project

```bash
# Clone the repository
git clone [https://github.com/your-username/milky-adhd-assistant.git](https://github.com/your-username/milky-adhd-assistant.git)

# Navigate into the folder
cd milky-adhd-assistant

# Install dependencies
npm install

```


### 2. Launch Project

```bash

# Launch application
npm run dev