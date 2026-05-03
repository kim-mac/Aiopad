import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { execFile } from 'child_process';
import { existsSync, readFileSync, unlinkSync } from 'fs';
import { tmpdir } from 'os';
import path from 'path';
import { IncomingMessage, ServerResponse } from 'http';

function parseVtt(vtt: string): string {
  const seen = new Set<string>();
  const result: string[] = [];

  const blocks = vtt.split(/\n\n+/);
  for (const block of blocks) {
    const lines = block.split('\n');
    for (const raw of lines) {
      // Skip timestamp lines, header lines, blank lines, and alignment metadata
      if (!raw.trim()) continue;
      if (/-->/.test(raw)) continue;
      if (/^WEBVTT|^Kind:|^Language:/.test(raw)) continue;
      // Skip lines with inline word-timing tags (rolling partial lines)
      // Only keep the "accumulated" lines (no <c> tags)
      if (/<\d\d:\d\d:\d\d/.test(raw)) continue;
      // Strip any remaining HTML tags
      const clean = raw
        .replace(/<[^>]+>/g, '')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .trim();
      if (!clean || clean === '\u00a0') continue;
      // Deduplicate rolling-window lines
      if (!seen.has(clean)) {
        seen.add(clean);
        result.push(clean);
      }
    }
  }

  return result.join(' ').replace(/\s+/g, ' ').trim();
}

function ytTranscriptPlugin(): Plugin {
  return {
    name: 'yt-transcript-api',
    configureServer(server) {
      server.middlewares.use('/api/yt-transcript', (req: IncomingMessage, res: ServerResponse) => {
        const url = new URL(req.url ?? '/', 'http://localhost');
        const videoId = url.searchParams.get('v');

        if (!videoId || !/^[\w-]{11}$/.test(videoId)) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Invalid or missing video ID.' }));
          return;
        }

        const outBase = path.join(tmpdir(), `yt_${videoId}`);
        const vttPath = `${outBase}.en.vtt`;

        // Clean up any stale file from a previous run
        if (existsSync(vttPath)) {
          try { unlinkSync(vttPath); } catch {}
        }

        const args = [
          '--write-auto-subs',
          '--write-subs',
          '--sub-langs', 'en,en-US,en-GB',
          '--sub-format', 'vtt',
          '--skip-download',
          '--no-warnings',
          '--no-playlist',
          '-o', outBase,
          '--',
          videoId,
        ];

        execFile('yt-dlp', args, { timeout: 30000 }, (err, _stdout, stderr) => {
          // Check for VTT file regardless of exit code (yt-dlp may exit non-zero but still write the file)
          if (!existsSync(vttPath)) {
            // Try to find any language VTT (e.g. .en-US.vtt)
            const altPaths = [
              `${outBase}.en-US.vtt`,
              `${outBase}.en-GB.vtt`,
            ];
            const found = altPaths.find(p => existsSync(p));
            if (!found) {
              const errMsg = stderr?.slice(0, 300) || (err?.message ?? 'yt-dlp failed');
              res.writeHead(422, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({
                error: `This video has no available captions. yt-dlp output: ${errMsg}`,
              }));
              return;
            }
            // Use found alt path
            const vttContent = readFileSync(found, 'utf8');
            try { unlinkSync(found); } catch {}
            const transcript = parseVtt(vttContent);
            if (transcript.length < 30) {
              res.writeHead(422, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'Transcript too short — the video may have no spoken content.' }));
              return;
            }
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ transcript }));
            return;
          }

          const vttContent = readFileSync(vttPath, 'utf8');
          try { unlinkSync(vttPath); } catch {}

          const transcript = parseVtt(vttContent);
          if (transcript.length < 30) {
            res.writeHead(422, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Transcript too short — the video may have no spoken content.' }));
            return;
          }

          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ transcript }));
        });
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), ytTranscriptPlugin()],
  server: {
    port: 5000,
    host: '0.0.0.0',
    allowedHosts: true,
    proxy: {
      '/api/nvidia': {
        target: 'https://integrate.api.nvidia.com',
        changeOrigin: true,
        rewrite: (p) => p.replace('/api/nvidia', '/v1'),
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq) => {
            const key = process.env.VITE_NVIDIA_API_KEY || '';
            proxyReq.setHeader('Authorization', `Bearer ${key}`);
          });
        },
      },
    },
  },
  resolve: {
    dedupe: ['react', 'react-dom'],
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'zustand'],
  },
});
