<script lang="ts">
	/**
	 * Simple markdown renderer supporting:
	 * - **bold**, *italic*
	 * - > blockquotes
	 * - unordered lists (- item)
	 * - ordered lists (1. item)
	 * - inline code (`code`)
	 * - links [text](url)
	 */
	let { markdown = '' }: { markdown: string } = $props();

	function escapeHtml(text: string): string {
		const div = document.createElement('div');
		div.textContent = text;
		return div.innerHTML;
	}

	function renderMarkdown(md: string): string {
		let html = escapeHtml(md);

		// Process line by line for block elements
		const lines = html.split('\n');
		const output: string[] = [];
		let inList = false;
		let listType: 'ul' | 'ol' | null = null;

		for (let i = 0; i < lines.length; i++) {
			let line = lines[i];

			// Blockquote
			if (line.match(/^&gt;\s/)) {
				line = line.replace(/^&gt;\s/, '');
				line = `<blockquote>${line}</blockquote>`;
				output.push(line);
				continue;
			}

			// Unordered list
			if (line.match(/^-\s/)) {
				line = line.replace(/^-\s/, '');
				if (!inList || listType !== 'ul') {
					if (inList) output.push(`</${listType}>`);
					output.push('<ul>');
					inList = true;
					listType = 'ul';
				}
				output.push(`<li>${line}</li>`);
				continue;
			}

			// Ordered list
			if (line.match(/^\d+\.\s/)) {
				line = line.replace(/^\d+\.\s/, '');
				if (!inList || listType !== 'ol') {
					if (inList) output.push(`</${listType}>`);
					output.push('<ol>');
					inList = true;
					listType = 'ol';
				}
				output.push(`<li>${line}</li>`);
				continue;
			}

			// Close list if we're in one and hit non-list line
			if (inList) {
				output.push(`</${listType}>`);
				inList = false;
				listType = null;
			}

			// Paragraph (non-empty lines)
			if (line.trim()) {
				output.push(`<p>${line}</p>`);
			} else {
				output.push('<br>');
			}
		}

		// Close any open list
		if (inList && listType) {
			output.push(`</${listType}>`);
		}

		html = output.join('\n');

		// Inline formatting
		// Bold: **text**
		html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
		// Italic: *text*
		html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');
		// Code: `code`
		html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
		// Links: [text](url)
		html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');

		return html;
	}

	const renderedHtml = $derived(renderMarkdown(markdown));
</script>

<div class="markdown-renderer">
	{@html renderedHtml}
</div>

<style>
	.markdown-renderer {
		font-family: var(--font-serif);
		font-size: var(--text-base);
		line-height: 1.7;
		color: var(--ink-navy);
	}

	:global(.markdown-renderer p) {
		margin: 0 0 var(--space-3);
	}

	:global(.markdown-renderer p:last-child) {
		margin-bottom: 0;
	}

	:global(.markdown-renderer strong) {
		font-weight: 700;
		color: var(--ink-charcoal);
	}

	:global(.markdown-renderer em) {
		font-style: italic;
	}

	:global(.markdown-renderer code) {
		font-family: var(--font-mono);
		font-size: 0.9em;
		background: var(--parchment);
		padding: 0.125rem 0.375rem;
		border-radius: var(--radius-sm);
		border: 1px solid var(--border);
	}

	:global(.markdown-renderer a) {
		color: var(--postal-blue);
		text-decoration: underline;
	}

	:global(.markdown-renderer a:hover) {
		color: var(--postal-blue-mid);
	}

	:global(.markdown-renderer blockquote) {
		margin: var(--space-3) 0;
		padding-left: var(--space-4);
		border-left: 4px solid var(--postal-blue-light);
		color: var(--ink-slate);
		font-style: italic;
	}

	:global(.markdown-renderer ul),
	:global(.markdown-renderer ol) {
		margin: var(--space-3) 0;
		padding-left: var(--space-6);
	}

	:global(.markdown-renderer li) {
		margin: var(--space-2) 0;
	}

	:global(.markdown-renderer br) {
		display: block;
		margin: var(--space-2) 0;
		content: '';
	}
</style>
