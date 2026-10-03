<!--
SPDX-FileCopyrightText: 2023 Marlon W (Mawoka)

SPDX-License-Identifier: MPL-2.0
-->

<!--suppress ALL -->
<script lang="ts">
	import { socket } from '$lib/socket';
	import JoinGame from '$lib/play/join.svelte';
	import type { Answer, Question as QuestionType } from '$lib/quiz_types';
	import ShowTitle from '$lib/play/title.svelte';
	import Question from '$lib/play/question.svelte';
	import { navbarVisible } from '$lib/stores.svelte.ts';
	import ShowEndScreen from '$lib/play/admin/final_results.svelte';
	import KahootResults from '$lib/play/results_kahoot.svelte';
	import { getLocalization } from '$lib/i18n';
	import Cookies from 'js-cookie';
	import { tick } from 'svelte';
	const { t } = getLocalization();

	interface Props {
		// Exports
		data: any;
	}

	let { data }: Props = $props();
	let { game_pin } = $state(data);

	// Types
	interface GameMeta {
		started: boolean;
	}

	let game_mode = $state();
	let final_results: Array<null> | Array<Array<PlayerAnswer>> = $state([null]);

	interface PlayerAnswer {
		username: string;
		answer: string;
		right: string;
	}

	// Variables init
	let question_index = $state('');
	let unique = $state({});
	navbarVisible.visible = false;
	let answer_results: Array<Answer> = $state();
	let gameData = $state();
	let solution: QuestionType = $state();
	let username = $state('');
	let scores = $state({});
	let gameMeta: GameMeta = $state({
		started: false
	});

	let question: Question = $state();

	let preventReload = true;

	// Functions
	function restart() {
		unique = {};
	}

	const confirmUnload = (event: Event) => {
		if (preventReload) {
			event.preventDefault();
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-ignore
			event.returnValue = '';
		}
	};

	socket.on('time_sync', (data) => {
		socket.emit('echo_time_sync', data);
	});

	// PIN from the link/QR code (?pin=); it wins over a cookie left by another game.
	const url_pin: string = data.game_pin ?? '';
	let pending_rejoin: { sid: string; username: string; game_pin: string } | null = null;
	let rejoin_timeout: ReturnType<typeof setTimeout> | undefined;

	const forget_session = () => {
		Cookies.remove('joined_game');
		pending_rejoin = null;
		clearTimeout(rejoin_timeout);
	};

	socket.on('connect', async () => {
		console.log('Connected!');
		const cookie_data = Cookies.get('joined_game');
		if (!cookie_data) {
			return;
		}
		let saved;
		try {
			saved = JSON.parse(cookie_data);
		} catch {
			forget_session();
			return;
		}
		if (url_pin && url_pin !== saved.game_pin) {
			// Opened a different game's link: don't drag the player back into the old one
			forget_session();
			return;
		}
		// Only adopt the saved name/PIN once the server accepts the rejoin (see 'rejoined_game');
		// a stale cookie must not leave the join screen stuck on an old game.
		pending_rejoin = saved;
		socket.emit('rejoin_game', {
			old_sid: saved.sid,
			username: saved.username,
			game_pin: saved.game_pin
		});
		clearTimeout(rejoin_timeout);
		rejoin_timeout = setTimeout(() => {
			if (pending_rejoin) forget_session();
		}, 4000);
	});

	socket.on('rejoin_failed', () => {
		forget_session();
	});

	// Socket-events
	socket.on('joined_game', (data) => {
		gameData = data;
		// eslint-disable-next-line no-undef
		plausible('Joined Game', { props: { game_id: gameData.game_id } });
		Cookies.set('joined_game', JSON.stringify({ sid: socket.id, username, game_pin }), {
			expires: 3600
		});
	});
	socket.on('rejoined_game', async (data) => {
		if (pending_rejoin) {
			// Restore who we are, so results/feedback can find this player's answers
			username = pending_rejoin.username;
			game_pin = pending_rejoin.game_pin;
			pending_rejoin = null;
			clearTimeout(rejoin_timeout);
		}
		gameData = data;
		// The server now knows us by this connection's id; without updating the cookie a second
		// reload would present the stale id and be rejected.
		Cookies.set('joined_game', JSON.stringify({ sid: socket.id, username, game_pin }), {
			expires: 3600
		});
		if (data.started) {
			gameMeta.started = true;
		}
		const res = await fetch(`/api/v1/quiz/play/check_captcha/${game_pin}`);
		const json = await res.json();
		game_mode = json.game_mode;
	});

	// Escape hatch on the waiting screen (e.g. stuck in a game that already ended)
	const leave_game = () => {
		forget_session();
		preventReload = false;
		window.location.href = '/play';
	};

	socket.on('game_not_found', () => {
		const cookie_data = Cookies.get('joined_game');
		if (cookie_data) {
			Cookies.remove('joined_game');
			window.location.reload();
			return;
		}
	});

	socket.on('set_question_number', (data) => {
		solution = undefined;
		restart();
		question = data.question;
		question_index = data.question_index;
		answer_results = undefined;
	});

	socket.on('start_game', () => {
		gameMeta.started = true;
	});

	socket.on('question_results', (data) => {
		restart();
		answer_results = data;
	});

	socket.on('username_already_exists', () => {
		window.alert('Username already exists!');
	});

	socket.on('kick', () => {
		window.alert('You were removed from this game by the host.');
		preventReload = false;
		// Kick = remove from the game, not a ban: the player may join again under another name.
		// Drop the rejoin cookie so the reload doesn't silently reconnect with the kicked username.
		Cookies.remove('joined_game');
		Cookies.remove('kicked');
		game_pin = '';
		username = '';
		window.location.reload();
	});
	socket.on('final_results', (data) => {
		final_results = data;
		Cookies.remove('joined_game');
	});

	// Running totals from the server (survives reloads; replaces the in-browser sum)
	// Applied after the results screen has rendered: it adds this question's points to the
	// in-browser totals on mount, and the server's totals must win over that sum.
	socket.on('player_scores', async (data) => {
		await tick();
		scores = data;
	});

	socket.on('solutions', (data) => {
		solution = data;
	});

	let bg_color = $derived(gameData ? gameData.background_color : undefined);

	// The rest
</script>

<svelte:window onbeforeunload={confirmUnload} />
<svelte:head>
	<title>ClassQuiz - Play</title>
</svelte:head>
<div
	class="min-h-dvh min-w-full"
	class:stage={!bg_color}
	style="background: {bg_color ? bg_color : 'transparent'}"
	class:text-black={bg_color}
>
	<div>
		{#if !gameMeta.started && gameData === undefined}
			<JoinGame bind:game_pin bind:game_mode bind:username />
		{:else if JSON.stringify(final_results) !== JSON.stringify([null])}
			<ShowEndScreen bind:data={scores} show_final_results={true} {username} />
		{:else if gameData !== undefined && question_index === ''}
			<ShowTitle
				{username}
				onleave={leave_game}
				started={gameMeta.started}
				title={gameData.title}
				description={gameData.description}
				cover_image={gameData.cover_image}
			/>
		{:else if gameMeta.started && gameData !== undefined && question_index !== '' && answer_results === undefined}
			{#key unique}
				<div>
					<Question bind:game_mode bind:question {question_index} {solution} />
				</div>
			{/key}
		{:else if gameMeta.started && answer_results !== undefined}
			{#if answer_results === null}
				<div class="w-full min-h-dvh flex items-center justify-center p-6">
					<h1 class="stage-card px-8 py-6 text-3xl text-center">{$t('admin_page.no_answers')}</h1>
				</div>
			{:else}
				{#key unique}
					<KahootResults {username} question_results={answer_results} bind:scores />
				{/key}
			{/if}
		{/if}
	</div>
</div>
