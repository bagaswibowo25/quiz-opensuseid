<!--
SPDX-FileCopyrightText: 2023 Marlon W (Mawoka)

SPDX-License-Identifier: MPL-2.0
-->

<script lang="ts">
	import { onMount } from 'svelte';
	import { getLocalization } from '$lib/i18n';

	const { t } = getLocalization();

	import { fly, scale } from 'svelte/transition';
	import confetti from 'canvas-confetti';
	interface Props {
		data: any;
		username?: any;
		show_final_results: boolean;
	}

	let { data = $bindable(), username, show_final_results }: Props = $props();

	let player_names = $derived(
		Object.keys(data).sort((a, b) => {
			const scoreA = parseFloat(data[a]) || 0;
			const scoreB = parseFloat(data[b]) || 0;
			return scoreB - scoreA;
		})
	);

	// Podium order on screen: 2nd, 1st, 3rd. Reveal 3rd -> 2nd -> 1st.
	const podium = [
		{ place: 1, height: 'h-28 sm:h-40', color: 'bg-[#35B9AB]', medal: '🥈', delay: 1400 },
		{ place: 0, height: 'h-40 sm:h-56', color: 'bg-[#73BA25]', medal: '🥇', delay: 2600 },
		{ place: 2, height: 'h-20 sm:h-28', color: 'bg-[#21A4D4]', medal: '🥉', delay: 400 }
	];
	const reveal_done_ms = 2900;

	let my_place = $derived(player_names.indexOf(username) + 1);

	const opensuse_colors = ['#73BA25', '#35B9AB', '#21A4D4', '#ffffff', '#c5e8a8'];

	onMount(() => {
		const timeout = setTimeout(() => {
			confetti({ particleCount: 160, spread: 100, origin: { y: 0.6 }, colors: opensuse_colors });
			setTimeout(
				() =>
					confetti({
						particleCount: 90,
						angle: 60,
						spread: 70,
						origin: { x: 0 },
						colors: opensuse_colors
					}),
				250
			);
			setTimeout(
				() =>
					confetti({
						particleCount: 90,
						angle: 120,
						spread: 70,
						origin: { x: 1 },
						colors: opensuse_colors
					}),
				400
			);
		}, reveal_done_ms);
		return () => clearTimeout(timeout);
	});
</script>

{#if show_final_results}
	<div class="flex min-h-[80dvh] flex-col items-center px-4 pt-8 pb-40 text-white">
		<div class="flex items-center gap-3">
			<img src="/geeko.svg" alt="" class="h-10 sm:h-14 w-auto" />
			<h1 class="text-4xl sm:text-6xl font-extrabold tracking-tight">Final Results</h1>
		</div>

		<div class="mt-10 sm:mt-16 flex w-full max-w-3xl items-end justify-center gap-2 sm:gap-4">
			{#each podium as spot}
				{#if player_names[spot.place] !== undefined}
					<div
						class="flex w-1/3 flex-col items-center"
						in:fly|global={{ y: 200, duration: 700, delay: spot.delay }}
					>
						<span class="text-4xl sm:text-6xl">{spot.medal}</span>
						<p
							class="mt-1 w-full truncate text-center text-lg sm:text-3xl font-bold {player_names[
								spot.place
							] === username
								? 'text-[#c5e8a8]'
								: ''}"
						>
							{player_names[spot.place]}
						</p>
						<p class="text-sm sm:text-xl text-white/80">
							{data[player_names[spot.place]] ?? 0} pts
						</p>
						<div
							class="mt-2 flex w-full items-start justify-center rounded-t-2xl pt-3 shadow-2xl {spot.height} {spot.color}"
						>
							<span class="text-4xl sm:text-6xl font-extrabold text-[#173F4F]/80"
								>{spot.place + 1}</span
							>
						</div>
					</div>
				{:else}
					<div class="w-1/3"></div>
				{/if}
			{/each}
		</div>

		{#if player_names.length > 3}
			<div class="mt-6 flex w-full max-w-xl flex-col gap-2">
				{#each player_names.slice(3, 5) as player, i (player)}
					<div
						class="flex items-center gap-4 rounded-2xl bg-[#0f2b36]/80 px-5 py-3 text-lg sm:text-2xl"
						in:fly|global={{ x: -200, duration: 500, delay: reveal_done_ms + 300 + i * 200 }}
					>
						<span class="font-bold text-[#73BA25]">#{i + 4}</span>
						<span class="flex-1 truncate">{player}</span>
						<span class="text-white/80">{data[player] ?? 0} pts</span>
					</div>
				{/each}
			</div>
		{/if}
	</div>

	{#if username && my_place > 0}
		<div class="fixed bottom-14 left-0 z-10 flex w-full justify-center px-4">
			<div
				class="stage-card px-6 py-3 text-center"
				in:scale|global={{ duration: 400, delay: reveal_done_ms + 600 }}
			>
				<p class="text-lg">{$t('play_page.your_score', { score: data[username] ?? 0 })}</p>
				<p class="text-2xl font-bold text-[#73BA25]">
					{$t('play_page.your_place', { place: my_place })}
				</p>
			</div>
		</div>
	{/if}
{/if}
