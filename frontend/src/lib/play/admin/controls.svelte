<!--
SPDX-FileCopyrightText: 2023 Marlon W (Mawoka)

SPDX-License-Identifier: MPL-2.0
-->

<script lang="ts">
	import { QuizQuestionType } from '$lib/quiz_types';
	import { getLocalization } from '$lib/i18n';
	import { SocketGameControls } from '$lib/play/admin/socket_game_controls.ts';
	import type { GameState } from '$lib/play/admin/game_state.ts';
	import { is_muted, set_muted, unlock_audio, play_tick } from '$lib/play/sounds';

	interface Props {
		bg_color: string;
		socket_game_controls: SocketGameControls;
		game_token: string;
		game_state: GameState;
	}

	let { bg_color, socket_game_controls, game_token, game_state = $bindable() }: Props = $props();

	const { t } = getLocalization();

	let muted = $state(is_muted());
	const toggle_sound = () => {
		muted = !muted;
		set_muted(muted);
		if (!muted) {
			unlock_audio();
			play_tick();
		}
	};

	const show_solutions = () => {
		socket_game_controls.show_solutions();
		game_state.timer_res = '0';
	};
</script>

<div
	class="fixed top-0 w-full h-14 z-20 flex items-center justify-between px-4 bg-[#0f2b36]/70 backdrop-blur-md shadow-lg"
	style={bg_color ? `background: ${bg_color}` : ''}
	class:text-black={bg_color}
>
	<div class="flex items-center gap-3">
		<img src="/geeko.svg" alt="openSUSE" class="h-7 w-auto" />
		<span class="rounded-full bg-white/15 px-3 py-1 font-bold">
			{game_state.selected_question === -1 ? '0' : game_state.selected_question + 1}
			/ {game_state.quiz_data.questions.length}
		</span>
		<button
			type="button"
			onclick={toggle_sound}
			class="rounded-full bg-white/15 px-3 py-1 text-lg transition hover:bg-white/25"
			title={muted ? 'Sound off — click to turn on' : 'Sound on — click to mute'}
			aria-label={muted ? 'Unmute countdown sound' : 'Mute countdown sound'}
			>{muted ? '🔇' : '🔊'}</button
		>
	</div>
	<div class="flex items-center gap-2">
		{#if game_state.selected_question + 1 === game_state.quiz_data.questions.length && ((game_state.timer_res === '0' && game_state.question_results !== null) || game_state.quiz_data?.questions?.[game_state.selected_question]?.type === QuizQuestionType.SLIDE)}
			{#if JSON.stringify(game_state.final_results) === JSON.stringify([null])}
				<button
					onclick={() => socket_game_controls.get_final_results()}
					class="admin-button"
					>{$t('admin_page.get_final_results')}
				</button>
			{/if}
		{:else if game_state.timer_res === '0' || game_state.selected_question === -1}
			{#if (game_state.selected_question + 1 !== game_state.quiz_data.questions.length && game_state.question_results !== null) || game_state.selected_question === -1}
				<button
					onclick={() => {
						socket_game_controls.set_question_number(game_state.selected_question + 1);
					}}
					class="admin-button"
					>{$t('admin_page.next_question', {
						question: game_state.selected_question + 2
					})}
				</button>
			{/if}
			{#if game_state.question_results === null && game_state.selected_question !== -1}
				{#if game_state.quiz_data.questions[game_state.selected_question].type === QuizQuestionType.SLIDE}
					<button
						onclick={() => {
							socket_game_controls.set_question_number(
								game_state.selected_question + 1
							);
						}}
						class="admin-button"
						>{$t('admin_page.next_question', {
							question: game_state.selected_question + 2
						})}
					</button>
				{:else if game_state.quiz_data.questions[game_state.selected_question]?.hide_results === true}
					<button
						onclick={() => {
							socket_game_controls.get_question_results(
								game_token,
								game_state.shown_question_now
							);
							setTimeout(() => {
								socket_game_controls.set_question_number(
									game_state.selected_question + 1
								);
							}, 200);
						}}
						class="admin-button"
						>{$t('admin_page.next_question', {
							question: game_state.selected_question + 2
						})}
					</button>
				{:else}
					<button
						onclick={() =>
							socket_game_controls.get_question_results(
								game_token,
								game_state.shown_question_now
							)}
						class="admin-button"
						>{$t('admin_page.show_results')}
					</button>
				{/if}
			{/if}
		{:else if game_state.selected_question !== -1}
			{#if game_state.quiz_data.questions[game_state.selected_question].type === QuizQuestionType.SLIDE}
				<button
					onclick={() => {
						socket_game_controls.set_question_number(game_state.selected_question + 1);
					}}
					class="admin-button"
					>{$t('admin_page.next_question', {
						question: game_state.selected_question + 2
					})}
				</button>
			{:else}
				<button onclick={show_solutions} class="admin-button"
					>{$t('admin_page.stop_time_and_solutions')}
				</button>
			{/if}
		{/if}
	</div>
</div>
