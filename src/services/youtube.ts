export interface YouTubeResult {
  transcript: string;
  title: string;
  thumbnail: string;
  videoId: string;
}

export interface YouTubeError {
  error: string;
}

const CORS_PROXY = 'https://api.allorigins.win/raw?url=';

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

function parseXmlCaptions(xml: string): string {
  const textRegex = /<text[^>]*>([\s\S]*?)<\/text>/g;
  const segments: string[] = [];
  let match;
  while ((match = textRegex.exec(xml)) !== null) {
    const raw = match[1]
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&apos;/g, "'")
      .replace(/<[^>]+>/g, '')
      .trim();
    if (raw) segments.push(raw);
  }
  return segments.join(' ');
}

async function fetchTranscriptFromYouTubePage(videoId: string): Promise<string> {
  const watchUrl = `https://www.youtube.com/watch?v=${videoId}`;
  const proxiedUrl = CORS_PROXY + encodeURIComponent(watchUrl);

  const res = await fetch(proxiedUrl);
  if (!res.ok) throw new Error(`Page fetch failed: ${res.status}`);
  const html = await res.text();

  const match = html.match(/ytInitialPlayerResponse\s*=\s*(\{.+?\});/s);
  if (!match) throw new Error('Could not find ytInitialPlayerResponse');

  let playerResponse: any;
  try {
    playerResponse = JSON.parse(match[1]);
  } catch {
    throw new Error('Failed to parse ytInitialPlayerResponse');
  }

  const tracks =
    playerResponse?.captions?.playerCaptionsTracklistRenderer?.captionTracks;

  if (!tracks || tracks.length === 0) {
    throw new Error('No caption tracks found');
  }

  const preferEnglish = tracks.find(
    (t: any) =>
      t.languageCode === 'en' ||
      t.languageCode === 'en-US' ||
      t.languageCode === 'en-GB'
  ) || tracks[0];

  const captionUrl = preferEnglish.baseUrl;
  if (!captionUrl) throw new Error('No caption URL found');

  const captionRes = await fetch(CORS_PROXY + encodeURIComponent(captionUrl));
  if (!captionRes.ok) throw new Error(`Caption fetch failed: ${captionRes.status}`);
  const xml = await captionRes.text();

  const transcript = parseXmlCaptions(xml);
  if (!transcript || transcript.length < 50) throw new Error('Transcript too short');

  return transcript;
}

async function fetchTranscriptDirectTimedtext(videoId: string): Promise<string> {
  const timedtextUrl = `https://www.youtube.com/api/timedtext?v=${videoId}&lang=en&fmt=json3`;
  const proxied = CORS_PROXY + encodeURIComponent(timedtextUrl);

  const res = await fetch(proxied);
  if (!res.ok) throw new Error(`timedtext failed: ${res.status}`);

  const data = await res.json();
  const events: any[] = data?.events || [];
  const text = events
    .flatMap((e: any) => (e.segs || []).map((s: any) => s.utf8 || ''))
    .join(' ')
    .replace(/\n/g, ' ')
    .trim();

  if (!text || text.length < 50) throw new Error('timedtext transcript too short');
  return text;
}

export async function fetchYouTubeTranscript(url: string): Promise<YouTubeResult | YouTubeError> {
  const videoId = extractVideoId(url);
  if (!videoId) {
    return { error: 'Could not extract video ID from this URL. Please use a valid YouTube link.' };
  }

  const metadata = await fetchMetadata(url);

  try {
    const transcript = await fetchTranscriptFromYouTubePage(videoId);
    return { transcript, ...metadata, videoId };
  } catch (e1) {
    console.warn('Primary transcript method failed:', e1);
  }

  try {
    const transcript = await fetchTranscriptDirectTimedtext(videoId);
    return { transcript, ...metadata, videoId };
  } catch (e2) {
    console.warn('Timed text method failed:', e2);
  }

  return {
    error:
      'Could not fetch transcript. This can happen if the video has auto-generated captions only (try a different browser), or if the video is very new. YouTube may also rate-limit transcript access temporarily.',
  };
}
