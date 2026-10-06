import { defineConfig, loadEnv } from 'vite';
import { readFileSync } from 'node:fs';

export default defineConfig(({ mode }) => {
  const env = { ...loadEnv(mode, process.cwd(), ''), ...process.env };
  const url = (env.NUTRIPEER_SUPABASE_URL || '').trim().replace(/\/$/, '');
  const key = (env.NUTRIPEER_SUPABASE_ANON_KEY || '').trim();

  if (Boolean(url) !== Boolean(key)) {
    throw new Error('NUTRIPEER_SUPABASE_URL ve NUTRIPEER_SUPABASE_ANON_KEY birlikte ayarlanmalı.');
  }
  if (mode === 'production' && !url) {
    throw new Error('Dağıtım paketi için ortak NutriPeer Supabase URL ve publishable/anon anahtarı gereklidir.');
  }
  const tauriConfig = JSON.parse(readFileSync(new URL('./src-tauri/tauri.conf.json', import.meta.url), 'utf8'));
  const updater = tauriConfig.plugins?.updater;
  const releaseEndpoint = updater?.endpoints?.[0] || '';
  const updaterReady = Boolean(
    updater?.pubkey &&
    !/REPLACE/i.test(updater.pubkey) &&
    releaseEndpoint.startsWith('https://') &&
    !/REPLACE/i.test(releaseEndpoint) &&
    tauriConfig.bundle?.createUpdaterArtifacts === true,
  );

  if (mode === 'production') {
    if (!updaterReady) {
      throw new Error('Dağıtım için Tauri updater açık anahtarını ve gerçek HTTPS yayın adresini src-tauri/tauri.conf.json içinde ayarlayın.');
    }
    if (tauriConfig.bundle?.createUpdaterArtifacts !== true || !process.env.TAURI_SIGNING_PRIVATE_KEY) {
      throw new Error('İmzalı updater paketi için bundle.createUpdaterArtifacts=true ve TAURI_SIGNING_PRIVATE_KEY gereklidir.');
    }
  }
  let keyClaims = '';
  try {
    const payload = key.split('.')[1];
    if (payload) keyClaims = Buffer.from(payload.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8');
  } catch { /* A publishable key is not a JWT. */ }
  if (/(service_role|sb_secret)/i.test(`${key} ${keyClaims}`)) {
    throw new Error('Supabase service_role/secret anahtarı istemci uygulamasına konamaz. Publishable/anon anahtar kullanın.');
  }
  if (url) {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:' && !['localhost', '127.0.0.1'].includes(parsed.hostname)) {
      throw new Error('Supabase yayın adresi HTTPS kullanmalı.');
    }
  }

  const managedConfig = JSON.stringify({ url, key, managed: Boolean(url && key) })
    .replace(/</g, '\\u003c');

  return {
    root: 'desktop-web',
    base: './',
    clearScreen: false,
    plugins: [{
      name: 'nutripeer-managed-community-config',
      transformIndexHtml(html) {
        return html.replace('</head>', `<script>window.NUTRIPEER_COMMUNITY_CONFIG=Object.freeze(${managedConfig});window.NUTRIPEER_UPDATER_ENABLED=${updaterReady};</script></head>`);
      },
    }],
    server: {
      host: '127.0.0.1',
      port: 1420,
      strictPort: true,
    },
    build: {
      outDir: '../dist',
      emptyOutDir: true,
    },
  };
});
