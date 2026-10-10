# browser-whisper — Vite Demo

A minimal demo app showing how to integrate [`browser-whisper`](https://www.npmjs.com/package/browser-whisper) into a **Vite + React + TypeScript** project.

Everything runs **entirely in the browser** — no server, no API key, no data ever leaves your device.

---

## What this demo shows

- How to install and configure `browser-whisper` in a Vite project
- The required cross-origin isolation headers (`COEP` / `COOP`) that `SharedArrayBuffer` needs
- How to transcribe an audio or video file using the async-iterable API
- How to wire up real-time progress events
- A clean separation between logic (`useWhisper` hook) and UI (`WhisperTest` component)

---

## Quick start

```bash
git clone <this-repo>
cd browser-whisper-vite
npm install
npm run dev
```

Open the local URL, pick any audio or video file, and watch the transcript appear in real time.

> **First run:** the model (`whisper-tiny`, ~30 MB) is downloaded from Hugging Face Hub and cached in your browser. Subsequent runs use the cache and start immediately.

---

## How to use `browser-whisper` in your own project

### 1. Install

```bash
npm install browser-whisper
```

### 2. Add cross-origin isolation headers

`browser-whisper` uses Web Workers with `SharedArrayBuffer`, which requires the page to be [cross-origin isolated](https://developer.mozilla.org/en-US/docs/Web/API/crossOriginIsolated). See `vite.config.ts` for the exact `COEP` / `COOP` header configuration.

Verify it worked by opening the browser console and running:

```js
console.log(crossOriginIsolated) // must be true
```

### 3. Separate logic from UI

See the project structure below — the hook owns all library calls, the component just renders what the hook returns.

### 4. Lazy-load to keep your initial bundle small

`browser-whisper` bundles the ONNX runtime (~2 MB). See `App.tsx` for how `React.lazy` is used to split it into its own chunk, dropping the initial bundle to ~192 kB (gzip: ~61 kB).

---

## Available models

| Model | Size on disk | Speed | Accuracy |
|---|---|---|---|
| `whisper-tiny` | ~30 MB | Fastest | Good for clear speech |
| `whisper-base` | ~70 MB | Fast | Better accuracy |
| `whisper-small` | ~240 MB | Moderate | High accuracy |
| `whisper-large-v3-turbo` | ~2.7 GB | Slow | Best accuracy |

Pass the model name to the constructor:

```ts
const whisper = new BrowserWhisper({ model: 'whisper-base' })
```

---

## Browser requirements

| Feature | Minimum version |
|---|---|
| Chrome / Edge | 113+ (WebGPU) |
| Firefox | 141+ (WebGPU) |
| Safari | Not yet supported |

The library automatically falls back to a WASM backend if WebGPU is unavailable. Transcription will still work, just slower.

---

## Project structure

```
src/
├── hooks/
│   └── useWhisper.ts      # All browser-whisper logic lives here
├── utils/
│   └── formatTime.ts      # Pure helper — seconds → M:SS
├── WhisperTest.tsx         # Demo UI component, no library imports
└── App.tsx                # Lazy-loads WhisperTest
```

---

## Troubleshooting

**`crossOriginIsolated` is `false`**
The COEP/COOP headers are missing. Check your `vite.config.ts` and restart the dev server.

**`no available backend found`**
Both WebGPU and WASM failed to initialise. Confirm `crossOriginIsolated === true` first, then check the Network tab for failed requests to `cdn.jsdelivr.net`.

**Loading stuck at 0%**
The model download from `huggingface.co` is being blocked. Check your firewall or VPN.

**`Failed to fetch dynamically imported module: blob:...`**
Your Content Security Policy is blocking blob-URL workers. Add `blob:` to `worker-src` in your CSP.
