<script lang="ts">
	import { enhance } from '$app/forms';
	import { Alert, Button, Textarea } from '@bfs/ui';

	let {
		messageUuid,
		formData = null,
		onclose
	}: {
		messageUuid: string;
		formData?: any;
		onclose: () => void;
	} = $props();
</script>

<div class="report-panel">
	{#if formData?.report_error && formData?.reported_uuid === messageUuid}
		<Alert variant="danger">{formData.report_error}</Alert>
	{/if}
	<form
		method="POST"
		action="?/report"
		use:enhance={() => {
			return ({ result, update }) => {
				if (result.type === 'success') onclose();
				update();
			};
		}}
	>
		<input type="hidden" name="message_uuid" value={messageUuid} />
		<Textarea
			name="reason"
			placeholder="Describe why you're reporting this message…"
			rows={3}
			required
		/>
		<div class="report-panel__footer">
			<Button type="button" variant="secondary" onclick={onclose}>Cancel</Button>
			<Button type="submit" variant="danger">Submit Report</Button>
		</div>
	</form>
</div>

<style>
	.report-panel {
		border-top: 1px solid var(--border-faint);
		background: var(--wax-red-light);
		padding: var(--space-4) var(--space-6);
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
	}

	.report-panel__footer {
		display: flex;
		justify-content: flex-end;
		gap: var(--space-3);
	}
</style>
