<!--
SPDX-FileCopyrightText: 2023 Marlon W (Mawoka)

SPDX-License-Identifier: MPL-2.0
-->

<script lang="ts">
	import VotingResults from './voting_results.svelte';
	import { flip } from 'svelte/animate';
	import { fly } from 'svelte/transition';
	import { onMount } from 'svelte';
	import { getLocalization } from '$lib/i18n';
	import type { Question } from '$lib/quiz_types';
	import { QuizQuestionType } from '$lib/quiz_types';

	const { t } = getLocalization();

	interface Props {
		data: any;
		question: Question;
		new_data: Array<{
			username: string;
			answer: string;
			right: boolean;
			time_taken: number;
			score: number;
		}>;
	}

	let { data = $bindable(), question, new_data }: Props = $props();

	// let data_by_username = {};

	const group_username_by_score = (new_d: any[]): object => {
		let ret_data = {};
		for (const i of new_data) {
			ret_data[i.username] = i.score;
		}
		return ret_data;
	};
	let score_by_username = $derived(group_username_by_score(new_data));

	let player_names = $derived(Object.keys(data).sort((a, b) => {
		const scoreA = parseFloat(data[a]) || 0;
		const scoreB = parseFloat(data[b]) || 0;
		return scoreB - scoreA;
	}));

	if (JSON.stringify(data) === '{}') {
		for (const i of new_data) {
			data[i.username] = 0;
		}
	}

	let show_new_score_clicked = $state(false);

	const show_new_score = () => {
		for (const i of player_names) {
			if (isNaN(data[i])) {
				data[i] = 0;
			}
			console.log(score_by_username[i], '1');
			data[i] = (score_by_username[i] ?? 0) + data[i];
		}
		for (const i of new_data) {
			if (!data[i.username]) {
				data[i.username] = score_by_username[i.username];
			}
		}
		show_new_score_clicked = true;
		setTimeout(() => {
			data = data;
		}, 800);
	};

	onMount(() => {
		setTimeout(show_new_score, 1000);
	});

	// https://svelte.dev/repl/96a58afdea2248a5b7e489160ffba887?version=3.44.2
</script>

<div
	class="mx-auto flex h-full w-full max-w-7xl flex-col-reverse items-center justify-center gap-10 px-6 pb-28 lg:flex-row lg:items-start"
>
	{#if [QuizQuestionType.ABCD, QuizQuestionType.VOTING, QuizQuestionType.TEXT].includes(question.type)}
		<div class="stage-card px-8 py-6">
			<VotingResults data={new_data} {question} />
		</div>
	{/if}
	<div class="flex w-full max-w-3xl flex-col gap-3">
	<h2 class="mb-3 text-center text-4xl lg:text-5xl font-extrabold">🏆 Leaderboard</h2>
		{#each player_names.slice(0, 5) as player, i (player)}
			<div
				animate:flip={{ duration: 600 }}
				class="flex items-center gap-4 rounded-2xl px-6 py-4 text-2xl lg:text-3xl shadow-xl {i === 0
					? 'bg-[#73BA25] text-[#173F4F]'
					: 'bg-[#0f2b36]/85 text-white'}"
			>
				<span
					class="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-xl font-extrabold {i ===
					0
						? 'bg-white text-[#173F4F]'
						: 'bg-white/15'}">{i + 1}</span
				>
				<span class="flex-1 truncate font-bold">{player}</span>
				{#if show_new_score_clicked}
					<span
						in:fly|global={{ x: 120 }}
						class="text-xl font-semibold {score_by_username[player] === 0 ||
						score_by_username[player] === undefined
							? i === 0
								? 'text-[#173F4F]/60'
								: 'text-white/50'
							: i === 0
								? 'text-[#173F4F]'
								: 'text-[#73BA25]'}"
					>
						+{score_by_username[player] ?? '0'}
					</span>
				{/if}
				<span class="w-28 text-right font-extrabold tabular-nums">{data[player]}</span>
			</div>
		{/each}
	</div>
</div>
