<!--
SPDX-FileCopyrightText: 2023 Marlon W (Mawoka)

SPDX-License-Identifier: MPL-2.0
-->

<script lang="ts">
	function sortObjectbyValue(obj) {
		const ret = {};
		Object.keys(obj)
			.sort((a, b) => obj[b] - obj[a])
			.forEach((s) => (ret[s] = obj[s]));
		return ret;
	}

	interface Props {
		scores: any;
		question_results: Array<{
			username: string;
			answer: string;
			right: boolean;
			time_taken: number;
			score: number;
		}>;
		username: any;
	}

	let { scores = $bindable(), question_results, username }: Props = $props();
	let score_by_username = $state({});

	if (JSON.stringify(scores) === '{}') {
		for (const i of question_results) {
			scores[i.username] = 0;
		}
	}
	for (const i of question_results) {
		score_by_username[i.username] = i.score;
	}
	for (const username of Object.keys(score_by_username)) {
		scores[username] = (score_by_username[username] ?? 0) + (scores[username] ?? 0);
	}
	scores = scores;
	let sorted_scores = $derived(sortObjectbyValue(scores));

	const my_result = question_results.find((r) => r.username === username);
	const status: 'right' | 'wrong' | 'none' = my_result
		? my_result.right
			? 'right'
			: 'wrong'
		: 'none';
	let rank = $derived(Object.keys(sorted_scores).indexOf(username) + 1);
	let player_count = $derived(Object.keys(sorted_scores).length);

	const right_lines = ['Correct!', 'Nailed it!', 'Geeko approves!', 'Awesome!'];
	const wrong_lines = ['Not quite!', 'So close!', 'Next one is yours!'];
	const pick = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];
	const headline =
		status === 'right' ? pick(right_lines) : status === 'wrong' ? pick(wrong_lines) : "Time's up!";
</script>

<div
	class="flex min-h-dvh flex-col items-center justify-center gap-6 px-6 pb-24 text-center text-white {status ===
	'right'
		? 'bg-[#3f8f1a]'
		: status === 'wrong'
			? 'bg-[#c0392b]'
			: 'bg-[#173F4F]/80'}"
>
	<div
		class="pop-in flex h-28 w-28 sm:h-36 sm:w-36 items-center justify-center rounded-full bg-white shadow-2xl"
		class:shake={status === 'wrong'}
	>
		{#if status === 'right'}
			<svg viewBox="0 0 24 24" class="h-16 w-16 sm:h-20 sm:w-20 text-[#3f8f1a]" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 13l4 4L19 7" /></svg>
		{:else if status === 'wrong'}
			<svg viewBox="0 0 24 24" class="h-16 w-16 sm:h-20 sm:w-20 text-[#c0392b]" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
		{:else}
			<span class="text-6xl" aria-hidden="true">⌛</span>
		{/if}
	</div>

	<h1 class="text-4xl sm:text-6xl font-extrabold drop-shadow-lg">{headline}</h1>

	<p class="pop-in rounded-full bg-black/25 px-8 py-3 text-3xl sm:text-4xl font-bold [animation-delay:200ms]">
		+{score_by_username[username] ?? 0}
	</p>

	<div class="flex flex-col items-center gap-1 rounded-2xl bg-black/20 px-8 py-4">
		<p class="text-lg text-white/80">Total score</p>
		<p class="text-3xl font-bold">{sorted_scores[username] ?? 0}</p>
		{#if rank > 0}
			<p class="mt-1 text-lg">
				You're <span class="font-extrabold">#{rank}</span>
				<span class="text-white/70">of {player_count}</span>
				{#if rank <= 3}🔥{/if}
			</p>
		{/if}
	</div>
</div>
