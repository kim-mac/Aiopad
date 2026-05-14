const ELEVEN_STT_PATH = '/api/eleven/speech-to-text';
const ELEVEN_TTS_PATH = '/api/eleven/text-to-speech';

export type VoiceCommandResult = {
  transcript: string;
  confidence: number;
  source: 'realtime' | 'batch';
};

export type RealtimeSession = {
  stop: () => void;
};

function getSpeechRecognitionCtor(): SpeechRecognitionConstructor | undefined {
  return window.SpeechRecognition || window.webkitSpeechRecognition;
}

/** Errors that are normal in continuous mode — do not surface to the user */
function isBenignSpeechError(code: string): boolean {
  return code === 'no-speech' || code === 'aborted' || code === 'captured-speech';
}

export function startRealtimeTranscription(
  onFinal: (text: string) => void,
  onPartial?: (text: string) => void,
  onError?: (error: string) => void
): RealtimeSession | null {
  const Ctor = getSpeechRecognitionCtor();
  if (!Ctor) return null;

  const recognition = new Ctor();
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = 'en-US';

  let userStopped = false;
  let restartTimer: ReturnType<typeof setTimeout> | null = null;

  const clearRestart = () => {
    if (restartTimer) {
      clearTimeout(restartTimer);
      restartTimer = null;
    }
  };

  /** Commit after the user pauses — fixes Chrome rarely emitting isFinal while interim keeps updating. */
  let utterCommitTimer: ReturnType<typeof setTimeout> | null = null;
  let latestCombined = '';
  const UTTER_GAP_MS = 780;

  const clearUtterCommit = () => {
    if (utterCommitTimer) {
      clearTimeout(utterCommitTimer);
      utterCommitTimer = null;
    }
  };

  const safeStart = () => {
    if (userStopped) return;
    try {
      recognition.start();
    } catch {
      restartTimer = setTimeout(safeStart, 200);
    }
  };

  recognition.onresult = (event: SpeechRecognitionEvent) => {
    let combined = '';
    for (let i = 0; i < event.results.length; i++) {
      const alt = event.results[i][0];
      if (alt) combined += alt.transcript;
    }
    combined = combined.trim();
    if (!combined) return;

    let interimChunk = '';
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const alt = event.results[i][0];
      if (!alt) continue;
      if (!event.results[i].isFinal) interimChunk += alt.transcript;
    }
    if (interimChunk.trim() && onPartial) onPartial(interimChunk.trim());

    latestCombined = combined;
    clearUtterCommit();
    utterCommitTimer = setTimeout(() => {
      utterCommitTimer = null;
      const line = latestCombined.trim();
      latestCombined = '';
      if (line) onFinal(line);
    }, UTTER_GAP_MS);
  };

  recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
    const code = event.error || 'speech-recognition-error';
    if (isBenignSpeechError(code)) return;
    if (onError) onError(code);
  };

  recognition.onend = () => {
    if (userStopped) return;
    clearRestart();
    restartTimer = setTimeout(() => {
      restartTimer = null;
      safeStart();
    }, 140);
  };

  recognition.start();

  return {
    stop: () => {
      userStopped = true;
      clearRestart();
      clearUtterCommit();
      latestCombined = '';
      try {
        recognition.stop();
      } catch {
        /* already stopped */
      }
    },
  };
}

export async function transcribeWithElevenBatch(audioBlob: Blob): Promise<VoiceCommandResult> {
  const form = new FormData();
  form.append('file', audioBlob, 'command.webm');
  form.append('model_id', 'scribe_v2');
  form.append('language_code', 'eng');
  form.append('tag_audio_events', 'false');
  form.append('diarize', 'false');

  const response = await fetch(ELEVEN_STT_PATH, {
    method: 'POST',
    body: form,
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`STT failed (${response.status}): ${message.slice(0, 180)}`);
  }

  const data = await response.json();
  const transcript = (data.text || data.transcript || '').trim();
  return {
    transcript,
    confidence: typeof data.confidence === 'number' ? data.confidence : 0.75,
    source: 'batch',
  };
}

export async function speakWithEleven(
  text: string,
  opts?: { voiceId?: string; modelId?: string; rate?: number }
): Promise<void> {
  const response = await fetch(ELEVEN_TTS_PATH, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text,
      voice_id: opts?.voiceId,
      model_id: opts?.modelId ?? 'eleven_multilingual_v2',
    }),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`TTS failed (${response.status}): ${message.slice(0, 180)}`);
  }

  const audioBlob = await response.blob();
  const url = URL.createObjectURL(audioBlob);
  try {
    const audio = new Audio(url);
    await audio.play();
    // `play()` resolves when playback starts, not when it ends — wait or the mic captures our own TTS.
    await new Promise<void>((resolve) => {
      let settled = false;
      const fin = () => {
        if (settled) return;
        settled = true;
        resolve();
      };
      audio.addEventListener('ended', fin, { once: true });
      audio.addEventListener('error', fin, { once: true });
      if (audio.ended) fin();
      window.setTimeout(fin, 20000);
    });
    await new Promise((r) => window.setTimeout(r, 200));
  } finally {
    window.setTimeout(() => URL.revokeObjectURL(url), 4000);
  }
}
