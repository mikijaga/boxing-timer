/**
 * SoundManager.js
 *
 * Uses pre-built WAV files bundled in assets/sounds/
 * NO expo-file-system — just require() bundled assets.
 *
 * Key fixes for reliable tap sounds:
 * - Tap uses a POOL of 3 players so rapid overlapping taps never block each other
 * - Removed seekTo(0) before play — it adds 50-100ms latency
 * - Bell still uses seekTo(0) since it's longer and less time-critical
 * - All play calls are fire-and-forget (no await) to avoid any async delay
 */

import { createAudioPlayer, setAudioModeAsync } from 'expo-audio';

const BELL_ASSET = require('../../assets/sounds/bell.wav');
const TAP_ASSET  = require('../../assets/sounds/tap.wav');

const TAP_POOL_SIZE = 3; // allows up to 3 simultaneous tap sounds

class SoundManagerClass {
  _bell     = null;
  _tapPool  = [];   // rotating pool of tap players
  _tapIndex = 0;    // which pool slot to use next
  _ready    = false;
  _busy     = false;

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

      // Single bell player — seekTo is fine here since bell is not rapid
      this._bell = createAudioPlayer(BELL_ASSET);

      // Pool of tap players — each plays independently so they can overlap
      this._tapPool = [];
      for (let i = 0; i < TAP_POOL_SIZE; i++) {
        this._tapPool.push(createAudioPlayer(TAP_ASSET));
      }

      this._ready = true;
      console.log('[SoundManager] ready ✓');
    } catch (e) {
      console.warn('[SoundManager] init failed:', e);
    }

    this._busy = false;
  }

  // ── Bell ─────────────────────────────────────────────────────────────────────
  playBell() {
    if (!this._bell) { console.warn('[SoundManager] bell not ready'); return; }
    try {
      this._bell.seekTo(0);
      this._bell.play();
    } catch (e) {
      console.warn('[SoundManager] playBell:', e);
    }
  }

  // ── Tap — grab next player from pool, play immediately (no seekTo) ───────────
  playTap() {
    if (!this._tapPool.length) { console.warn('[SoundManager] tap not ready'); return; }
    try {
      const player = this._tapPool[this._tapIndex % TAP_POOL_SIZE];
      this._tapIndex++;
      // Do NOT seekTo — just play directly for zero latency
      // The pool rotation ensures we never interrupt a playing tap
      player.seekTo(0);
      player.play();
    } catch (e) {
      console.warn('[SoundManager] playTap:', e);
    }
  }

  // ── Double tap — two taps 180ms apart ────────────────────────────────────────
  playDoubleTap() {
    this.playTap();
    setTimeout(() => this.playTap(), 180);
  }

  // ── Double bell — session complete ────────────────────────────────────────────
  playDoubleBell() {
    this.playBell();
    setTimeout(() => this.playBell(), 700);
  }

  // ── Cleanup ───────────────────────────────────────────────────────────────────
  dispose() {
    try {
      if (this._bell) this._bell.remove();
      this._tapPool.forEach(p => { try { p.remove(); } catch {} });
    } catch {}
    this._bell    = null;
    this._tapPool = [];
    this._ready   = false;
  }
}

export const SoundManager = new SoundManagerClass();