/**
 * SoundManager.js
 *
 * Generates boxing bell and tap sounds entirely in JavaScript.
 * Uses expo-audio (SDK 54) ONLY — no expo-file-system needed.
 * Sounds are passed as base64 data URIs directly to the audio player.
 *
 * This fixes the iOS build error:
 *   "value of type 'any EXFileSystemInterface' has no member 'getPathPermissions'"
 */

import { createAudioPlayer, setAudioModeAsync } from 'expo-audio';

// ─── Pure-JS base64 encoder (Hermes-safe, no btoa) ───────────────────────────

const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

function uint8ToBase64(bytes) {
  let out = '';
  for (let i = 0; i < bytes.length; i += 3) {
    const b0 = bytes[i];
    const b1 = (i + 1) < bytes.length ? bytes[i + 1] : 0;
    const b2 = (i + 2) < bytes.length ? bytes[i + 2] : 0;
    out += B64[b0 >> 2];
    out += B64[((b0 & 0x03) << 4) | (b1 >> 4)];
    out += (i + 1) < bytes.length ? B64[((b1 & 0x0F) << 2) | (b2 >> 6)] : '=';
    out += (i + 2) < bytes.length ? B64[b2 & 0x3F] : '=';
  }
  return out;
}

// ─── WAV synthesiser ──────────────────────────────────────────────────────────

const SAMPLE_RATE = 22050;

function writeStr(view, offset, str) {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i));
  }
}

function makeWavDataUri(hz, secs, decay, harmonics = [], vol = 0.92) {
  const n      = Math.floor(SAMPLE_RATE * secs);
  const dataSz = n * 2;
  const buf    = new ArrayBuffer(44 + dataSz);
  const view   = new DataView(buf);

  writeStr(view,  0, 'RIFF');
  view.setUint32(  4, 36 + dataSz,      true);
  writeStr(view,  8, 'WAVE');
  writeStr(view, 12, 'fmt ');
  view.setUint32( 16, 16,               true);
  view.setUint16( 20,  1,               true);
  view.setUint16( 22,  1,               true);
  view.setUint32( 24, SAMPLE_RATE,      true);
  view.setUint32( 28, SAMPLE_RATE * 2,  true);
  view.setUint16( 32,  2,               true);
  view.setUint16( 34, 16,               true);
  writeStr(view, 36, 'data');
  view.setUint32( 40, dataSz,           true);

  const TWO_PI = 2 * Math.PI;
  for (let i = 0; i < n; i++) {
    const t   = i / SAMPLE_RATE;
    const env = Math.exp(-t * decay) * vol;
    let s = Math.sin(TWO_PI * hz * t) * env;
    for (const [mult, amp] of harmonics) {
      s += Math.sin(TWO_PI * hz * mult * t) * env * amp;
    }
    view.setInt16(
      44 + i * 2,
      Math.round(Math.max(-1, Math.min(1, s)) * 32000),
      true
    );
  }

  const base64 = uint8ToBase64(new Uint8Array(buf));
  return `data:audio/wav;base64,${base64}`;
}

// ─── SoundManager singleton ───────────────────────────────────────────────────

class SoundManagerClass {
  _bell  = null;
  _tap   = null;
  _ready = false;
  _busy  = false;

  async init() {
    if (this._ready || this._busy) return;
    this._busy = true;

    try {
      await setAudioModeAsync({
        playsInSilentMode:          true,
        staysActiveInBackground:    true,
        shouldDuckAndroid:          true,
        playThroughEarpieceAndroid: false,
      });

      const bellUri = makeWavDataUri(880, 1.4, 2.5, [[2.756, 0.50], [5.404, 0.22]]);
      this._bell = createAudioPlayer({ uri: bellUri });

      const tapUri = makeWavDataUri(1100, 0.11, 35);
      this._tap = createAudioPlayer({ uri: tapUri });

      this._ready = true;
      console.log('[SoundManager] ready ✓');
    } catch (e) {
      console.warn('[SoundManager] init failed:', e);
    }

    this._busy = false;
  }

  async playBell() {
    if (!this._bell) { console.warn('[SoundManager] bell not ready'); return; }
    try { this._bell.seekTo(0); this._bell.play(); } catch (e) { console.warn('[SoundManager] playBell error:', e); }
  }

  async playTap() {
    if (!this._tap) { console.warn('[SoundManager] tap not ready'); return; }
    try { this._tap.seekTo(0); this._tap.play(); } catch (e) { console.warn('[SoundManager] playTap error:', e); }
  }

  playDoubleBell() {
    this.playBell();
    setTimeout(() => this.playBell(), 700);
  }

  dispose() {
    try {
      if (this._bell) this._bell.remove();
      if (this._tap)  this._tap.remove();
    } catch {}
    this._bell  = null;
    this._tap   = null;
    this._ready = false;
  }
}

export const SoundManager = new SoundManagerClass();