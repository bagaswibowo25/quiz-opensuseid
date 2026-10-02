<!--
SPDX-FileCopyrightText: 2023 Marlon W (Mawoka)

SPDX-License-Identifier: MPL-2.0
-->

<script lang="ts">
	interface Props {
		progress: number;
		text: string;
		color: string;
	}

	let { progress, text, color }: Props = $props();
	let angle = $derived(360 * progress);

	// Adapt the logic according to the approach
	let background = $derived(`radial-gradient(white 50%, transparent 51%),
	    conic-gradient(transparent 0deg ${angle}deg, gainsboro ${angle}deg 360deg),
	    conic-gradient(${color} 0deg, ${color} 90deg, ${color} 180deg, ${color});`);

	let cssVarStyles = $derived(`--background:${background}`);
</script>

<div id="progress-circle" style={cssVarStyles} class="transition-all text-2xl sm:text-4xl font-bold text-black">
	{text}
</div>

<style>
	#progress-circle {
		background: var(--background);
		border-radius: 50%;
		width: clamp(64px, 18vw, 120px);
		height: clamp(64px, 18vw, 120px);
		transition: all 500ms ease-in;
		will-change: transform;
		display: flex;
		justify-content: center;
		align-items: center;
	}
</style>
