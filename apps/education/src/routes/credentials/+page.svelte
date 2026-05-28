<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<svelte:head>
	<title>Credentials - Education</title>
</svelte:head>

<h1>My Credentials</h1>

{#if data.credentials.length === 0}
	<div class="card">
		<p style="color: var(--color-secondary);">You have not earned any credentials yet.</p>
		<a href="/courses"><button class="primary">Browse Courses</button></a>
	</div>
{:else}
	<div style="display: grid; gap: 1rem;">
		{#each data.credentials as { credential, course, metadata }}
			<div class="card">
				<div style="display: flex; gap: 1rem;">
					<div style="font-size: 3rem;">🎓</div>
					<div style="flex: 1;">
						<h3 style="margin-top: 0;">{course.title}</h3>
						<div style="display: flex; gap: 0.5rem; margin: 0.5rem 0;">
							<span class="badge success">Completed</span>
							<span class="badge info">{course.courseType}</span>
						</div>

						<div style="margin-top: 1rem; font-size: 0.875rem; color: var(--color-secondary);">
							<div><strong>Issued:</strong> {new Date(credential.issuedAt).toLocaleDateString()}</div>
							<div><strong>Attendance:</strong> {metadata.sessionsAttended} / {metadata.totalSessions} sessions</div>
							<div><strong>Credential ID:</strong> {credential.uuid}</div>
						</div>

						<div style="margin-top: 1rem;">
							<a href="/courses/{course.uuid}">
								<button style="font-size: 0.875rem;">View Course</button>
							</a>
						</div>
					</div>
				</div>
			</div>
		{/each}
	</div>
{/if}
