export interface YouTubeResult {
  transcript: string;
  title: string;
  thumbnail: string;
  videoId: string;
}

export interface YouTubeError {
  error: string;
}

function extractVideoId(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.includes('youtube.com') && u.pathname === '/watch') return u.searchParams.get('v');
    if (u.hostname === 'youtu.be') return u.pathname.slice(1).split('?')[0];
    if (u.hostname.includes('youtube.com') && u.pathname.startsWith('/shorts/'))
      return u.pathname.replace('/shorts/', '').split('?')[0];
    if (u.hostname.includes('youtube.com') && u.pathname.startsWith('/embed/'))
      return u.pathname.replace('/embed/', '').split('?')[0];
  } catch {}
  return null;
}

async function fetchMetadata(videoId: string): Promise<{ title: string; thumbnail: string }> {
  try {
    const res = await fetch(
      `https://noembed.com/embed?url=${encodeURIComponent(`https://www.youtube.com/watch?v=${videoId}`)}`
    );
    if (res.ok) {
      const data = await res.json();
      return {
        title: data.title || 'YouTube Video',
        thumbnail: data.thumbnail_url || `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
      };
    }
  } catch {}
  return { title: 'YouTube Video', thumbnail: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` };
}

/**
 * Fetch transcript via Vite's server-side yt-dlp plugin.
 * Works for any video that has captions (manual or YouTube auto-generated ASR).
 * No CORS issues — all fetching happens on the server.
 */
async function fetchViaServer(videoId: string): Promise<string> {
  const res = await fetch(`/api/yt-transcript?v=${videoId}`);
  const data = await res.json();
  if (!res.ok || data.error) throw new Error(data.error || `Server error ${res.status}`);
  if (!data.transcript || data.transcript.length < 30) throw new Error('Empty transcript from server');
  return data.transcript;
}

export async function fetchYouTubeTranscript(url: string): Promise<YouTubeResult | YouTubeError> {
  const videoId = extractVideoId(url);
  if (!videoId) {
    return { error: 'Could not extract video ID. Please use a valid YouTube URL (e.g. youtube.com/watch?v=...).' };
  }

  const [metadata] = await Promise.all([fetchMetadata(videoId)]);

  try {
    const transcript = await fetchViaServer(videoId);
    return { transcript, ...metadata, videoId };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      error: `Could not fetch transcript: ${msg}. Make sure the video is public and has captions enabled (most YouTube videos have auto-generated captions).`,
    };
  }
}
