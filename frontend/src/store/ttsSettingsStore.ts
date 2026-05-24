import { create } from 'zustand';
import type { VoiceOption } from '../api/ttsApi';
import { fetchVoices } from '../api/ttsApi';

const SAMPLE_GUIDANCE = '欢迎参加本次公务员面试。本次面试共3道题，限时15分钟。';
const SAMPLE_QUESTION = '请观察下面这幅漫画，拟定三个标题，并就其中一个标题联系社会现象进行阐述。';

function loadFromStorage() {
  try {
    const raw = localStorage.getItem('tts-config');
    if (raw) return JSON.parse(raw);
  } catch { /* noop */ }
  return {};
}

function saveToStorage(speed: number, pitch: number, vol: number, voice: string) {
  try {
    localStorage.setItem('tts-config', JSON.stringify({ speed, pitch, vol, voice }));
  } catch { /* noop */ }
}

interface TtsSettings {
  speed: number;
  pitch: number;
  vol: number;
  voice: string;
  voices: VoiceOption[];
  voicesLoading: boolean;
  playing: 'guidance' | 'question' | null;
  loadVoices: () => Promise<void>;
  setSpeed: (v: number) => void;
  setPitch: (v: number) => void;
  setVol: (v: number) => void;
  setVoice: (v: string) => void;
  getSampleText: (type: 'guidance' | 'question') => string;
  setPlaying: (v: 'guidance' | 'question' | null) => void;
}

const saved = loadFromStorage();

export const useTtsSettingsStore = create<TtsSettings>((set, get) => ({
  speed: saved.speed ?? 1.0,
  pitch: saved.pitch ?? 0,
  vol: saved.vol ?? 50,
  voice: saved.voice ?? 'longxiaocheng_v2',
  voices: [],
  voicesLoading: false,
  playing: null,

  loadVoices: async () => {
    if (get().voices.length > 0 || get().voicesLoading) return;
    set({ voicesLoading: true });
    try {
      const voices = await fetchVoices();
      set({ voices, voicesLoading: false });
    } catch {
      set({ voicesLoading: false });
    }
  },

  setSpeed: (v) => { set({ speed: v }); saveToStorage(v, get().pitch, get().vol, get().voice); },
  setPitch: (v) => { set({ pitch: v }); saveToStorage(get().speed, v, get().vol, get().voice); },
  setVol: (v) => { set({ vol: v }); saveToStorage(get().speed, get().pitch, v, get().voice); },
  setVoice: (v) => { set({ voice: v }); saveToStorage(get().speed, get().pitch, get().vol, v); },

  getSampleText: (type) => {
    return type === 'guidance' ? SAMPLE_GUIDANCE : SAMPLE_QUESTION;
  },

  setPlaying: (v) => set({ playing: v }),
}));
