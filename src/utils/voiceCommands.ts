export type VoiceIntent =
  | { type: 'create_note'; title?: string }
  | { type: 'create_todo'; title?: string; initialTask?: string }
  | { type: 'start_timer' }
  | { type: 'stop_timer' }
  | { type: 'delete_note' }
  | { type: 'delete_task' }
  | { type: 'open_note_chat' }
  | { type: 'close_note_chat' }
  | { type: 'summarize_note' }
  | { type: 'generate_flashcards' }
  | { type: 'chat_with_notes'; question?: string }
  | { type: 'export_note'; format: 'pdf' | 'txt' | 'docx' }
  | { type: 'add_task'; text?: string }
  | { type: 'stop_voice' }
  | { type: 'toggle_sidebar' }
  | { type: 'open_sidebar' }
  | { type: 'close_sidebar' }
  | { type: 'select_note_ordinal'; ordinal: 'first' | 'second' | 'third' | 'fourth' | 'last' }
  | { type: 'select_note_by_title'; title: string }
  | { type: 'next_note' }
  | { type: 'previous_note' }
  | { type: 'append_text'; text: string }
  | { type: 'set_note_title'; title: string }
  | { type: 'start_voice' }
  | { type: 'voice_reply'; message: string }
  | { type: 'unknown' };

const ORDINAL_MAP: Record<string, VoiceIntent & { type: 'select_note_ordinal' }> = {
  first: { type: 'select_note_ordinal', ordinal: 'first' },
  '1st': { type: 'select_note_ordinal', ordinal: 'first' },
  second: { type: 'select_note_ordinal', ordinal: 'second' },
  '2nd': { type: 'select_note_ordinal', ordinal: 'second' },
  third: { type: 'select_note_ordinal', ordinal: 'third' },
  '3rd': { type: 'select_note_ordinal', ordinal: 'third' },
  fourth: { type: 'select_note_ordinal', ordinal: 'fourth' },
  '4th': { type: 'select_note_ordinal', ordinal: 'fourth' },
  last: { type: 'select_note_ordinal', ordinal: 'last' },
};

export function parseVoiceIntent(input: string): VoiceIntent {
  const text = input.trim().toLowerCase();
  const raw = input.trim();

  if (
    /^(stop|turn off)\s+(voice|listening|the mic|mic|microphone)\b/.test(text) ||
    /^mute\s+(voice|mic|microphone)\b/.test(text) ||
    text === 'stop listening' ||
    text === 'stop voice'
  ) {
    return { type: 'stop_voice' };
  }

  if (
    /^(start|enable|turn on)\s+(voice|listening|voice control)\b/.test(text) ||
    text === 'start voice' ||
    text === 'start listening'
  ) {
    return { type: 'start_voice' };
  }

  if (/\b(next note|select next note|go to next note)\b/.test(text)) {
    return { type: 'next_note' };
  }
  if (/\b(previous note|prior note|select previous note|go to previous note)\b/.test(text)) {
    return { type: 'previous_note' };
  }

  if (/\b(open|show)\s+(the\s+)?sidebar\b/.test(text) || text === 'open sidebar') {
    return { type: 'open_sidebar' };
  }
  if (/\b(close|hide)\s+(the\s+)?sidebar\b/.test(text) || text === 'close sidebar') {
    return { type: 'close_sidebar' };
  }
  if (/\btoggle\s+(the\s+)?sidebar\b/.test(text)) {
    return { type: 'toggle_sidebar' };
  }

  const ordinalMatch = text.match(
    /^(select|open|go to)\s+(the\s+)?(first|1st|second|2nd|third|3rd|fourth|4th|last)\s+note\b/i
  );
  if (ordinalMatch) {
    const word = ordinalMatch[3].toLowerCase();
    const intent = ORDINAL_MAP[word];
    if (intent) return intent;
  }

  const calledNote = raw.match(/^open\s+note\s+called\s+(.+)$/i);
  if (calledNote?.[1]) {
    return { type: 'select_note_by_title', title: calledNote[1].trim() };
  }
  const openNoteTitle = raw.match(/^open\s+note\s+(.+)$/i);
  if (openNoteTitle?.[1]) {
    const frag = openNoteTitle[1].trim();
    if (!/^called\b/i.test(frag)) {
      return { type: 'select_note_by_title', title: frag };
    }
  }

  const titlePick = raw.match(/^(select|open|go to)\s+note\s+(.+)$/i);
  if (titlePick?.[2]) {
    return { type: 'select_note_by_title', title: titlePick[2].trim() };
  }

  const renameMatch = raw.match(/^(rename\s+(this\s+)?note\s+to|set\s+(the\s+)?title\s+to|title\s+(this\s+)?note\s+to)\s+(.+)$/i);
  if (renameMatch?.[5]) {
    return { type: 'set_note_title', title: renameMatch[5].trim() };
  }

  if (
    /\b(stop|pause)\s+(the\s+)?(timer|time|pomodoro|focus\s+timer)\b/.test(text) ||
    /^stop\s+time\b/.test(text)
  ) {
    return { type: 'stop_timer' };
  }
  if (/\b(start|resume)\s+(the\s+)?(timer|pomodoro|focus\s+timer)\b/.test(text)) {
    return { type: 'start_timer' };
  }

  if (/\b(delete|remove)\s+(this\s+)?note\b/.test(text) || /^trash\s+(this\s+)?note\b/.test(text)) {
    return { type: 'delete_note' };
  }

  if (/\b(delete|remove)\s+(the\s+)?last\s+task\b/.test(text) || /\b(delete|remove)\s+task\b/.test(text)) {
    return { type: 'delete_task' };
  }

  if (
    /\bopen\s+(the\s+)?notes?\s+chat\b/.test(text) ||
    /\bopen\s+note\s+chat\b/.test(text) ||
    (/\bopen\s+chat\b/.test(text) && /\b(note|notes)\b/.test(text))
  ) {
    return { type: 'open_note_chat' };
  }
  if (
    /\bclose\s+(the\s+)?notes?\s+chat\b/.test(text) ||
    /\bclose\s+note\s+chat\b/.test(text) ||
    (/\bclose\s+chat\b/.test(text) && /\b(note|notes)\b/.test(text))
  ) {
    return { type: 'close_note_chat' };
  }

  const todoWithTask = raw.match(
    /^create\s+(a\s+)?new\s+todo(?:\s+and\s+add\s+task\s+|\s+and\s+task\s+|\s+with\s+task\s+|\s+add\s+task\s+)(.+)$/i
  );
  if (todoWithTask?.[2]?.trim()) {
    return { type: 'create_todo', initialTask: todoWithTask[2].trim() };
  }
  if (/^create\s+(a\s+)?new\s+todo\b/i.test(text)) {
    const titleMatch =
      raw.match(/called\s+(.+)$/i) || raw.match(/\btitled\s+(.+)$/i) || raw.match(/\bnamed\s+(.+)$/i);
    return { type: 'create_todo', title: titleMatch?.[1]?.trim() };
  }

  const voiceNoteIntent =
    text.startsWith('create a new note') ||
    text.startsWith('create new note') ||
    /^create\s+a\s+note\b/.test(text) ||
    /\bcreate\s+me\s+(a\s+)?new\s+note\b/.test(text) ||
    /\b(can you|could you)\s+(please\s+)?create\s+(me\s+)?(a\s+)?new\s+note\b/.test(text) ||
    /\bplease\s+create\s+(me\s+)?(a\s+)?new\s+note\b/.test(text) ||
    text.startsWith('new note') ||
    /^make\s+(a\s+)?new\s+note\b/.test(text) ||
    /^make\s+a\s+note\b/.test(text) ||
    /^start\s+(a\s+)?new\s+note\b/.test(text) ||
    /^open\s+(a\s+)?new\s+note\b/.test(text) ||
    /\b(create|start|make|open)\s+(a\s+)?new\s+voice\s*(to\s*)?note\b/i.test(text) ||
    /\bnew\s+voice\s*(to\s*)?note\b/.test(text) ||
    (/\bvoice\s+note\b/.test(text) && /\b(create|new|start|make|open)\b/.test(text));

  if (voiceNoteIntent) {
    const titleMatch =
      raw.match(/called\s+(.+)$/i) || raw.match(/\btitled\s+(.+)$/i) || raw.match(/\bnamed\s+(.+)$/i);
    return { type: 'create_note', title: titleMatch?.[1]?.trim() };
  }

  const appendPrefixes = [
    /^(write|append|dictate)\s+/i,
    /^add\s+to\s+(the\s+)?note\s+/i,
    /^add\s+text\s+/i,
    /^(please\s+)?(type|say)\s+/i,
  ];
  for (const re of appendPrefixes) {
    const m = raw.match(re);
    if (m && raw.length > m[0].length) {
      const body = raw.slice(m[0].length).trim();
      if (body) return { type: 'append_text', text: body };
    }
  }

  if (text.includes('summarize this note') || text.includes('summarize the note')) {
    return { type: 'summarize_note' };
  }

  if (text === 'summarize note' || /\bsummarize\s+note\b/.test(text)) {
    return { type: 'summarize_note' };
  }

  if (text.includes('generate flashcards') || text.includes('make flashcards')) {
    return { type: 'generate_flashcards' };
  }

  if (text.startsWith('chat with notes')) {
    const question = input.replace(/chat with notes( about)?/i, '').trim();
    return { type: 'chat_with_notes', question: question || undefined };
  }

  if (text.includes('export as pdf')) return { type: 'export_note', format: 'pdf' };
  if (text.includes('export as txt') || text.includes('export as text')) return { type: 'export_note', format: 'txt' };
  if (text.includes('export as docx') || text.includes('export as word')) return { type: 'export_note', format: 'docx' };

  const addTaskQuoted = raw.match(/^add\s+(?:a\s+)?(?:new\s+)?task\s+(?:that\s+says\s+|saying\s+)?["'](.+)["']\s*$/i);
  if (addTaskQuoted?.[1]?.trim()) {
    return { type: 'add_task', text: addTaskQuoted[1].trim() };
  }
  const addTaskTail = raw.match(/^add\s+(?:a\s+)?(?:new\s+)?task(?:\s+for\s+)?\s+(.+)$/i);
  if (addTaskTail?.[1]?.trim()) {
    return { type: 'add_task', text: addTaskTail[1].trim() };
  }
  if (text.startsWith('add task') || /^add\s+a\s+task\b/.test(text)) {
    const task = input.replace(/^add\s+a\s+task/i, '').replace(/^add\s+task/i, '').trim();
    return { type: 'add_task', text: task || undefined };
  }

  return { type: 'unknown' };
}
