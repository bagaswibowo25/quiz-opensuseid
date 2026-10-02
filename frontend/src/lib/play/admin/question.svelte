<!--
SPDX-FileCopyrightText: 2023 Marlon W (Mawoka)

SPDX-License-Identifier: MPL-2.0
-->

<script lang="ts">
	import { QuizQuestionType } from '$lib/quiz_types';
	import type { QuizData } from '$lib/quiz_types';
	import { get_foreground_color } from '$lib/helpers.js';
	import { kahoot_icons } from '$lib/play/kahoot_mode_assets/kahoot_icons.js';
	import CircularTimer from '$lib/play/circular_progress.svelte';
	import MediaComponent from '$lib/editor/MediaComponent.svelte';
	import { getLocalization } from '$lib/i18n';
	import ShapeIcon from '$lib/play/shape_icon.svelte';

	interface Props {
		quiz_data: QuizData;
		selected_question: number;
		timer_res: string;
		answer_count: number;
		default_colors: string[];
	}

	let {
		quiz_data,
		selected_question,
		timer_res = $bindable(),
		answer_count,
		default_colors
	}: Props = $props();

	const { t } = getLocalization();

	let circular_progress = $derived.by(() => {
		try {
			return (
				1 -
				((100 / parseInt(quiz_data.questions[selected_question].time)) *
					parseInt(timer_res)) /
					100
			);
		} catch {
			return 0;
		}
	});
</script>

<div class="flex flex-col items-center gap-4 px-6 w-full">
	<h1
		class="pop-in w-full max-w-6xl rounded-3xl bg-white px-8 py-6 text-center text-4xl lg:text-6xl font-extrabold leading-tight text-[#173F4F] shadow-2xl"
	>
		{@html quiz_data.questions[selected_question].question}
	</h1>
	<div class="grid w-full max-w-6xl grid-cols-3 items-center">
		<span></span>
		<div class="m-auto rounded-full border-4 border-white shadow-2xl">
			<CircularTimer text={timer_res} progress={circular_progress} color="#ef4444" />
		</div>
		<div class="m-auto flex flex-col items-center rounded-2xl bg-[#0f2b36]/80 px-6 py-3">
			<span class="text-5xl font-extrabold text-[#73BA25]">{answer_count}</span>
			<span class="text-lg text-white/80">answers</span>
		</div>
	</div>
</div>
{#if quiz_data.questions[selected_question].image !== null}
	<div class="flex w-full mt-2">
		<MediaComponent
			src={quiz_data.questions[selected_question].image}
			muted={false}
			css_classes="max-h-[25vh] object-contain mx-auto mb-4 w-auto rounded-2xl shadow-xl"
		/>
	</div>
{/if}
{#if quiz_data.questions[selected_question].type === QuizQuestionType.ABCD || quiz_data.questions[selected_question].type === QuizQuestionType.VOTING || quiz_data.questions[selected_question].type === QuizQuestionType.CHECK}
	<div class="mx-auto grid w-full max-w-7xl grid-cols-2 auto-rows-fr gap-4 p-6 pb-28">
		{#each quiz_data.questions[selected_question].answers as answer, i}
			{@const reveal = timer_res === '0' && quiz_data.questions[selected_question].type !== QuizQuestionType.VOTING}
			<div
				class="answer-tile min-h-24 px-6 py-5 transition-all duration-500"
				class:opacity-35={reveal && !answer.right}
				class:ring-8={reveal && answer.right}
				class:ring-white={reveal && answer.right}
				style="background-color: {answer.color ?? default_colors[i]}; color: {get_foreground_color(
					answer.color ?? default_colors[i]
				)}"
			>
				<ShapeIcon index={i} class="w-10 h-10 lg:w-12 lg:h-12 opacity-90" />
				<span class="flex-1 text-center text-3xl lg:text-4xl font-bold leading-snug break-words"
					>{answer.answer}</span
				>
				{#if reveal && answer.right}
					<span class="pop-in flex h-12 w-12 items-center justify-center rounded-full bg-white text-3xl text-[#3f8f1a] shadow-lg">✓</span>
				{:else}
					<span class="w-12"></span>
				{/if}
			</div>
		{/each}
	</div>
{:else if quiz_data.questions[selected_question].type === QuizQuestionType.TEXT}
	{#if timer_res === '0'}
		<div class="grid grid-cols-2 gap-4 w-full p-6">
			{#each quiz_data.questions[selected_question].answers as answer}
				<div class="answer-tile bg-[#73BA25] px-6 py-5">
					<span class="text-center text-3xl font-bold w-full text-[#173F4F]">{answer.answer}</span>
				</div>
			{/each}
		</div>
	{:else}
		<div class="flex justify-center mt-6">
			<p class="stage-card px-8 py-4 text-3xl">{$t('admin_page.enter_answer_into_field')}</p>
		</div>
	{/if}
{/if}
