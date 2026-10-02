<!--
SPDX-FileCopyrightText: 2023 Marlon W (Mawoka)

SPDX-License-Identifier: MPL-2.0
-->

<script lang="ts">
	import type { Question } from '$lib/quiz_types';
	import { onMount } from 'svelte';
	import Pikaso from 'pikaso';

	interface Props {
		question: Question;
	}

	let { question }: Props = $props();

	let canvas_el: HTMLDivElement | undefined = $state();
	let canvas: Pikaso;
	let img_src = $state('');

	// Collect every image URL used in the slide (shapes + background) so we can wait for them.
	const collect_image_urls = (node: unknown, urls: string[] = []): string[] => {
		if (Array.isArray(node)) {
			node.forEach((n) => collect_image_urls(n, urls));
		} else if (node && typeof node === 'object') {
			const obj = node as Record<string, unknown>;
			const attrs = obj.attrs as Record<string, unknown> | undefined;
			if (obj.className === 'Image' && typeof attrs?.url === 'string') {
				urls.push(attrs.url);
			}
			Object.values(obj).forEach((v) => collect_image_urls(v, urls));
		}
		return urls;
	};

	const preload = (url: string) =>
		new Promise<void>((resolve) => {
			const img = new Image();
			img.onload = () => resolve();
			img.onerror = () => resolve();
			img.src = url;
		});

	const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

	onMount(() => {
		canvas = new Pikaso({
			container: canvas_el,
			snapToGrid: {},
			selection: {
				interactive: false
			}
		});
		if (typeof question.answers !== 'string') return;
		const data = JSON.parse(question.answers);
		let cancelled = false;

		(async () => {
			// Images inside the slide load asynchronously; exporting right after import
			// (as upstream did) produces a slide without its images.
			await Promise.all(collect_image_urls(data).map(preload));
			canvas.import.json(data);
			for (const delay of [150, 600, 1500]) {
				await wait(delay);
				if (cancelled) return;
				img_src = canvas.export.toImage();
			}
		})();

		return () => {
			cancelled = true;
		};
	});
</script>

<div class="w-full h-full">
	<div class="hidden">
		<div bind:this={canvas_el} class="w-full h-full block"></div>
	</div>
	<div class="w-full h-full flex justify-center px-6 pb-24">
		{#if img_src}
			<img
				src={img_src}
				alt={question.question}
				class="pop-in max-h-[80dvh] w-auto max-w-full rounded-3xl object-contain shadow-2xl"
			/>
		{/if}
	</div>
</div>
