// SPDX-License-Identifier: MPL-2.0
// Host screen audio: countdown sounds synthesized with Web Audio, plus a background music loop.

import quiz_music_url from '$lib/assets/music/opensuse-quiz-loop.mp3';
import calm_music_url from '$lib/assets/music/opensuse-calm-loop.mp3';

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

// ---- Background music ----
// Original gamelan-inspired loops composed for this event (see scripts/music/compose.py):
// "quiz" (112 BPM, with drums) while players answer, "calm" (90 BPM, no drums) during slides.

export type MusicTrack = 'quiz' | 'calm';

const MUSIC_MUTE_KEY = 'cq_host_music_muted';
const TRACKS: Record<MusicTrack, { url: string; volume: number }> = {
	quiz: { url: quiz_music_url, volume: 0.35 },
	calm: { url: calm_music_url, volume: 0.3 }
};

const music_buffers: Partial<Record<MusicTrack, AudioBuffer>> = {};
const music_loading: Partial<Record<MusicTrack, Promise<AudioBuffer | null>>> = {};
const music_offsets: Record<MusicTrack, number> = { quiz: 0, calm: 0 };
let music_source: AudioBufferSourceNode | null = null;
let music_gain: GainNode | null = null;
let music_playing: MusicTrack | null = null;
let music_started_at = 0;
let music_wanted: MusicTrack | null = null;

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
	if (muted) {
		const wanted = music_wanted;
		stop_music();
		music_wanted = wanted; // remember what should play if music is turned back on
	}
};

/** The track the current screen wants (even while muted), so the toggle can resume it. */
export const wanted_music = (): MusicTrack | null => music_wanted;

const load_music = (ac: AudioContext, track: MusicTrack): Promise<AudioBuffer | null> => {
	const cached = music_buffers[track];
	if (cached) return Promise.resolve(cached);
	if (!music_loading[track]) {
		music_loading[track] = fetch(TRACKS[track].url)
			.then((r) => r.arrayBuffer())
			.then((data) => ac.decodeAudioData(data))
			.then((buf) => (music_buffers[track] = buf))
			.catch(() => {
				delete music_loading[track];
				return null;
			});
	}
	return music_loading[track];
};

/** Fade a loop in; each track resumes where it last stopped. */
export const start_music = async (track: MusicTrack = 'quiz'): Promise<void> => {
	music_wanted = track;
	if (music_playing === track) return;
	if (music_playing) stop_music(0.4, false);
	if (is_music_muted()) return;
	const ac = get_ctx();
	if (!ac) return;
	const buf = await load_music(ac, track);
	// The screen may have changed (or music muted) while the file was loading.
	if (!buf || music_wanted !== track || music_playing || is_music_muted()) return;

	const src = ac.createBufferSource();
	src.buffer = buf;
	src.loop = true;
	const gain = ac.createGain();
	const now = ac.currentTime;
	gain.gain.setValueAtTime(0.0001, now);
	gain.gain.exponentialRampToValueAtTime(TRACKS[track].volume, now + 0.8);
	src.connect(gain).connect(ac.destination);
	const offset = music_offsets[track] % buf.duration;
	src.start(now, offset);
	music_started_at = now - offset;
	music_source = src;
	music_gain = gain;
	music_playing = track;
};

/** Fade the current loop out and remember its position. */
export const stop_music = (fade = 0.6, clear_wanted = true): void => {
	if (clear_wanted) music_wanted = null;
	if (!music_source || !music_gain || !music_playing || !ctx) return;
	const now = ctx.currentTime;
	const buf = music_buffers[music_playing];
	if (buf) music_offsets[music_playing] = (now - music_started_at) % buf.duration;
	music_gain.gain.cancelScheduledValues(now);
	music_gain.gain.setValueAtTime(Math.max(music_gain.gain.value, 0.0001), now);
	music_gain.gain.exponentialRampToValueAtTime(0.0001, now + fade);
	music_source.stop(now + fade + 0.05);
	music_source = null;
	music_gain = null;
	music_playing = null;
};

/** Stop only if this track is the one playing/wanted, so a screen being torn down
 *  can't silence the music the next screen just started. */
export const stop_track = (track: MusicTrack): void => {
	if (music_playing === track || music_wanted === track) stop_music();
};
