<!--
SPDX-FileCopyrightText: 2023 Marlon W (Mawoka)

SPDX-License-Identifier: MPL-2.0
-->

<script lang="ts">
	import ShapeIcon from '$lib/play/shape_icon.svelte';
	import type { Question } from '$lib/quiz_types';
	import { get_foreground_color } from '$lib/helpers';
	import { kahoot_icons } from '$lib/play/kahoot_mode_assets/kahoot_icons';
	import CircularTimer from '$lib/play/circular_progress.svelte';
	// import CircularTimer from '$lib/play/circular_progress.svelte';
	const default_colors = ['#73BA25', '#35B9AB', '#21A4D4', '#173F4F'];

	interface Props {
		question: Question;
		selected_answer?: string;
		game_mode: any;
		timer_res: any;
		circular_progress: any;
	}

	let {
		question,
		selected_answer = $bindable(),
		game_mode,
		timer_res,
		circular_progress
	}: Props = $props();
	let _selected_answers = $state([false, false, false, false]);

	const selectAnswer = (i: number) => {
		_selected_answers[i] = !_selected_answers[i];
		selected_answer = '';
		for (let i = 0; i < _selected_answers.length; i++) {
			if (_selected_answers[i]) {
				selected_answer += String(i);
			}
		}
		selected_answer = selected_answer;
		console.log(_selected_answers, selected_answer);
	};
</script>

<div class="w-full h-[95%]">
	<!--
        <div
            class="absolute top-0 bottom-0 left-0 right-0 m-auto rounded-full h-fit w-fit border-2 border-black shadow-2xl z-50"
        >
            <CircularTimer
                bind:text={timer_res}
                bind:progress={circular_prgoress}
                color="#ef4444"
            />
        </div>
    -->
	<div
		class="pointer-events-none absolute top-0 bottom-0 left-0 right-0 m-auto rounded-full h-fit w-fit border-4 border-white shadow-2xl z-40"
	>
		<CircularTimer text={timer_res} progress={circular_progress} color="#ef4444" />
	</div>

	<div class="grid grid-cols-2 auto-rows-fr gap-2 sm:gap-3 w-full p-2 sm:p-4 h-full">
		{#each question.answers as answer, i}
			<button
				class="answer-tile h-full min-h-0 p-3 sm:p-4"
				style="background-color: {answer.color ??
					default_colors[i]}; color: {get_foreground_color(
					answer.color ?? default_colors[i]
				)}"
				onclick={() => selectAnswer(i)}
				class:opacity-100={_selected_answers[i]}
				class:opacity-50={!_selected_answers[i]}
			>
				{#if game_mode === 'kahoot'}
					<ShapeIcon index={i} class="m-auto w-1/2 h-1/2 max-w-24 max-h-24" />
				{:else}
					<ShapeIcon index={i} class="w-6 h-6 sm:w-9 sm:h-9 opacity-90" />
					<p class="flex-1 text-center text-base sm:text-xl lg:text-3xl font-bold leading-snug break-words [overflow-wrap:anywhere]">{answer.answer}</p>
				{/if}
			</button>
		{/each}
	</div>
</div>
