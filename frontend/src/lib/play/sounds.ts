// SPDX-License-Identifier: MPL-2.0
// Countdown sounds for the host screen, synthesized with Web Audio (no audio files needed).

const MUTE_KEY = 'cq_host_sound_muted';

let ctx: AudioContext | null = null;

const get_ctx = (): AudioContext | null => {
	if (typeof window === 'undefined') return null;
	try {
		if (!ctx) {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const Ctor = window.AudioContext || (window as any).webkitAudioContext;
			if (!Ctor) return null;
			ctx = new Ctor();
		}
		if (ctx.state === 'suspended') ctx.resume();
		return ctx;
	} catch {
		return null;
	}
};

export const is_muted = (): boolean => {
	try {
		return localStorage.getItem(MUTE_KEY) === '1';
	} catch {
		return false;
	}
};

export const set_muted = (muted: boolean): void => {
	try {
		localStorage.setItem(MUTE_KEY, muted ? '1' : '0');
	} catch {
		/* storage unavailable: setting just won't persist */
	}
};

/** Call from a click handler so browsers allow audio later on. */
export const unlock_audio = (): void => {
	get_ctx();
};

const tone = (
	freq: number,
	duration: number,
	type: OscillatorType,
	volume: number,
	delay = 0
): void => {
	const ac = get_ctx();
	if (!ac) return;
	const start = ac.currentTime + delay;
	const osc = ac.createOscillator();
	const gain = ac.createGain();
	osc.type = type;
	osc.frequency.setValueAtTime(freq, start);
	gain.gain.setValueAtTime(0.0001, start);
	gain.gain.exponentialRampToValueAtTime(volume, start + 0.01);
	gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
	osc.connect(gain).connect(ac.destination);
	osc.start(start);
	osc.stop(start + duration + 0.05);
};

/** Soft clock tick, once per second. */
export const play_tick = (): void => {
	if (is_muted()) return;
	tone(1400, 0.04, 'square', 0.04);
};

/** Urgent beep for the last seconds. */
export const play_urgent = (): void => {
	if (is_muted()) return;
	tone(880, 0.14, 'square', 0.12);
	tone(1320, 0.1, 'sine', 0.08, 0.02);
};

/** Descending chime when time is up. */
export const play_times_up = (): void => {
	if (is_muted()) return;
	tone(784, 0.25, 'triangle', 0.3);
	tone(587, 0.3, 'triangle', 0.3, 0.2);
	tone(392, 0.7, 'triangle', 0.32, 0.42);
};
