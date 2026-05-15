/**
 * SoundManager.js
 *
 * Uses pre-built WAV files bundled in assets/sounds/
 * NO expo-file-system — no data URIs — just require() bundled assets.
 * Works on iOS and Android native builds.
 */

import { createAudioPlayer, setAudioModeAsync } from 'expo-audio';

const BELL_ASSET = require('../../assets/sounds/bell.wav');
const TAP_ASSET  = require('../../assets/sounds/tap.wav');

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

      this._bell = createAudioPlayer(BELL_ASSET);
      this._tap  = createAudioPlayer(TAP_ASSET);

      this._ready = true;
      console.log('[SoundManager] ready ✓');
    } catch (e) {
      console.warn('[SoundManager] init failed:', e);
    }

    this._busy = false;
  }

  async playBell() {
    if (!this._bell) { console.warn('[SoundManager] bell not ready'); return; }
    try { this._bell.seekTo(0); this._bell.play(); } catch (e) { console.warn('[SoundManager] playBell:', e); }
  }

  async playTap() {
    if (!this._tap) { console.warn('[SoundManager] tap not ready'); return; }
    try { this._tap.seekTo(0); this._tap.play(); } catch (e) { console.warn('[SoundManager] playTap:', e); }
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