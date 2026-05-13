/**
 * SoundManager.js
 *
 * Generates boxing bell and tap sounds entirely in JavaScript.
 * Uses expo-audio (SDK 54) + expo-file-system.
 * No external audio files required.
 *
 * Fixes applied vs previous version:
 *  - expo-av → expo-audio  (expo-av removed in SDK 54)
 *  - FileSystem.EncodingType.Base64 → 'base64'  (EncodingType undefined in SDK 54)
 *  - Pure-JS base64 encoder (btoa unreliable on Hermes)
 */

import { createAudioPlayer, setAudioModeAsync } from 'expo-audio';
import * as FileSystem from 'expo-file-system/legacy';

// ─── Pure-JS base64 encoder (no btoa — Hermes-safe) ──────────────────────────

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
    out += (i + 2) < bytes.length ? B64[b2 & 0x3F]                       : '=';
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

/**
 * Build a mono 16-bit PCM WAV as a Uint8Array.
 *
 * @param {number}  hz         Base frequency (Hz)
 * @param {number}  secs       Duration in seconds
 * @param {number}  decay      Envelope decay — higher = shorter ring
 * @param {Array}   harmonics  [[freqMultiplier, amplitude], ...]
 * @param {number}  vol        Peak volume 0–1
 */
function makeWav(hz, secs, decay, harmonics = [], vol = 0.92) {
  const n      = Math.floor(SAMPLE_RATE * secs);
  const dataSz = n * 2;                       // 16-bit = 2 bytes per sample
  const buf    = new ArrayBuffer(44 + dataSz);
  const view   = new DataView(buf);

  // RIFF / WAV header
  writeStr(view,  0, 'RIFF');
  view.setUint32(  4, 36 + dataSz,      true);
  writeStr(view,  8, 'WAVE');
  writeStr(view, 12, 'fmt ');
  view.setUint32( 16, 16,               true); // fmt chunk size
  view.setUint16( 20,  1,               true); // PCM
  view.setUint16( 22,  1,               true); // mono
  view.setUint32( 24, SAMPLE_RATE,      true);
  view.setUint32( 28, SAMPLE_RATE * 2,  true); // byte rate
  view.setUint16( 32,  2,               true); // block align
  view.setUint16( 34, 16,               true); // 16-bit
  writeStr(view, 36, 'data');
  view.setUint32( 40, dataSz,           true);

  // Synthesise samples
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

  return new Uint8Array(buf);
}

// ─── Write WAV bytes → device cache → file:// URI ────────────────────────────

async function writeWavFile(name, bytes) {
  const uri = FileSystem.cacheDirectory + name;
  await FileSystem.writeAsStringAsync(uri, uint8ToBase64(bytes), {
    encoding: 'base64',   // ← string literal, NOT FileSystem.EncodingType.Base64
  });
  return uri;
}

// ─── SoundManager singleton ───────────────────────────────────────────────────

class SoundManagerClass {
  _bell  = null;  // expo-audio AudioPlayer
  _tap   = null;  // expo-audio AudioPlayer
  _ready = false;
  _busy  = false;

  async init() {
    if (this._ready || this._busy) return;
    this._busy = true;

    try {
      // Configure audio session
      await setAudioModeAsync({
        playsInSilentMode:       true,   // play even when iPhone silent switch is ON
        staysActiveInBackground: true,
        shouldDuckAndroid:       true,
        playThroughEarpieceAndroid: false,
      });

      // ── Boxing bell: 880 Hz + 2 overtones → warm metallic ring, 1.4 s ──────
      const bellBytes = makeWav(
        880, 1.4, 2.5,
        [
          [2.756, 0.50],  // adds the characteristic "clang"
          [5.404, 0.22],  // high shimmer
        ]
      );
      const bellUri  = await writeWavFile('boxing_bell.wav', bellBytes);
      this._bell     = createAudioPlayer({ uri: bellUri });

      // ── Warning tap: 1100 Hz, 0.11 s, fast decay → sharp beep ──────────────
      const tapBytes = makeWav(1100, 0.11, 35);
      const tapUri   = await writeWavFile('boxing_tap.wav', tapBytes);
      this._tap      = createAudioPlayer({ uri: tapUri });

      this._ready = true;
      console.log('[SoundManager] ready ✓');
    } catch (e) {
      console.warn('[SoundManager] init failed:', e);
    }

    this._busy = false;
  }

  // ── Play helpers ─────────────────────────────────────────────────────────────

  async playBell() {
    if (!this._bell) {
      console.warn('[SoundManager] bell not ready — call init() first');
      return;
    }
    try {
      this._bell.seekTo(0);
      this._bell.play();
    } catch (e) {
      console.warn('[SoundManager] playBell error:', e);
    }
  }

  async playTap() {
    if (!this._tap) {
      console.warn('[SoundManager] tap not ready — call init() first');
      return;
    }
    try {
      this._tap.seekTo(0);
      this._tap.play();
    } catch (e) {
      console.warn('[SoundManager] playTap error:', e);
    }
  }

  /** Two bells with a short gap — used for session complete */
  playDoubleBell() {
    this.playBell();
    setTimeout(() => this.playBell(), 700);
  }

  // ── Cleanup ──────────────────────────────────────────────────────────────────

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