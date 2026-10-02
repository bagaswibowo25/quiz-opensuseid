<!--
SPDX-FileCopyrightText: 2023 Marlon W (Mawoka)

SPDX-License-Identifier: MPL-2.0
-->

<script lang="ts">
	import { socket } from '$lib/socket';
	import { onDestroy, onMount } from 'svelte';
	import { browser } from '$app/environment';
	import * as Sentry from '@sentry/browser';
	import { getLocalization } from '$lib/i18n';
	import Cookies from 'js-cookie';
	import BrownButton from '$lib/components/buttons/brown.svelte';
	import { hcaptcha_site_key, recaptcha_key, sentry_dsn } from '$lib/config';

	const { t } = getLocalization();

	interface Props {
		game_pin: string;
		game_mode: any;
		username: any;
	}

	let {
		game_pin = $bindable(),
		game_mode = $bindable(),
		username = $bindable()
	}: Props = $props();
	let custom_field = $state();
	let custom_field_value = $state();
	let captcha_enabled = $state();

	let hcaptchaSitekey = hcaptcha_site_key;

	let hcaptcha = {
		execute: async (_a, _b) => ({ response: '' }), // eslint-disable-line @typescript-eslint/no-unused-vars
		// eslint-disable-next-line @typescript-eslint/no-empty-function
		render: (_a, _b) => {} // eslint-disable-line @typescript-eslint/no-unused-vars
	};
	let hcaptchaWidgetID;

	onMount(() => {
		if (browser) {
			prefetch_username();
			hcaptcha = window.hcaptcha;
			if (hcaptcha.render) {
				hcaptchaWidgetID = hcaptcha.render('hcaptcha', {
					sitekey: hcaptchaSitekey,
					size: 'invisible',
					theme: 'dark'
				});
			}
		}
	});

	onDestroy(() => {
		if (browser) {
			hcaptcha = {
				execute: async () => ({ response: '' }),
				// eslint-disable-next-line @typescript-eslint/no-empty-function
				render: () => {}
			};
		}
	});

	const prefetch_username = async () => {
		const res = await fetch('/api/v1/users/me');
		if (res.status !== 200) {
			return;
		}
		const json = await res.json();
		username = json.username;
	};

	const set_game_pin = async () => {
		let process_var;
		try {
			process_var = process;
		} catch {
			process_var = { env: { API_URL: undefined } };
		}

		const res = await fetch(
			`${process_var.env.API_URL ?? ''}/api/v1/quiz/play/check_captcha/${game_pin}`
		);
		const json = await res.json();
		game_mode = json.game_mode;
		if (res.status === 200) {
			captcha_enabled = json.enabled;
			custom_field = json.custom_field;
		}
		if (res.status === 404) {
			/*			alertModal.set({
                open: true,
                title: 'Game not found',
                body: 'The game pin you entered seems invalid.'
            });*/
			if (browser) {
				alert('Game not found');
			}
			game_pin = '';
			return;
		}
		if (res.status !== 200) {
			/*			alertModal.set({
                open: true,
                body: `Unknown error with response-code ${res.status}`,
                title: 'Unknown Error'
            });*/
			alert('Unknown error');
			return;
		}
	};

	$effect(() => {
		if (game_pin.length > 5) {
			set_game_pin();
		}
	});

	const setUsername = async (e: Event) => {
		e.preventDefault();
		if (username.length <= 3) {
			return;
		}
		let captcha_resp: string;
		if (Cookies.get('kicked')) {
			console.log("%cYou're Banned!", 'font-size:6rem');
			return;
		}

		if (captcha_enabled) {
			if (hcaptchaSitekey) {
				try {
					const { response } = await hcaptcha.execute(hcaptchaWidgetID, {
						async: true
					});
					captcha_resp = response;
					socket.emit('join_game', {
						username: username,
						game_pin: game_pin,
						captcha: captcha_resp,
						custom_field: custom_field ? custom_field_value : undefined
					});
				} catch (e) {
					if (sentry_dsn !== null) {
						Sentry.captureException(e);
					}
					/*					alertModal.set({
                        open: true,
                        body: "The captcha failed, which is normal, but most of the time it's fixed by reloading!",
                        title: 'Captcha failed'
                    });*/
					alert('Captcha failed!');
					window.location.reload();
				}
			} else if (recaptcha_key) {
				// eslint-disable-next-line no-undef
				grecaptcha.ready(() => {
					// eslint-disable-next-line no-undef
					grecaptcha.execute(recaptcha_key, { action: 'submit' }).then(function (token) {
						socket.emit('join_game', {
							username: username,
							game_pin: game_pin,
							captcha: token,
							custom_field: custom_field ? custom_field_value : undefined
						});
					});
				});
			}
		} else {
			socket.emit('join_game', {
				username: username,
				game_pin: game_pin,
				captcha: undefined,
				custom_field: custom_field ? custom_field_value : undefined
			});
		}
	};
	socket.on('game_not_found', () => {
		game_pin = '';
		if (browser) {
			alert('Game not found');
		}
	});
	$effect(() => {
		const cleaned = game_pin.replace(/\D/g, '');
		if (game_pin.replace(/\D/g, '') === game_pin) {
			return;
		}
		game_pin = cleaned;
	});
</script>

<svelte:head>
	{#if captcha_enabled && hcaptchaSitekey}
		<script src="https://js.hcaptcha.com/1/api.js" async defer></script>
	{/if}
	{#if recaptcha_key && captcha_enabled}
		<script src="https://www.google.com/recaptcha/api.js?render={recaptcha_key}"></script>
	{/if}
</svelte:head>

{#snippet brand()}
	<div class="flex flex-col items-center gap-2 mb-6">
		<img src="/geeko.svg" alt="openSUSE" class="h-14 sm:h-16 w-auto drop-shadow-lg" />
		<p class="text-base font-semibold tracking-[0.2em] text-[#c5e8a8]">openSUSE Quiz</p>
	</div>
{/snippet}

{#if game_pin === '' || game_pin.length < 6}
	<div class="flex flex-col justify-center items-center w-full min-h-dvh px-4 pb-24">
		{@render brand()}
		<form
			onsubmit={(e) => e.preventDefault()}
			class="stage-card pop-in w-full max-w-sm flex flex-col gap-4 p-6 sm:p-8"
		>
			<label for="game-pin" class="text-center text-xl font-bold">{$t('words.game_pin')}</label>
			<input
				id="game-pin"
				class="w-full rounded-2xl border-2 border-white/20 bg-white px-4 py-3 text-center text-3xl font-bold tracking-[0.3em] text-[#173F4F] outline-hidden placeholder:text-gray-300 focus:border-[#73BA25] focus:ring-4 focus:ring-[#73BA25]/40 transition-all"
				bind:value={game_pin}
				maxlength="6"
				inputmode="numeric"
				autocomplete="off"
				placeholder="000000"
			/>
			<button
				type="button"
				class="admin-button w-full !py-3 text-xl"
				disabled={game_pin.length < 6}>{$t('words.submit')}</button
			>
		</form>
	</div>
{:else}
	<div class="flex flex-col justify-center items-center w-full min-h-dvh px-4 pb-24">
		{@render brand()}
		<form onsubmit={setUsername} class="stage-card pop-in w-full max-w-sm flex flex-col gap-4 p-6 sm:p-8">
			<label for="username" class="text-center text-xl font-bold">{$t('words.username')}</label>
			<input
				id="username"
				class="w-full rounded-2xl border-2 border-white/20 bg-white px-4 py-3 text-center text-2xl font-bold text-[#173F4F] outline-hidden focus:border-[#73BA25] focus:ring-4 focus:ring-[#73BA25]/40 transition-all"
				bind:value={username}
				maxlength="17"
				autocomplete="nickname"
			/>
			{#if custom_field}
				<label for="custom-field" class="text-center text-lg font-semibold">{custom_field}</label>
				<input
					id="custom-field"
					class="w-full rounded-2xl border-2 border-white/20 bg-white px-4 py-3 text-center text-xl text-[#173F4F] outline-hidden focus:border-[#73BA25] focus:ring-4 focus:ring-[#73BA25]/40 transition-all"
					bind:value={custom_field_value}
				/>
			{/if}
			<button
				type="button"
				class="admin-button w-full !py-3 text-xl"
				disabled={username.length <= 3}
				onclick={setUsername}>{$t('words.submit')}</button
			>
		</form>
	</div>
{/if}
<div
	id="hcaptcha"
	class="h-captcha"
	data-sitekey={hcaptchaSitekey}
	data-size="invisible"
	data-theme="dark"
></div>
