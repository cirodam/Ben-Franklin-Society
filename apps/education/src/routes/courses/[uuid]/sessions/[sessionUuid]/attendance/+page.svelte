<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	const { course, session, studentsWithAttendance } = data;

	function formatDateTime(isoString: string) {
		return new Date(isoString).toLocaleString('en-US', {
			weekday: 'long',
			month: 'long',
			day: 'numeric',
			year: 'numeric',
			hour: 'numeric',
			minute: '2-digit'
		});
	}
</script>

<svelte:head>
	<title>Mark Attendance - {course.title}</title>
</svelte:head>

<div style="margin-bottom: 2rem;">
	<a href="/courses/{course.uuid}">← Back to {course.title}</a>
</div>

<h1>Mark Attendance</h1>

<div class="card" style="margin-bottom: 2rem;">
	<h3 style="margin-top: 0;">{formatDateTime(session.scheduledAt)}</h3>
	<div style="color: var(--color-secondary); font-size: 0.875rem;">
		{session.durationMinutes} minutes
		{#if session.location}
			• {session.location}
		{/if}
	</div>
	{#if session.notes}
		<p style="margin-top: 0.5rem;">{session.notes}</p>
	{/if}
</div>

{#if studentsWithAttendance.length === 0}
	<div class="card">
		<p style="color: var(--color-secondary);">No students enrolled in this course.</p>
	</div>
{:else}
	<form method="POST" use:enhance>
		<div class="card">
			<h2>Students ({studentsWithAttendance.length})</h2>
			<div style="display: flex; flex-direction: column; gap: 0.75rem; margin-top: 1rem;">
				{#each studentsWithAttendance as { enrollment, attendance, user }}
					<label style="display: flex; align-items: center; gap: 1rem; padding: 0.75rem; border: 1px solid var(--color-border); border-radius: 4px; cursor: pointer;">
						<input 
							type="checkbox" 
							name="attended" 
							value={enrollment.studentUuid}
							checked={attendance?.attended ?? false}
							style="width: 1.25rem; height: 1.25rem; cursor: pointer;"
						/>
						<div style="flex: 1;">
							<div style="font-weight: 500;">{user?.displayName || 'Unknown'}</div>
							<div style="font-size: 0.875rem; color: var(--color-secondary);">
								@{user?.username || enrollment.studentUuid.slice(0, 8)}
							</div>
						</div>
						{#if attendance}
							<span style="font-size: 0.875rem; color: var(--color-secondary);">
								{attendance.attended ? '✓ Present' : '✗ Absent'}
							</span>
						{/if}
					</label>
				{/each}
			</div>

			<div style="margin-top: 1.5rem;">
				<button type="submit" class="primary">Save Attendance</button>
			</div>
		</div>
	</form>
{/if}
