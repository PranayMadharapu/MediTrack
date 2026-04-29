// AI Service – powered by Claude (Anthropic) via API
// Configure VITE_ANTHROPIC_API_KEY in your .env.local file

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-sonnet-4-20250514';

async function callClaude(
  systemPrompt: string,
  userMessage: string,
  maxTokens = 1000
): Promise<string> {
  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY as string | undefined;

  if (!apiKey) {
    // Graceful fallback – AI features unavailable without a key
    return '[AI features require VITE_ANTHROPIC_API_KEY to be configured.]';
  }

  const response = await fetch(ANTHROPIC_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: maxTokens,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Claude API error ${response.status}: ${err}`);
  }

  const data = await response.json();
  return (data.content as { type: string; text: string }[])
    .filter((b) => b.type === 'text')
    .map((b) => b.text)
    .join('');
}

// ─── MediBot chat advisor ─────────────────────────────────────────────────────
export const getGeminiAdvisor = async (prompt: string): Promise<string> => {
  return callClaude(
    `You are a helpful and kind medical assistant for elderly people.
Answer questions about medicines clearly and in simple language.
Always advise consulting a doctor for professional medical decisions or changes.
If a user mentions missing a dose, give safe general advice based on common protocols.
Keep answers concise and reassuring.`,
    prompt
  );
};

// ─── Health adherence report ──────────────────────────────────────────────────
export const getAdherenceReport = async (
  logs: Array<{ medicineId: string; status: string; timestamp: string }>,
  medicines: Array<{ id: string; name: string; dosage: string }>
): Promise<{ summary: string; score: number; alerts: string[] }> => {
  const dataString = JSON.stringify({ logs, medicines });

  try {
    const raw = await callClaude(
      `You are a medical analytics AI. Analyze medication adherence data and return ONLY a valid JSON object with this exact structure (no markdown fences, no extra text):
{"summary":"<one concise paragraph>","score":<integer 0-100>,"alerts":["<alert1>","<alert2>"]}`,
      `Analyze this adherence data and return the JSON object: ${dataString}`,
      600
    );

    // Strip any accidental markdown fences
    const clean = raw.replace(/```(?:json)?|```/g, '').trim();
    return JSON.parse(clean) as { summary: string; score: number; alerts: string[] };
  } catch {
    return {
      summary: 'Unable to generate analysis at this time. Please check your connection.',
      score: 0,
      alerts: [],
    };
  }
};

// ─── Voice reminder via Web Speech API ───────────────────────────────────────
export const generateVoiceReminder = async (text: string): Promise<string | null> => {
  if ('speechSynthesis' in window) {
    // Cancel any currently speaking utterance
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 0.88;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    // Prefer a natural-sounding voice if available
    const voices = window.speechSynthesis.getVoices();
    const preferred = voices.find(
      (v) =>
        v.lang.startsWith('en') &&
        (v.name.includes('Google') || v.name.includes('Samantha') || v.name.includes('Alex'))
    );
    if (preferred) utterance.voice = preferred;

    window.speechSynthesis.speak(utterance);
  }
  // Return null – we used Web Speech API directly, not base64 audio
  return null;
};
