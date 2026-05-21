<script lang="ts">
	import { formatRelativeDate } from '@bfs/ui';

	interface SearchResult {
		thread_id: string;
		from_handle_cache: string;
		sent_at?: string;
		created_at: string;
		subject: string;
		snippet: string;
	}

	let { result }: { result: SearchResult } = $props();

	const displayDate = $derived(result.sent_at || result.created_at);
</script>

<a href="/thread/{result.thread_id}" class="result-card">
	<div class="result-header">
		<span class="result-from t-sender">@{result.from_handle_cache}</span>
		<span class="result-date t-meta">{formatRelativeDate(displayDate)}</span>
	</div>
	<div class="result-subject t-subject">{result.subject}</div>
	<div class="result-snippet t-meta">{@html result.snippet}</div>
</a>

<style>
	.result-card {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
		padding: var(--space-4) var(--space-5);
		background: white;
		border: 2px solid var(--border-strong);
		border-radius: var(--radius);
		text-decoration: none;
		transition: all 0.2s;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
	}

	.result-card:hover {
		border-color: var(--postal-blue);
		box-shadow: 0 2px 8px rgba(61, 90, 128, 0.12);
		transform: translateY(-1px);
	}

	.result-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: var(--space-3);
	}

	.result-from {
		color: var(--postal-blue-dark);
	}

	.result-subject {
		color: var(--ink-navy);
		font-weight: 500;
	}

	.result-snippet {
		color: var(--ink-slate);
		line-height: 1.5;
	}

	.result-snippet :global(mark) {
		background: var(--postal-blue-light);
		color: var(--postal-blue-dark);
		font-weight: 600;
		padding: 0 2px;
		border-radius: 2px;
	}
</style>
