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
    const urlObj = new URL(url);
    if (urlObj.hostname.includes('youtube.com') && urlObj.pathname === '/watch') {
      return urlObj.searchParams.get('v');
    }
    if (urlObj.hostname === 'youtu.be') {
      return urlObj.pathname.slice(1).split('?')[0];
    }
    if (urlObj.hostname.includes('youtube.com') && urlObj.pathname.startsWith('/shorts/')) {
      return urlObj.pathname.replace('/shorts/', '').split('?')[0];
    }
    if (urlObj.hostname.includes('youtube.com') && urlObj.pathname.startsWith('/embed/')) {
      return urlObj.pathname.replace('/embed/', '').split('?')[0];
    }
  } catch {}
  return null;
}

async function fetchMetadata(url: string): Promise<{ title: string; thumbnail: string }> {
  try {
    const res = await fetch(`https://noembed.com/embed?url=${encodeURIComponent(url)}`);
    if (!res.ok) return { title: 'YouTube Video', thumbnail: '' };
    const data = await res.json();
    return {
      title: data.title || 'YouTube Video',
      thumbnail: data.thumbnail_url || '',
    };
  } catch {
    return { title: 'YouTube Video', thumbnail: '' };
  }
}

function parseTranscript(data: any): string {
  if (typeof data === 'string') return data;
  if (Array.isArray(data)) {
    return data.map((item: any) => item.text || item.transcript || '').join(' ');
  }
  if (data?.transcript) {
    if (Array.isArray(data.transcript)) {
      return data.transcript.map((item: any) => item.text || '').join(' ');
    }
    return String(data.transcript);
  }
  if (data?.text) return String(data.text);
  return '';
}

export async function fetchYouTubeTranscript(url: string): Promise<YouTubeResult | YouTubeError> {
  const videoId = extractVideoId(url);
  if (!videoId) {
    return { error: 'Could not extract video ID from this URL. Please use a valid YouTube link.' };
  }

  const metadata = await fetchMetadata(url);

  try {
    const res = await fetch(
      `https://www.youtube-transcript-extractor.com/api?videoId=${videoId}`
    );
    if (res.ok) {
      const data = await res.json();
      const transcript = parseTranscript(data).trim();
      if (transcript.length > 50) {
        return { transcript, ...metadata, videoId };
      }
    }
  } catch {}

  try {
    const res = await fetch(
      `https://api.kome.ai/api/tools/youtube-transcripts?videoId=${videoId}`
    );
    if (res.ok) {
      const data = await res.json();
      const transcript = parseTranscript(data).trim();
      if (transcript.length > 50) {
        return { transcript, ...metadata, videoId };
      }
    }
  } catch {}

  return {
    error:
      'Could not fetch transcript for this video. The video may not have captions enabled, or is private.',
  };
}
