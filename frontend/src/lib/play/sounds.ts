// SPDX-License-Identifier: MPL-2.0
// Host screen audio: countdown sounds synthesized with Web Audio, plus a background music loop.

import music_url from '$lib/assets/music/opensuse-quiz-loop.mp3';

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

// ---- Background music while players answer ----
// Original gamelan-inspired loop composed for this event (see scripts/music/compose.py).

const MUSIC_MUTE_KEY = 'cq_host_music_muted';
const MUSIC_VOLUME = 0.35;

let music_buffer: AudioBuffer | null = null;
let music_loading: Promise<AudioBuffer | null> | null = null;
let music_source: AudioBufferSourceNode | null = null;
let music_gain: GainNode | null = null;
let music_started_at = 0;
let music_offset = 0;
let music_wanted = false;

export const is_music_muted = (): boolean => {
	try {
		return localStorage.getItem(MUSIC_MUTE_KEY) === '1';
	} catch {
		return false;
	}
};

export const set_music_muted = (muted: boolean): void => {
	try {
		localStorage.setItem(MUSIC_MUTE_KEY, muted ? '1' : '0');
	} catch {
		/* storage unavailable: setting just won't persist */
	}
	if (muted) stop_music();
};

const load_music = (ac: AudioContext): Promise<AudioBuffer | null> => {
	if (music_buffer) return Promise.resolve(music_buffer);
	if (!music_loading) {
		music_loading = fetch(music_url)
			.then((r) => r.arrayBuffer())
			.then((data) => ac.decodeAudioData(data))
			.then((buf) => (music_buffer = buf))
			.catch(() => {
				music_loading = null;
				return null;
			});
	}
	return music_loading;
};

/** Fade the loop in; it resumes where the previous question left off. */
export const start_music = async (): Promise<void> => {
	music_wanted = true;
	if (is_music_muted() || music_source) return;
	const ac = get_ctx();
	if (!ac) return;
	const buf = await load_music(ac);
	// Question may have ended (or music muted) while the file was loading.
	if (!buf || !music_wanted || music_source || is_music_muted()) return;

	const src = ac.createBufferSource();
	src.buffer = buf;
	src.loop = true;
	const gain = ac.createGain();
	const now = ac.currentTime;
	gain.gain.setValueAtTime(0.0001, now);
	gain.gain.exponentialRampToValueAtTime(MUSIC_VOLUME, now + 0.8);
	src.connect(gain).connect(ac.destination);
	const offset = music_offset % buf.duration;
	src.start(now, offset);
	music_started_at = now - offset;
	music_source = src;
	music_gain = gain;
};

/** Fade the loop out and remember the position for the next question. */
export const stop_music = (fade = 0.6): void => {
	music_wanted = false;
	if (!music_source || !music_gain || !ctx) return;
	const now = ctx.currentTime;
	if (music_buffer) music_offset = (now - music_started_at) % music_buffer.duration;
	music_gain.gain.cancelScheduledValues(now);
	music_gain.gain.setValueAtTime(Math.max(music_gain.gain.value, 0.0001), now);
	music_gain.gain.exponentialRampToValueAtTime(0.0001, now + fade);
	music_source.stop(now + fade + 0.05);
	music_source = null;
	music_gain = null;
};
