<!--
SPDX-FileCopyrightText: 2023 Marlon W (Mawoka)

SPDX-License-Identifier: MPL-2.0
-->

<script lang="ts">
	interface Props {
		title: string;
		description: string;
		cover_image: string | undefined;
	}

	let { title, description, cover_image }: Props = $props();
</script>

<div class="flex flex-col justify-center w-full min-h-dvh px-4 py-8 gap-4 sm:gap-6">
	<h1 class="text-4xl sm:text-5xl lg:text-7xl font-bold text-center leading-tight break-words">{@html title}</h1>
	<p class="text-lg sm:text-2xl lg:text-3xl text-center break-words">{@html description}</p>
	{#if cover_image}
		<div class="flex justify-center align-middle items-center">
			<div class="h-[30vh] m-auto w-auto mt-4 sm:mt-8">
				<img
					class="max-h-full max-w-full block object-contain rounded-lg"
					src="/api/v1/storage/download/{cover_image}"
					alt="Not provided"
				/>
			</div>
		</div>
	{/if}
</div>
