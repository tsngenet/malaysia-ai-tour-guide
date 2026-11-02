/**
 * Speech Engine Interface (V1: Web Speech API TTS)
 * Replaceable architecture: clean abstraction ready for cloud TTS audio endpoints in V2.
 * Provides Listen, Pause, Resume, Replay with locale voice selection and event handling.
 */

import { SUPPORTED_LANGUAGES } from './i18n.js';

class SpeechEngine {
  constructor() {
    this.synth = typeof window !== 'undefined' ? window.speechSynthesis : null;
    this.currentUtterance = null;
    this.isPlaying = false;
    this.isPaused = false;
    this.lastText = '';
    this.lastLang = 'en';
    this.onStateChange = null;
  }

  isSupported() {
    return Boolean(this.synth && 'SpeechSynthesisUtterance' in window);
  }

  _notify(state) {
    if (this.onStateChange) {
      this.onStateChange(state);
    }
  }

  getBestVoiceForLang(langCode) {
    if (!this.synth) return null;
    const voices = this.synth.getVoices();
    const langConfig = SUPPORTED_LANGUAGES.find(l => l.code === langCode);
    const targetTag = langConfig ? langConfig.ttsLang.toLowerCase() : 'en-us';

    // 1. Exact match (e.g. 'zh-CN')
    let match = voices.find(v => v.lang.toLowerCase() === targetTag);
    // 2. Prefix match (e.g. 'zh')
    if (!match) {
      const prefix = targetTag.split('-')[0];
      match = voices.find(v => v.lang.toLowerCase().startsWith(prefix));
    }
    // 3. Fallback to default
    return match || null;
  }

  speak(text, langCode = 'en') {
    if (!this.isSupported() || !text) return;

    this.stop();
    this.lastText = text;
    this.lastLang = langCode;

    const utterance = new SpeechSynthesisUtterance(text);
    const voice = this.getBestVoiceForLang(langCode);
    if (voice) {
      utterance.voice = voice;
    }
    const langConfig = SUPPORTED_LANGUAGES.find(l => l.code === langCode);
    utterance.lang = langConfig ? langConfig.ttsLang : 'en-US';
    utterance.rate = 0.95; // Slightly slower, clear guide cadence for in-vehicle listening
    utterance.pitch = 1.0;

    utterance.onstart = () => {
      this.isPlaying = true;
      this.isPaused = false;
      this._notify({ isPlaying: true, isPaused: false });
    };

    utterance.onpause = () => {
      this.isPaused = true;
      this._notify({ isPlaying: true, isPaused: true });
    };

    utterance.onresume = () => {
      this.isPaused = false;
      this._notify({ isPlaying: true, isPaused: false });
    };

    utterance.onend = () => {
      this.isPlaying = false;
      this.isPaused = false;
      this._notify({ isPlaying: false, isPaused: false });
    };

    utterance.onerror = (e) => {
      console.warn('SpeechSynthesis error:', e);
      this.isPlaying = false;
      this.isPaused = false;
      this._notify({ isPlaying: false, isPaused: false, error: e });
    };

    this.currentUtterance = utterance;
    this.synth.speak(utterance);
  }

  pause() {
    if (this.synth && this.isPlaying && !this.isPaused) {
      this.synth.pause();
      this.isPaused = true;
      this._notify({ isPlaying: true, isPaused: true });
    }
  }

  resume() {
    if (this.synth && this.isPaused) {
      this.synth.resume();
      this.isPaused = false;
      this._notify({ isPlaying: true, isPaused: false });
    }
  }

  replay() {
    if (this.lastText) {
      this.speak(this.lastText, this.lastLang);
    }
  }

  stop() {
    if (this.synth) {
      this.synth.cancel();
      this.isPlaying = false;
      this.isPaused = false;
      this._notify({ isPlaying: false, isPaused: false });
    }
  }
}

export const speechEngine = new SpeechEngine();
