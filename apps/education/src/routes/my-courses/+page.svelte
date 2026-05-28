<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<svelte:head>
	<title>My Courses - Education</title>
</svelte:head>

<h1>My Courses</h1>

{#if data.enrolledCourses.length === 0}
	<div class="card">
		<p style="color: var(--color-secondary);">You are not currently enrolled in any courses.</p>
		<a href="/courses"><button class="primary">Browse Courses</button></a>
	</div>
{:else}
	<div style="display: grid; gap: 1rem;">
		{#each data.enrolledCourses as { enrollment, course }}
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
							<span class="badge {enrollment.status === 'completed' ? 'success' : 'info'}">
								{enrollment.status}
							</span>
						</div>

						<div style="margin-top: 1rem; font-size: 0.875rem; color: var(--color-secondary);">
							<div>📍 {course.location}</div>
							<div>📅 Enrolled {new Date(enrollment.enrolledAt).toLocaleDateString()}</div>
							{#if enrollment.completionDate}
								<div>✅ Completed {new Date(enrollment.completionDate).toLocaleDateString()}</div>
							{/if}
						</div>
					</div>

					<a href="/courses/{course.uuid}">
						<button>View Course</button>
					</a>
				</div>
			</div>
		{/each}
	</div>
{/if}
