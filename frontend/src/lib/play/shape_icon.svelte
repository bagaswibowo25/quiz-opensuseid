<!--
SPDX-License-Identifier: MPL-2.0
-->

<script lang="ts">
	interface Props {
		index: number;
		class?: string;
	}

	let { index, class: css_class = 'w-7 h-7' }: Props = $props();
</script>

<svg viewBox="0 0 24 24" class="shrink-0 {css_class}" fill="currentColor" aria-hidden="true">
	{#if index % 4 === 0}
		<path d="M12 3 22 20H2Z" />
	{:else if index % 4 === 1}
		<path d="M12 1.5 22.5 12 12 22.5 1.5 12Z" />
	{:else if index % 4 === 2}
		<circle cx="12" cy="12" r="10" />
	{:else}
		<rect x="3" y="3" width="18" height="18" rx="2" />
	{/if}
</svg>
