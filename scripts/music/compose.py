"""Original gamelan-inspired quiz loop for openSUSE.Asia Summit 2026 (Yogyakarta).

Everything is synthesized here from sine waves and noise: no samples, no third-party material.
Output: a seamless loop (8 gongan x 16 beats) as 16-bit WAV.
  python compose.py quiz-loop.wav          # "quiz": 112 BPM, kendang + shaker, for questions
  python compose.py calm-loop.wav calm     # "calm": 90 BPM, no drums, for slides
"""
import sys
import wave

import numpy as np

SR = 44100
CALM = len(sys.argv) > 2 and sys.argv[2] == 'calm'
BPM = 90 if CALM else 112
BEAT = 60 / BPM
BEATS_PER_GONGAN = 16
rng = np.random.default_rng(2026)

# Slendro approximated as 5-tone equal temperament; degrees 1 2 3 5 6.
F1 = 277.0
DEG = {1: 0, 2: 1, 3: 2, 5: 3, 6: 4}


def freq(note: int, octave: int = 0) -> float:
    return F1 * 2 ** ((DEG[note] + 5 * octave) / 5)


# Balungan (core melody), one note per beat. Tuples (note, octave) for high notes.
A = [2, 1, 2, 6, 2, 1, 2, 6, 3, 5, 3, 2, 6, 5, 3, 2]
B = [5, 6, 5, 3, 5, 6, 5, 3, 6, (1, 1), 6, 5, 3, 2, 1, 2]
C = [3, 5, 6, (1, 1), 6, 5, 3, 2, 5, 3, 2, 1, 3, 2, 1, 2]
FORM = [A, A, B, B, C, C, B, A]

beats = [n for g in FORM for n in g]
N_BEATS = len(beats)
LOOP_LEN = int(round(N_BEATS * BEAT * SR))
TAIL = int(6 * SR)
out = np.zeros(LOOP_LEN + TAIL)


def note_of(b):
    return (b, 0) if isinstance(b, int) else b


def add(signal: np.ndarray, t: float, gain: float) -> None:
    start = int(round(t * SR))
    end = min(start + len(signal), len(out))
    out[start:end] += gain * signal[: end - start]


def metal(f: float, dur: float, tau: float, partials, beat_hz: float = 4.0) -> np.ndarray:
    """Metallophone: inharmonic partials, exponential decay, ombak (paired detuned voice)."""
    t = np.arange(int(dur * SR)) / SR
    sig = np.zeros_like(t)
    for ratio, amp, decay_mul in partials:
        env = np.exp(-t / (tau * decay_mul))
        sig += amp * env * (np.sin(2 * np.pi * f * ratio * t) + np.sin(2 * np.pi * (f * ratio + beat_hz) * t))
    attack = np.minimum(1, t / 0.004)
    return sig * attack * 0.5


def gong(f: float) -> np.ndarray:
    t = np.arange(int(5.5 * SR)) / SR
    env = np.exp(-t / 3.2) * np.minimum(1, t / 0.03)
    wobble = 1 + 0.35 * np.sin(2 * np.pi * 1.3 * t)  # slow ombak
    sig = (
        np.sin(2 * np.pi * f * t)
        + 0.45 * np.sin(2 * np.pi * f * 2.01 * t) * np.exp(-t / 1.5)
        + 0.2 * np.sin(2 * np.pi * f * 2.98 * t) * np.exp(-t / 0.9)
    )
    return sig * env * wobble


def kendang_low() -> np.ndarray:
    t = np.arange(int(0.25 * SR)) / SR
    f = 70 + 80 * np.exp(-t / 0.03)
    phase = 2 * np.pi * np.cumsum(f) / SR
    return np.sin(phase) * np.exp(-t / 0.09)


def band_noise(dur: float, lo: float, hi: float, tau: float) -> np.ndarray:
    n = int(dur * SR)
    spec = np.fft.rfft(rng.standard_normal(n))
    fr = np.fft.rfftfreq(n, 1 / SR)
    spec[(fr < lo) | (fr > hi)] = 0
    sig = np.fft.irfft(spec, n)
    sig /= np.max(np.abs(sig)) + 1e-9
    t = np.arange(n) / SR
    return sig * np.exp(-t / tau)


SARON = [(1, 1.0, 1.0), (2.76, 0.32, 0.45), (5.4, 0.1, 0.25)]
PEKING = [(1, 1.0, 1.0), (2.76, 0.25, 0.4)]
KENONG = [(1, 1.0, 1.0), (2.0, 0.25, 0.6), (3.01, 0.08, 0.3)]

tak = band_noise(0.08, 1800, 4200, 0.018)
shaker = band_noise(0.05, 5000, 11000, 0.012)
dhung = kendang_low()
gong_sig = gong(65.4)

for i, b in enumerate(beats):
    t0 = i * BEAT
    n, o = note_of(b)
    pos = i % BEATS_PER_GONGAN  # 0..15 within gongan

    # Saron: balungan on the beat
    add(metal(freq(n, o), 1.6, 0.75, SARON), t0, 0.22)

    # Peking: anticipates the next balungan note, doubled on 8ths, one octave up
    nxt = note_of(beats[(i + 1) % N_BEATS])
    if CALM:
        # Sparser peking: two strokes per beat, softer
        for k, (pn, po) in enumerate([(n, o), nxt]):
            add(metal(freq(pn, po + 1), 1.0, 0.35, PEKING, beat_hz=6.0), t0 + k * BEAT / 2, 0.08 if k else 0.1)
    else:
        for k, (pn, po) in enumerate([(n, o), nxt, (n, o), nxt]):
            add(metal(freq(pn, po + 1), 0.7, 0.22, PEKING, beat_hz=6.0), t0 + k * BEAT / 4, 0.12 if k % 2 else 0.16)

    # Kenong on every 4th beat (pitch of that balungan note, one octave down)
    if pos % 4 == 3:
        add(metal(freq(n, o - 1), 2.5, 1.3, KENONG, beat_hz=2.0), t0, 0.2)
    # Kempul between kenong strokes
    if pos in (5, 9, 13):
        add(metal(freq(n, o - 2), 2.5, 1.0, KENONG, beat_hz=1.5), t0, 0.09)
    # Gong ageng closes the gongan
    if pos == BEATS_PER_GONGAN - 1:
        add(gong_sig, t0, 0.17)

    if CALM:
        continue  # no drums in the calm version

    # Kendang: low strokes on beats 1 and 3 of each group of 4, slaps on the off-beats
    if pos % 4 in (0, 2):
        add(dhung, t0, 0.13)
    add(tak, t0 + BEAT / 2, 0.22 if pos % 4 != 3 else 0.3)
    if pos % 8 == 7:
        add(tak, t0 + 3 * BEAT / 4, 0.18)

    # Very light shaker on 16ths keeps the "clock is running" feel
    for k in range(4):
        add(shaker, t0 + k * BEAT / 4, 0.09 if k % 2 else 0.13)

# Fold the tail (gong decay etc.) back onto the start so the loop is seamless.
loop = out[:LOOP_LEN].copy()
loop[:TAIL] += out[LOOP_LEN:]

# High-pass at ~55 Hz (circular FFT is fine: the signal is a loop). Small speakers can't
# reproduce sub-bass anyway; it only muddies the mix and eats headroom.
spec = np.fft.rfft(loop)
fr = np.fft.rfftfreq(len(loop), 1 / SR)
spec *= 1 / np.sqrt(1 + (55 / np.maximum(fr, 1e-3)) ** 8)
loop = np.fft.irfft(spec, len(loop))

loop = np.tanh(loop * 1.2) / np.tanh(1.2)  # gentle saturation
loop *= 0.85 / np.max(np.abs(loop))

stereo = np.stack([loop, loop], axis=1)
# small Haas-style width on the peking/shaker band is overkill; keep it mono-compatible.
pcm = (stereo * 32767).astype(np.int16)
with wave.open(sys.argv[1], "wb") as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes(pcm.tobytes())

print(f"beats={N_BEATS} duration={LOOP_LEN / SR:.2f}s peak=0.85 rms={np.sqrt(np.mean(loop**2)):.3f}")
