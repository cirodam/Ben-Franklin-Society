<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<svelte:head>
	<title>Browse Courses - Education</title>
</svelte:head>

<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
	<h1>Browse Courses</h1>
	<a href="/courses/create"><button class="primary">Create Course</button></a>
</div>

{#if data.courses.length === 0}
	<div class="card">
		<p>No courses available yet. Create the first course!</p>
	</div>
{:else}
	<div style="display: grid; gap: 1rem;">
		{#each data.courses as course}
			<div class="card">
				<div style="display: flex; justify-content: space-between; align-items: start;">
					<div style="flex: 1;">
						<h3 style="margin-top: 0;">{course.title}</h3>
						<p style="color: var(--color-secondary);">{course.description}</p>

						<div style="display: flex; gap: 0.5rem; margin-top: 1rem;">
							<span class="badge info">{course.courseType}</span>
							<span class="badge info">{course.deliveryFormat}</span>
						</div>

						<div style="margin-top: 1rem; font-size: 0.875rem; color: var(--color-secondary);">
							<div>📍 {course.location}</div>
							{#if course.durationWeeks}
								<div>⏱️ {course.durationWeeks} weeks</div>
							{/if}
							<div>👥 Capacity: {course.capacity}</div>
						</div>
					</div>

					<div style="display: flex; flex-direction: column; gap: 0.5rem;">
						<span class="badge {course.status === 'published' ? 'success' : course.status === 'draft' ? 'warning' : 'info'}">
							{course.status}
						</span>
						<a href="/courses/{course.uuid}">
							<button>View Details</button>
						</a>
					</div>
				</div>
			</div>
		{/each}
	</div>
{/if}
