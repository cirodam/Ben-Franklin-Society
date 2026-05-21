<script lang="ts">
	let {
		name,
		value = $bindable(''),
		rows = 8,
		placeholder = 'Write your message…',
		required = false
	}: {
		name: string;
		value?: string;
		rows?: number;
		placeholder?: string;
		required?: boolean;
	} = $props();

	let textareaElement: HTMLTextAreaElement | undefined = $state();

	function insertFormatting(before: string, after: string = '') {
		if (!textareaElement) return;

		const start = textareaElement.selectionStart;
		const end = textareaElement.selectionEnd;
		const selectedText = value.substring(start, end);
		const newText =
			value.substring(0, start) + before + selectedText + after + value.substring(end);

		value = newText;

		// Set cursor position after inserted text
		setTimeout(() => {
			if (textareaElement) {
				const newPos = start + before.length + selectedText.length + after.length;
				textareaElement.focus();
				textareaElement.setSelectionRange(newPos, newPos);
			}
		}, 0);
	}

	function insertBold() {
		insertFormatting('**', '**');
	}

	function insertItalic() {
		insertFormatting('*', '*');
	}

	function insertCode() {
		insertFormatting('`', '`');
	}

	function insertLink() {
		insertFormatting('[', '](url)');
	}

	function insertList() {
		if (!textareaElement) return;
		const start = textareaElement.selectionStart;
		const lineStart = value.lastIndexOf('\n', start - 1) + 1;
		const newText = value.substring(0, lineStart) + '- ' + value.substring(lineStart);
		value = newText;
		setTimeout(() => {
			if (textareaElement) {
				textareaElement.focus();
				textareaElement.setSelectionRange(start + 2, start + 2);
			}
		}, 0);
	}

	function insertQuote() {
		if (!textareaElement) return;
		const start = textareaElement.selectionStart;
		const lineStart = value.lastIndexOf('\n', start - 1) + 1;
		const newText = value.substring(0, lineStart) + '> ' + value.substring(lineStart);
		value = newText;
		setTimeout(() => {
			if (textareaElement) {
				textareaElement.focus();
				textareaElement.setSelectionRange(start + 2, start + 2);
			}
		}, 0);
	}
</script>

<div class="markdown-editor">
	<div class="toolbar">
		<button type="button" class="toolbar-btn" onclick={insertBold} title="Bold">
			<strong>B</strong>
		</button>
		<button type="button" class="toolbar-btn" onclick={insertItalic} title="Italic">
			<em>I</em>
		</button>
		<button type="button" class="toolbar-btn" onclick={insertCode} title="Code">
			&lt;/&gt;
		</button>
		<button type="button" class="toolbar-btn" onclick={insertLink} title="Link">
			🔗
		</button>
		<button type="button" class="toolbar-btn" onclick={insertList} title="List">
			•
		</button>
		<button type="button" class="toolbar-btn" onclick={insertQuote} title="Quote">
			"
		</button>
	</div>
	
	<textarea
		{name}
		{placeholder}
		{rows}
		{required}
		bind:value
		bind:this={textareaElement}
		class="textarea"
	></textarea>
	
	<div class="help-text">
		Markdown supported: **bold**, *italic*, `code`, [link](url), - lists, &gt; quotes
	</div>
</div>

<style>
	.markdown-editor {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}

	.textarea {
		width: 100%;
		padding: var(--space-3);
		font-family: var(--font-mono);
		font-size: var(--text-sm);
		line-height: 1.5;
		border: 1.5px solid var(--border);
		border-radius: var(--radius);
		background: white;
		color: var(--ink-navy);
		resize: vertical;
		transition: border-color 0.2s;
	}

	.textarea:focus {
		outline: none;
		border-color: var(--postal-blue);
	}

	.toolbar {
		display: flex;
		gap: var(--space-1);
		padding: var(--space-2);
		background: var(--parchment);
		border: 1px solid var(--border);
		border-radius: var(--radius);
	}

	.toolbar-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 32px;
		height: 32px;
		padding: 0;
		background: white;
		border: 1px solid var(--border);
		border-radius: var(--radius-sm);
		font-family: var(--font-sans);
		font-size: var(--text-sm);
		cursor: pointer;
		transition: all 0.2s;
	}

	.toolbar-btn:hover {
		background: var(--postal-blue-light);
		border-color: var(--postal-blue-mid);
	}

	.toolbar-btn:active {
		transform: translateY(1px);
	}

	.toolbar-btn strong,
	.toolbar-btn em {
		font-size: var(--text-sm);
		color: var(--ink-charcoal);
	}

	.help-text {
		font-family: var(--font-sans);
		font-size: var(--text-xs);
		color: var(--ink-gray);
	}
</style>
