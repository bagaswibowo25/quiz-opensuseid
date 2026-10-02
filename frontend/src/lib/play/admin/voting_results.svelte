<!--
SPDX-FileCopyrightText: 2023 Marlon W (Mawoka)

SPDX-License-Identifier: MPL-2.0
-->

<script lang="ts">
	import type { Question } from '$lib/quiz_types';
	import { QuizQuestionType } from '$lib/quiz_types';
	import ShapeIcon from '$lib/play/shape_icon.svelte';
	import { get_foreground_color } from '$lib/helpers';

	interface Props {
		data: any;
		question: Question;
	}

	let { data, question }: Props = $props();

	let quiz_answers = [];
	let quiz_colors = [];
	let answer_correct: boolean[] = [];

	for (const i of question.answers) {
		quiz_answers.push(i.answer);
		quiz_colors.push(i.color);
		answer_correct.push(i.right);
	}

	let sorted_data = $state({});
	for (const i of quiz_answers) {
		sorted_data[i] = 0;
	}
	for (const i of data) {
		sorted_data[i.answer] += 1;
	}
</script>

<div class="flex justify-center w-full">
	<div class="flex items-end gap-6 lg:gap-10">
		{#each quiz_answers as answer, i}
			{@const is_vote = question.type === QuizQuestionType.VOTING}
			<div class="flex w-24 lg:w-28 flex-col items-center gap-2" class:opacity-45={!answer_correct[i] && !is_vote}>
				<span class="text-3xl font-extrabold">{sorted_data[answer] ?? 0}</span>
				<div
					class="w-full rounded-t-2xl shadow-xl transition-all duration-700"
					style="height: {Math.max(0.5, (sorted_data[answer] * 16) / Math.max(1, data.length))}rem; background-color: {quiz_colors[i] ?? '#73BA25'}"
				></div>
				<div
					class="flex w-full items-center justify-center gap-1 rounded-xl py-2"
					style="background-color: {quiz_colors[i] ?? '#73BA25'}; color: {get_foreground_color(
						quiz_colors[i] ?? '#73BA25'
					)}"
				>
					<ShapeIcon index={i} class="w-6 h-6" />
					{#if answer_correct[i] && !is_vote}<span class="text-xl font-bold">✓</span>{/if}
				</div>
				<p class="w-full truncate text-center text-base font-semibold" title={answer}>{@html answer}</p>
			</div>
		{/each}
	</div>
</div>
