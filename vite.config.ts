import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5000,
    host: '0.0.0.0',
    allowedHosts: true,
    proxy: {
      '/yt-proxy/watch': {
        target: 'https://www.youtube.com',
        changeOrigin: true,
        rewrite: (path) => path.replace('/yt-proxy/watch', '/watch'),
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq) => {
            proxyReq.setHeader(
              'User-Agent',
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            );
            proxyReq.setHeader('Cookie', 'CONSENT=YES+cb; SOCS=CAI');
            proxyReq.setHeader('Accept-Language', 'en-US,en;q=0.9');
            proxyReq.setHeader('Accept', 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8');
          });
        },
      },
      '/yt-proxy/timedtext': {
        target: 'https://www.youtube.com',
        changeOrigin: true,
        rewrite: (path) => path.replace('/yt-proxy/timedtext', '/api/timedtext'),
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq) => {
            proxyReq.setHeader(
              'User-Agent',
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            );
            proxyReq.setHeader('Cookie', 'CONSENT=YES+cb; SOCS=CAI');
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
