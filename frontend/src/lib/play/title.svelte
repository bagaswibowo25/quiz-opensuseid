<!--
SPDX-FileCopyrightText: 2023 Marlon W (Mawoka)

SPDX-License-Identifier: MPL-2.0
-->

<script lang="ts">
	interface Props {
		title: string;
		description: string;
		cover_image: string | undefined;
		username?: string;
		started?: boolean;
		onleave?: () => void;
	}

	let { title, description, cover_image, username, started = false, onleave }: Props = $props();
</script>

<div class="flex flex-col items-center justify-center w-full min-h-dvh px-4 py-8 pb-24 gap-6">
	{#if cover_image}
		<img
			class="pop-in w-full max-w-3xl max-h-[45dvh] object-contain rounded-2xl shadow-2xl"
			src="/api/v1/storage/download/{cover_image}"
			alt={title}
		/>
	{:else}
		<div class="stage-card pop-in w-full max-w-3xl px-6 py-8 text-center">
			<h1 class="text-4xl sm:text-5xl lg:text-7xl font-bold leading-tight break-words">
				{@html title}
			</h1>
			<p class="mt-4 text-lg sm:text-2xl text-[#c5e8a8] break-words">{@html description}</p>
		</div>
	{/if}

	<div class="flex flex-col items-center gap-3 text-center">
		{#if username}
			<p class="text-2xl sm:text-3xl font-bold">
				You're in, <span class="text-[#73BA25]">{username}</span>! 🎉
			</p>
		{/if}
		<p class="flex items-center gap-2 text-lg sm:text-xl text-white/80">
			{started ? 'Look at the big screen 👀' : 'Waiting for the host to start'}
			<span class="flex gap-1">
				<span class="h-2 w-2 rounded-full bg-[#73BA25] animate-bounce"></span>
				<span class="h-2 w-2 rounded-full bg-[#35B9AB] animate-bounce [animation-delay:150ms]"></span>
				<span class="h-2 w-2 rounded-full bg-[#21A4D4] animate-bounce [animation-delay:300ms]"></span>
			</span>
		</p>
		{#if onleave}
			<button
				type="button"
				class="mt-4 text-sm text-white/50 underline underline-offset-4 hover:text-white/80"
				onclick={() => {
					if (confirm('Leave this game? You can join again with the game PIN.')) onleave();
				}}>Leave this game</button
			>
		{/if}
	</div>
</div>
