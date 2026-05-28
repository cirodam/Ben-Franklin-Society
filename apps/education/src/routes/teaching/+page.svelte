<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<svelte:head>
	<title>Teaching - Education</title>
</svelte:head>

<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
	<h1>Teaching</h1>
	<a href="/courses/create"><button class="primary">Create Course</button></a>
</div>

{#if data.courses.length === 0}
	<div class="card">
		<p style="color: var(--color-secondary);">You are not currently teaching any courses.</p>
		<a href="/courses/create"><button class="primary">Create a Course</button></a>
	</div>
{:else}
	<div style="display: grid; gap: 1rem;">
		{#each data.courses as { course, activeEnrollments }}
			<div class="card">
				<div style="display: flex; justify-content: space-between; align-items: start;">
					<div style="flex: 1;">
						<h3 style="margin-top: 0;">{course.title}</h3>
						<p style="color: var(--color-secondary); font-size: 0.875rem;">
							{course.description.slice(0, 150)}{course.description.length > 150 ? '...' : ''}
						</p>

						<div style="display: flex; gap: 0.5rem; margin-top: 1rem;">
							<span class="badge info">{course.courseType}</span>
							<span class="badge info">{course.deliveryFormat}</span>
							<span class="badge {course.status === 'published' ? 'success' : course.status === 'draft' ? 'warning' : 'info'}">
								{course.status}
							</span>
						</div>

						<div style="margin-top: 1rem; font-size: 0.875rem; color: var(--color-secondary);">
							<div>📍 {course.location}</div>
							<div>👥 {activeEnrollments} / {course.capacity} enrolled</div>
							{#if course.durationWeeks}
								<div>⏱️ {course.durationWeeks} weeks</div>
							{/if}
						</div>
					</div>

					<a href="/courses/{course.uuid}">
						<button>Manage Course</button>
					</a>
				</div>
			</div>
		{/each}
	</div>
{/if}
