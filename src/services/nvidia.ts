const NVIDIA_BASE_URL = 'https://integrate.api.nvidia.com/v1';
const DEFAULT_MODEL = 'nvidia/llama-3.3-nemotron-super-49b-v1';

function getApiKey(): string {
  return import.meta.env.VITE_NVIDIA_API_KEY || '';
}

export async function callNvidia(
  model: string = DEFAULT_MODEL,
  messages: Array<{ role: string; content: string | Array<{ type: string; text?: string; image_url?: { url: string } }> }>,
  options?: { max_tokens?: number; temperature?: number }
): Promise<string> {
  const apiKey = getApiKey();
  if (!apiKey) {
    return 'Error: NVIDIA API key is not configured. Please add VITE_NVIDIA_API_KEY to your .env file.';
  }

  try {
    const response = await fetch(`${NVIDIA_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        max_tokens: options?.max_tokens ?? 2048,
        temperature: options?.temperature ?? 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('NVIDIA API error:', errorText);
      return `Error: API request failed (${response.status}). ${response.statusText}`;
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content;

    if (!content) {
      return 'Error: No response received from NVIDIA API.';
    }

    return content.trim();
  } catch (error) {
    console.error('NVIDIA callNvidia error:', error);
    return `Error: ${error instanceof Error ? error.message : 'Unknown error occurred'}`;
  }
}

const SYSTEM_PROMPTS: Record<string, string> = {
  youtube: `You are an expert tutor. Break this transcript into clear sections with headings. Explain key concepts in simple terms. End with ## Key Takeaways and ## What To Remember sections.`,
  pdf: `You are an academic assistant. Explain this document in plain English. Structure your response with these sections:
## What This Is About
## Key Arguments
## Methodology
## Key Findings
## Limitations
## Why This Matters
## TL;DR`,
  image: `1. Extract ALL text visible in this image exactly as written.
2. Describe what this image shows in detail.
3. If this is a diagram, chart, or screenshot — explain what it represents and what insights it contains.
4. List key insights or takeaways.`,
  url: `Summarize this webpage content. Cover: main argument, key points, important details, and what the reader should take away. Structure with clear headings.`,
  text: `Explain this content clearly. Highlight the most important points. Structure with headings where appropriate.`,
};

export async function explainContent(
  content: string,
  contentType: 'youtube' | 'pdf' | 'image' | 'url' | 'text'
): Promise<string> {
  const systemPrompt = SYSTEM_PROMPTS[contentType] || SYSTEM_PROMPTS.text;

  return callNvidia(DEFAULT_MODEL, [
    { role: 'system', content: systemPrompt },
    { role: 'user', content },
  ], { max_tokens: 2048 });
}

export async function generateNoteMeta(content: string): Promise<{
  title: string;
  tag: string;
  summary: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}> {
  const response = await callNvidia(DEFAULT_MODEL, [
    {
      role: 'system',
      content: `Return ONLY valid JSON, no extra text, no markdown fences:
{"title": "short descriptive title", "tag": "topic category", "summary": "one line summary", "difficulty": "beginner|intermediate|advanced"}`,
    },
    {
      role: 'user',
      content: `Generate metadata for this content:\n\n${content.slice(0, 3000)}`,
    },
  ], { max_tokens: 256, temperature: 0.3 });

  try {
    const cleaned = response.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(cleaned);
    return {
      title: parsed.title || 'Untitled',
      tag: parsed.tag || 'General',
      summary: parsed.summary || '',
      difficulty: parsed.difficulty || 'intermediate',
    };
  } catch {
    return { title: 'Untitled', tag: 'General', summary: '', difficulty: 'intermediate' };
  }
}

export async function chatWithNotes(
  question: string,
  notesContext: string
): Promise<string> {
  return callNvidia(DEFAULT_MODEL, [
    {
      role: 'system',
      content: `You are a personal knowledge assistant. The user has these saved notes:\n\n${notesContext}\n\nAnswer their question using the notes as context. Quote or reference specific notes when relevant. If the answer isn't in the notes, say so clearly.`,
    },
    { role: 'user', content: question },
  ], { max_tokens: 1024 });
}

export async function generateFlashcards(
  content: string
): Promise<Array<{ front: string; back: string }>> {
  const response = await callNvidia(DEFAULT_MODEL, [
    {
      role: 'system',
      content: `Generate 8-10 flashcards from this content. Return ONLY a valid JSON array, no extra text, no markdown:
[{ "front": "question here", "back": "answer here" }]
Make questions specific and testable. Answers concise but complete.`,
    },
    {
      role: 'user',
      content: content.slice(0, 6000),
    },
  ], { max_tokens: 1024, temperature: 0.5 });

  try {
    const cleaned = response.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(cleaned);
    if (Array.isArray(parsed)) return parsed;
    return [];
  } catch {
    return [];
  }
}
