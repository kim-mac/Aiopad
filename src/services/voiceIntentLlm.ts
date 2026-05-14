import { callNvidia } from './nvidia';
import { parseVoiceIntent, type VoiceIntent } from '../utils/voiceCommands';

export type VoiceIntentContext = {
  noteTitles: string[];
  hasOpenNote: boolean;
  selectedTitle?: string;
};

function stripJsonFence(s: string): string {
  return s.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
}

function looksLikeApiError(text: string): boolean {
  return /^error:/i.test(text.trim()) || text.includes('API request failed');
}

function mapLlmPayload(raw: Record<string, unknown>): VoiceIntent {
  const action = String(raw.action || '').trim().toLowerCase();
  const title = raw.title != null ? String(raw.title).trim() : undefined;
  const text = raw.text != null ? String(raw.text).trim() : undefined;
  const targetTitle = raw.targetTitle != null ? String(raw.targetTitle).trim() : undefined;
  const ordinalRaw = raw.ordinal != null ? String(raw.ordinal).trim().toLowerCase() : '';
  const formatRaw = raw.format != null ? String(raw.format).trim().toLowerCase() : '';
  const question = raw.question != null ? String(raw.question).trim() : undefined;
  const reply = raw.reply != null ? String(raw.reply).trim() : undefined;

  if (action === 'noop' && reply) {
    return { type: 'voice_reply', message: reply.slice(0, 500) };
  }

  switch (action) {
    case 'create_note':
      return { type: 'create_note', title: title || undefined };
    case 'create_todo':
      return { type: 'create_todo', title: title || undefined, initialTask: text || undefined };
    case 'start_timer':
    case 'start_pomodoro':
      return { type: 'start_timer' };
    case 'stop_timer':
    case 'stop_pomodoro':
    case 'pause_timer':
      return { type: 'stop_timer' };
    case 'delete_note':
      return { type: 'delete_note' };
    case 'delete_task':
      return { type: 'delete_task' };
    case 'open_note_chat':
    case 'open_chat_panel':
      return { type: 'open_note_chat' };
    case 'close_note_chat':
    case 'close_chat_panel':
      return { type: 'close_note_chat' };
    case 'append_text':
      if (!text) return { type: 'unknown' };
      return { type: 'append_text', text: text.slice(0, 8000) };
    case 'add_task':
      return { type: 'add_task', text: text || undefined };
    case 'summarize_note':
      return { type: 'summarize_note' };
    case 'generate_flashcards':
      return { type: 'generate_flashcards' };
    case 'export_note': {
      const f = formatRaw === 'txt' || formatRaw === 'text' ? 'txt' : formatRaw === 'docx' || formatRaw === 'word' ? 'docx' : 'pdf';
      return { type: 'export_note', format: f };
    }
    case 'open_sidebar':
      return { type: 'open_sidebar' };
    case 'close_sidebar':
      return { type: 'close_sidebar' };
    case 'toggle_sidebar':
      return { type: 'toggle_sidebar' };
    case 'next_note':
      return { type: 'next_note' };
    case 'previous_note':
      return { type: 'previous_note' };
    case 'stop_voice':
      return { type: 'stop_voice' };
    case 'select_note_by_title':
      if (!targetTitle) return { type: 'unknown' };
      return { type: 'select_note_by_title', title: targetTitle.slice(0, 200) };
    case 'select_note_ordinal': {
      const map: Record<string, 'first' | 'second' | 'third' | 'fourth' | 'last'> = {
        first: 'first',
        '1st': 'first',
        second: 'second',
        '2nd': 'second',
        third: 'third',
        '3rd': 'third',
        fourth: 'fourth',
        '4th': 'fourth',
        last: 'last',
      };
      const ord = map[ordinalRaw];
      if (!ord) return { type: 'unknown' };
      return { type: 'select_note_ordinal', ordinal: ord };
    }
    case 'set_note_title':
      if (!title) return { type: 'unknown' };
      return { type: 'set_note_title', title: title.slice(0, 300) };
    case 'chat_with_notes':
      return { type: 'chat_with_notes', question: question || undefined };
    default:
      return { type: 'unknown' };
  }
}

/**
 * Fast path: regex intents. Slow path: NVIDIA LLM maps free-form speech into the same closed action set.
 */
export async function resolveVoiceIntent(transcript: string, ctx: VoiceIntentContext): Promise<VoiceIntent> {
  const trimmed = transcript.trim();
  if (!trimmed) return { type: 'unknown' };

  const fast = parseVoiceIntent(trimmed);
  if (fast.type !== 'unknown') return fast;

  const titleList = ctx.noteTitles.length
    ? ctx.noteTitles.slice(0, 35).map((t, i) => `${i + 1}. ${t}`).join('\n')
    : '(no notes yet)';

  const system = `You are a voice command router for a desktop notes app (Notepad). The user spoke one short utterance.
Map it to EXACTLY ONE JSON object — no markdown, no commentary, no code fences.

Allowed "action" values ONLY:
create_note | create_todo | start_timer | stop_timer | delete_note | delete_task | open_note_chat | close_note_chat |
append_text | add_task | summarize_note | generate_flashcards | export_note |
open_sidebar | close_sidebar | toggle_sidebar | next_note | previous_note |
select_note_by_title | select_note_ordinal | set_note_title | chat_with_notes | stop_voice | noop

JSON shape (use null for unused fields):
{
  "action": "<one of the list>",
  "title": null,
  "text": null,
  "targetTitle": null,
  "ordinal": null,
  "format": null,
  "question": null,
  "reply": null
}

Rules:
- Prefer concrete actions over noop. Use chat_with_notes for questions about their notes, comparisons, "what did I write about X", reminders buried in notes, or anything needing reasoning over note content (put the user's request in "question").
- append_text: user wants to dictate/journal/log text into the open note. Put ONLY the prose to append in "text" (strip meta phrases like "add to my note" when possible).
- add_task: user wants a checklist item on the current note; put task text in "text".
- create_note: user wants a NEW speech-captured note (voice-to-note). Optional "title" if they name it — always prefer create_note over append when they ask for a new note.
- create_todo: new checklist note. Optional "title". Put first task wording in "text" if they say e.g. "new todo and add task buy milk".
- start_timer: start or resume the in-editor Pomodoro / focus timer (same as start_pomodoro).
- stop_timer: pause/stop the Pomodoro timer (user may say "stop time" or "pause timer").
- delete_note: delete the current note.
- delete_task: remove the most recently added task (or last task) from the current to-do note.
- open_note_chat: open the note chat panel (no question). close_note_chat: close it.
- select_note_by_title: "targetTitle" is a substring of a note title from the list below.
- select_note_ordinal: "ordinal" one of first, second, third, fourth, last (or 1st, 2nd, 3rd, 4th).
- export_note: "format" pdf | txt | docx.
- stop_voice: user wants to stop microphone / voice control.
- noop + short "reply" (max 120 chars): ONLY for thanks, goodbye, small talk with NO app action — never noop if an action fits.

Context:
- Has an open note: ${ctx.hasOpenNote ? 'yes' : 'no'}
- Current note title: ${ctx.selectedTitle || '(none)'}
- Note titles:
${titleList}`;

  const raw = await callNvidia(
    'nvidia/llama-3.3-nemotron-super-49b-v1',
    [
      { role: 'system', content: system },
      { role: 'user', content: `User said:\n"""${trimmed.slice(0, 2000)}"""` },
    ],
    { max_tokens: 320, temperature: 0.15 }
  );

  if (looksLikeApiError(raw)) return { type: 'unknown' };

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(stripJsonFence(raw)) as Record<string, unknown>;
  } catch {
    return { type: 'unknown' };
  }

  const mapped = mapLlmPayload(parsed);
  if (mapped.type === 'chat_with_notes' && !mapped.question) {
    return { type: 'chat_with_notes', question: trimmed };
  }
  return mapped;
}
