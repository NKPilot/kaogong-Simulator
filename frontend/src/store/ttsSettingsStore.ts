import { create } from 'zustand';

const CONFIG_URL = '/tts-config.json';
const SAMPLE_GUIDANCE = '欢迎参加本次公务员面试。本次面试共3道题，限时15分钟。';
const SAMPLE_QUESTION = '请观察下面这幅漫画，拟定三个标题，并就其中一个标题联系社会现象进行阐述。';

interface TtsSettings {
  speed: number;
  pitch: number;
  vol: number;
  loading: boolean;
  loaded: boolean;
  /** Currently playing sample type */
  playing: 'guidance' | 'question' | null;
  /** Fetch config from /tts-config.json */
  loadConfig: () => Promise<void>;
  /** Persist a single setting change */
  setSpeed: (v: number) => void;
  setPitch: (v: number) => void;
  setVol: (v: number) => void;
  /** Get sample text for preview */
  getSampleText: (type: 'guidance' | 'question') => string;
  setPlaying: (v: 'guidance' | 'question' | null) => void;
}

export const useTtsSettingsStore = create<TtsSettings>((set, get) => ({
  speed: 1.2,
  pitch: 0,
  vol: 1.0,
  loading: false,
  loaded: false,
  playing: null,

  loadConfig: async () => {
    if (get().loaded || get().loading) return;
    set({ loading: true });
    try {
      const resp = await fetch(CONFIG_URL, { cache: 'no-cache' });
      if (resp.ok) {
        const cfg = await resp.json();
        set({
          speed: typeof cfg.speed === 'number' ? cfg.speed : 1.2,
          pitch: typeof cfg.pitch === 'number' ? cfg.pitch : 0,
          vol: typeof cfg.vol === 'number' ? cfg.vol : 1.0,
          loaded: true,
          loading: false,
        });
      } else {
        set({ loaded: true, loading: false });
      }
    } catch {
      set({ loaded: true, loading: false });
    }
  },

  setSpeed: (v) => set({ speed: v }),
  setPitch: (v) => set({ pitch: v }),
  setVol: (v) => set({ vol: v }),

  getSampleText: (type) => {
    return type === 'guidance' ? SAMPLE_GUIDANCE : SAMPLE_QUESTION;
  },

  setPlaying: (v) => set({ playing: v }),
}));
