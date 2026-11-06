import { settings } from './settings';

let actx: AudioContext | null = null;

/** Short sounds: 'ok' (correct), 'bad' (wrong), 'tick', 'win' (round finished). */
export function beep(kind: 'ok' | 'bad' | 'tick' | 'win'): void {
    if (!settings().sound) {
        return;
    }

    try {
        actx = actx ?? new AudioContext();
        const t = actx.currentTime;
        const o = actx.createOscillator();
        const g = actx.createGain();
        const freq = { ok: 880, bad: 200, tick: 520, win: 1046 }[kind];
        const len = kind === 'win' ? 0.45 : kind === 'tick' ? 0.06 : 0.16;
        const vol = kind === 'bad' ? 0.07 : kind === 'tick' ? 0.05 : 0.12;
        o.type = kind === 'bad' ? 'square' : 'sine';
        o.frequency.setValueAtTime(freq, t);

        if (kind === 'win') {
            o.frequency.exponentialRampToValueAtTime(freq * 1.5, t + 0.3);
        }

        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(vol, t + 0.01);
        g.gain.exponentialRampToValueAtTime(0.0001, t + len);
        o.connect(g);
        g.connect(actx.destination);
        o.start(t);
        o.stop(t + len + 0.05);
    } catch {
        // audio not available
    }
}
