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

async function fetchMetadata(videoId: string): Promise<{ title: string; thumbnail: string }> {
  try {
    const url = `https://www.youtube.com/watch?v=${videoId}`;
    const res = await fetch(`https://noembed.com/embed?url=${encodeURIComponent(url)}`);
    if (res.ok) {
      const data = await res.json();
      return {
        title: data.title || 'YouTube Video',
        thumbnail: data.thumbnail_url || `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
      };
    }
  } catch {}
  return {
    title: 'YouTube Video',
    thumbnail: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
  };
}

function parseXmlCaptions(xml: string): string {
  const segments: string[] = [];
  const regex = /<text[^>]*>([\s\S]*?)<\/text>/g;
  let match;
  while ((match = regex.exec(xml)) !== null) {
    const text = match[1]
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&apos;/g, "'")
      .replace(/<[^>]+>/g, '')
      .trim();
    if (text) segments.push(text);
  }
  return segments.join(' ').replace(/\s+/g, ' ').trim();
}

function parseJson3Captions(json: any): string {
  const segments: string[] = [];
  try {
    for (const event of json.events ?? []) {
      if (!event.segs) continue;
      const line = event.segs.map((s: any) => s.utf8 ?? '').join('').trim();
      if (line && line !== '\n') segments.push(line);
    }
  } catch {}
  return segments.join(' ').replace(/\s+/g, ' ').trim();
}

/**
 * Primary strategy:
 * 1. Fetch the YouTube watch page through our Vite server-side proxy (bypasses CORS on the HTML).
 * 2. Extract the signed captionTracks baseUrl from ytInitialPlayerResponse.
 * 3. Fetch that signed URL DIRECTLY from the browser — YouTube's timedtext CDN
 *    sets Access-Control-Allow-Origin for browser requests, so no proxy needed here.
 */
async function fetchViaProxyWatchThenDirectCaption(videoId: string): Promise<string> {
  // Step 1: Get the watch page HTML via Vite proxy
  const pageRes = await fetch(`/yt-proxy/watch?v=${videoId}&hl=en&gl=US`);
  if (!pageRes.ok) throw new Error(`Watch proxy HTTP ${pageRes.status}`);
  const html = await pageRes.text();

  // Step 2: Extract ytInitialPlayerResponse JSON
  // YouTube wraps it in various ways; try a generous regex
  const playerMatch = html.match(
    /(?:var\s+ytInitialPlayerResponse|ytInitialPlayerResponse)\s*=\s*(\{[\s\S]*?\})\s*;/
  );
  if (!playerMatch) throw new Error('ytInitialPlayerResponse not found');

  let playerResponse: any;
  try {
    playerResponse = JSON.parse(playerMatch[1]);
  } catch {
    throw new Error('Failed to parse ytInitialPlayerResponse');
  }

  // Step 3: Find caption tracks
  const tracks: any[] =
    playerResponse?.captions?.playerCaptionsTracklistRenderer?.captionTracks ?? [];
  if (!tracks.length) throw new Error('No caption tracks available for this video');

  // Prefer manual English, then ASR English, then first track
  const track =
    tracks.find((t) => t.languageCode === 'en' && t.kind !== 'asr') ||
    tracks.find((t) => t.languageCode === 'en') ||
    tracks.find((t) => t.languageCode?.startsWith('en')) ||
    tracks[0];

  if (!track?.baseUrl) throw new Error('Caption track has no baseUrl');

  const signedUrl: string = track.baseUrl;
  console.log('[YouTube] Signed caption URL obtained, fetching directly from browser...');

  // Step 4: Fetch the signed caption URL DIRECTLY from the browser.
  // YouTube's timedtext CDN allows CORS from browser origins.
  // Try JSON format first (richer), then XML fallback.
  const jsonUrl = `${signedUrl}&fmt=json3`;
  const jsonRes = await fetch(jsonUrl, { credentials: 'omit' });
  if (jsonRes.ok) {
    const json = await jsonRes.json().catch(() => null);
    if (json) {
      const transcript = parseJson3Captions(json);
      if (transcript.length >= 30) {
        console.log('[YouTube] ✓ Got transcript via json3 format');
        return transcript;
      }
    }
  }

  // XML fallback
  const xmlRes = await fetch(signedUrl, { credentials: 'omit' });
  if (!xmlRes.ok) throw new Error(`Caption fetch HTTP ${xmlRes.status}`);
  const xml = await xmlRes.text();
  const transcript = parseXmlCaptions(xml);
  if (transcript.length < 30) throw new Error('Transcript too short after XML parsing');
  console.log('[YouTube] ✓ Got transcript via XML format');
  return transcript;
}

/**
 * Fallback: Use the timedtext list API (unsigned, works for many videos)
 * via our Vite proxy, then fetch the caption directly from the browser.
 */
async function fetchViaTimedtextList(videoId: string): Promise<string> {
  // Get the list of tracks (no signature needed for the list endpoint)
  const listRes = await fetch(`/yt-proxy/timedtext?type=list&v=${videoId}`);
  const listXml = await listRes.text();
  const langs = [...listXml.matchAll(/lang_code="([^"]+)"/g)].map((m) => m[1]);
  if (!langs.length) throw new Error('Timedtext list returned no languages');

  const lang = langs.find((l) => l === 'en') || langs.find((l) => l.startsWith('en')) || langs[0];

  // Fetch caption directly from YouTube's timedtext API from the browser (CORS allowed)
  const captionUrl = `https://www.youtube.com/api/timedtext?v=${videoId}&lang=${lang}&fmt=json3`;
  const res = await fetch(captionUrl, { credentials: 'omit' });
  if (!res.ok) throw new Error(`Timedtext API HTTP ${res.status}`);
  const json = await res.json();
  const transcript = parseJson3Captions(json);
  if (transcript.length < 30) throw new Error(`Timedtext list transcript too short (lang=${lang})`);
  return transcript;
}

export async function fetchYouTubeTranscript(url: string): Promise<YouTubeResult | YouTubeError> {
  const videoId = extractVideoId(url);
  if (!videoId) {
    return {
      error:
        'Could not extract video ID. Please use a valid YouTube URL (e.g. youtube.com/watch?v=...).',
    };
  }

  const metadata = await fetchMetadata(videoId);
  const errors: string[] = [];

  const strategies: [string, () => Promise<string>][] = [
    ['ProxyWatch+DirectCaption', () => fetchViaProxyWatchThenDirectCaption(videoId)],
    ['TimedtextList+DirectFetch', () => fetchViaTimedtextList(videoId)],
  ];

  for (const [name, fn] of strategies) {
    try {
      const transcript = await fn();
      console.log(`[YouTube] ✓ Success via ${name}`);
      return { transcript, ...metadata, videoId };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`[YouTube] ✗ ${name} failed:`, msg);
      errors.push(`${name}: ${msg}`);
    }
  }

  return {
    error: `Could not retrieve captions. Make sure the video has captions/subtitles enabled. Details: ${errors.join(' | ')}`,
  };
}
