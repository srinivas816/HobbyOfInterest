import type { Role } from "@prisma/client";
import { catalogSummaryForAi } from "./onboardingCatalog.js";

const SYSTEM_INSTRUCTION = `You help map a short user description to fixed onboarding IDs. Reply with JSON only: {"learner":{...}} OR {"instructor":{...}} matching the user's role. Only use IDs from the lists. Arrays must contain valid ids only.

${catalogSummaryForAi()}

If role is LEARNER, include learner object with: interests (string[]), primaryGoal, weeklyHours, formatPreference, level. Optionally domainNiches: object mapping a selected interest id to an array of sub-niche ids (max 4 per domain). Only include keys for interests the user actually selected; only use niche ids listed under that domain in the catalog above. You may still send foodNiches (string[]) for backward compat when food_baking is selected — same ids as food_baking's sub-list.
If role is INSTRUCTOR, include instructor object with: domains (string[]), experienceBand, audience, classFormat, sessionLength, teachingStyles (string[]). Optionally domainNiches the same way for selected domains; optional foodNiches when food_baking is selected.

Important: Guitar, piano, drums, singing, DJing, or any instrument / music teaching → use domain id "music_audio" (not "photography"). Photography is only for photo/video teaching.
Movement & body: Yoga or Pilates → "yoga_pilates". Gym, HIIT, strength, CrossFit, personal training → "fitness_strength". Dance or choreography → "dance_movement". Meditation, breathwork, mindfulness, sleep, stress skills → "wellness". Nutrition coaching or meal planning (not recipe cooking) → "nutrition_health".`;

function parseLlmOnboardingJson(text: string): Record<string, unknown> | null {
  const tryParse = (s: string): Record<string, unknown> | null => {
    try {
      const parsed = JSON.parse(s) as Record<string, unknown>;
      return ((parsed.suggestions as Record<string, unknown>) ?? parsed) as Record<string, unknown>;
    } catch {
      return null;
    }
  };

  const trim = text.trim();
  let r = tryParse(trim);
  if (r) return r;
  const fence = trim.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) {
    r = tryParse(fence[1].trim());
    if (r) return r;
  }
  const obj = trim.match(/\{[\s\S]*\}/);
  if (obj) return tryParse(obj[0]);
  return null;
}

async function geminiOnboardingSuggestions(prompt: string, role: Role): Promise<Record<string, unknown> | null> {
  const key = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY;
  if (!key) return null;

  const model = process.env.GEMINI_MODEL || "gemini-2.0-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(key)}`;

  const body = {
    systemInstruction: {
      parts: [{ text: SYSTEM_INSTRUCTION }],
    },
    contents: [
      {
        role: "user",
        parts: [{ text: `Role: ${role}\nStory: ${prompt}` }],
      },
    ],
    generationConfig: {
      temperature: 0.2,
      responseMimeType: "application/json",
    },
  };

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) return null;

  const data = (await res.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
    error?: { message?: string };
  };

  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) return null;
  return parseLlmOnboardingJson(text);
}

async function openAiOnboardingSuggestions(prompt: string, role: Role): Promise<Record<string, unknown> | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  const body = {
    model: process.env.OPENAI_MODEL || "gpt-4o-mini",
    response_format: { type: "json_object" as const },
    messages: [
      { role: "system" as const, content: SYSTEM_INSTRUCTION },
      { role: "user" as const, content: `Role: ${role}\nStory: ${prompt}` },
    ],
  };

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) return null;
  const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  const text = data.choices?.[0]?.message?.content;
  if (!text) return null;
  return parseLlmOnboardingJson(text);
}

export type OnboardingLlmProvider = "gemini" | "openai";

/**
 * Gemini first (GEMINI_API_KEY or GOOGLE_AI_API_KEY), then OpenAI, else null.
 */
export async function llmOnboardingSuggestions(
  prompt: string,
  role: Role,
): Promise<{ raw: Record<string, unknown>; provider: OnboardingLlmProvider } | null> {
  const gemini = await geminiOnboardingSuggestions(prompt, role);
  if (gemini) return { raw: gemini, provider: "gemini" };

  const openai = await openAiOnboardingSuggestions(prompt, role);
  if (openai) return { raw: openai, provider: "openai" };

  return null;
}
