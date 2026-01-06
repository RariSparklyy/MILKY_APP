import { ref } from 'vue';

export function useMilky() {
  const isThinking = ref(false);

  // Default system prompt ensuring supportive tone
  const SYSTEM_PROMPT = `You are Milky, an ADHD focus assistant. 
  Your goal is to lower activation energy for tasks.
  Keep responses concise, supportive, and strictly formatted.
  Do NOT use emojis. Use bullet points for lists.`;

  const askMilky = async (userPrompt, specificContext = '') => {
    isThinking.value = true;
    try {
      const response = await fetch('http://localhost:11434/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'llama3.2', // Ensure you have this pulled in Ollama
          prompt: userPrompt,
          system: `${SYSTEM_PROMPT} ${specificContext}`,
          stream: false
        })
      });
      const data = await response.json();
      return data.response;
    } catch (error) {
      console.error("Milky Connection Error:", error);
      return "Milky is offline. Ensure Ollama is running.";
    } finally {
      isThinking.value = false;
    }
  };

  return { askMilky, isThinking };
}

