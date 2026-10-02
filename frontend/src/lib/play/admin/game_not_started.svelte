<!--
SPDX-FileCopyrightText: 2023 Marlon W (Mawoka)

SPDX-License-Identifier: MPL-2.0
-->

<script lang="ts">
	// import AudioPlayer from '$lib/play/audio_player.svelte';
	import ControllerCodeDisplay from '$lib/components/controller/code.svelte';
	import { getLocalization } from '$lib/i18n';
	import GrayButton from '$lib/components/buttons/gray.svelte';
	import { fade, scale } from 'svelte/transition';
	import { SocketGameControls } from '$lib/play/admin/socket_game_controls.ts';
	import type { GameState } from '$lib/play/admin/game_state';

	interface Props {
		game_pin: string;
		game_state: GameState;
		socket_game_controls: SocketGameControls;
		cqc_code: string;
	}

	let {
		game_pin,
		game_state = $bindable(),
		socket_game_controls,
		cqc_code = $bindable()
	}: Props = $props();

	let fullscreen_open = $state(false);
	const { t } = getLocalization();
	let play_music = $state(false);

	if (cqc_code === 'null') {
		cqc_code = null;
	}
</script>

<div class="flex w-full flex-col items-center px-6 pt-8 pb-32 lg:px-12">
	<!-- <AudioPlayer bind:play={play_music} /> -->
	{#if game_state.quiz_data?.title}
		<div class="mb-6 flex items-center gap-3">
			<img src="/geeko.svg" alt="openSUSE" class="h-10 w-auto" />
			<h1 class="text-2xl lg:text-4xl font-bold text-center">{@html game_state.quiz_data.title}</h1>
		</div>
	{/if}

	<div class="grid w-full max-w-6xl grid-cols-1 items-stretch gap-6 md:grid-cols-[1fr_auto]">
		<div class="stage-card pop-in flex flex-col justify-center gap-4 px-8 py-8 text-center">
			<p class="text-xl lg:text-2xl text-white/80">Join at</p>
			<p class="text-3xl lg:text-5xl font-extrabold text-[#c5e8a8] break-all">
				{window.location.host === 'classquiz.de' ? 'cquiz.de' : `${window.location.host}/play`}
			</p>
			<p class="mt-2 text-xl lg:text-2xl text-white/80">{$t('words.pin')}</p>
			<p
				class="select-all rounded-2xl bg-white py-3 text-6xl lg:text-8xl font-extrabold tracking-[0.15em] text-[#173F4F] shadow-xl"
			>
				{game_pin}
			</p>
		</div>
		<button
			type="button"
			onclick={() => (fullscreen_open = true)}
			class="pop-in mx-auto flex items-center justify-center rounded-3xl bg-white p-4 shadow-2xl transition hover:scale-105"
			aria-label="Show QR code fullscreen"
		>
			<img
				alt="QR code to join the game"
				src="/api/v1/utils/qr/{game_pin}"
				class="block h-56 w-56 lg:h-80 lg:w-80"
			/>
		</button>
	</div>

	{#if cqc_code}
		<div class="mt-6 flex flex-col items-center">
			<p>{$t('play_page.join_by_entering_code')}</p>
			<ControllerCodeDisplay code={cqc_code} />
		</div>
	{/if}

	<div class="mt-8 flex w-full max-w-6xl flex-wrap items-center justify-between gap-4">
		<div class="flex items-center gap-3">
			<span
				class="flex h-16 min-w-16 items-center justify-center rounded-2xl bg-[#73BA25] px-4 text-4xl font-extrabold text-[#173F4F] shadow-lg"
			>
				{game_state.players.length ?? 0}
			</span>
			<span class="text-2xl font-semibold">
				{game_state.players.length === 1 ? 'player joined' : 'players joined'}
			</span>
		</div>
		<button
			class="admin-button !px-10 !py-4 text-2xl"
			disabled={game_state.players.length < 1}
			onclick={() => {
				socket_game_controls.start_game();
			}}
			>{$t('admin_page.start_game')} ▶
		</button>
	</div>

	<div class="mt-6 flex w-full max-w-6xl flex-wrap justify-center gap-3">
		{#if game_state.players.length === 0}
			<p class="text-xl text-white/70 animate-pulse">Waiting for players to join…</p>
		{/if}
		{#each game_state.players as player (player.username)}
			<button
				type="button"
				in:scale|global={{ duration: 350, start: 0.3 }}
				title="Click to kick"
				class="rounded-full border-2 border-white/30 bg-[#0f2b36]/80 px-5 py-2 text-xl font-semibold shadow-lg transition hover:border-red-400 hover:bg-red-600/80 hover:line-through"
				onclick={() => {
					socket_game_controls.kick_player(player.username, game_state.players);
				}}>{player.username}</button
			>
		{/each}
	</div>
</div>

{#if fullscreen_open}
	<div
		class="fixed top-0 left-0 z-50 w-screen h-screen bg-black/50 flex p-2"
		transition:fade|global={{ duration: 80 }}
		onclick={() => (fullscreen_open = false)}
		tabindex="0"
		role="button"
		aria-label="Close modal"
		onkeydown={(e) =>
			e.key === 'Enter' || e.key === ' '
				? () => {
						fullscreen_open = false;
					}
				: null}
	>
		<img
			alt="QR code to join the game"
			src="/api/v1/utils/qr/{game_pin}"
			class="object-contain rounded-sm m-auto h-full bg-white"
		/>
	</div>
{/if}
