<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageData, ActionData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	const { course, sessions, enrollments, userEnrollment, isInstructor } = data;

	let showScheduleForm = $state(false);
	
	function formatDateTime(isoString: string) {
		return new Date(isoString).toLocaleString('en-US', {
			weekday: 'short',
			month: 'short',
			day: 'numeric',
			year: 'numeric',
			hour: 'numeric',
			minute: '2-digit'
		});
	}

	const activeEnrollments = enrollments.filter(e => e.status === 'enrolled');
	const isEnrolled = userEnrollment?.status === 'enrolled';
</script>

<svelte:head>
	<title>{course.title} - Education</title>
</svelte:head>

<div style="margin-bottom: 2rem;">
	<a href="/courses">← Back to Courses</a>
</div>

<h1>{course.title}</h1>

<div style="display: flex; gap: 0.5rem; margin: 1rem 0;">
	<span class="badge info">{course.courseType}</span>
	<span class="badge info">{course.deliveryFormat}</span>
	<span class="badge {course.status === 'published' ? 'success' : course.status === 'draft' ? 'warning' : 'info'}">
		{course.status}
	</span>
</div>

<div style="display: grid; grid-template-columns: 2fr 1fr; gap: 2rem; margin-top: 2rem;">
	<div>
		<div class="card">
			<h2>Description</h2>
			<p>{course.description}</p>
		</div>

		{#if course.prerequisites}
			<div class="card">
				<h2>Prerequisites</h2>
				<p>{course.prerequisites}</p>
			</div>
		{/if}

		<div class="card">
			<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
				<h2>Sessions</h2>
				{#if isInstructor}
					<button class="primary" onclick={() => showScheduleForm = !showScheduleForm}>
						{showScheduleForm ? 'Cancel' : 'Schedule Session'}
					</button>
				{/if}
			</div>

			{#if showScheduleForm && isInstructor}
				<form method="POST" action="?/scheduleSession" use:enhance style="margin-bottom: 2rem; padding: 1rem; background: var(--color-background-secondary); border-radius: 4px;">
					<div style="display: flex; flex-direction: column; gap: 1rem;">
						<div>
							<label for="scheduledAt"><strong>Date & Time</strong></label>
							<input type="datetime-local" id="scheduledAt" name="scheduledAt" required />
						</div>

						<div>
							<label for="durationMinutes"><strong>Duration (minutes)</strong></label>
							<input type="number" id="durationMinutes" name="durationMinutes" value="90" min="15" step="15" required />
						</div>

						<div>
							<label for="location"><strong>Location (optional)</strong></label>
							<input type="text" id="location" name="location" placeholder="Override course location" />
						</div>

						<div>
							<label for="notes"><strong>Notes (optional)</strong></label>
							<textarea id="notes" name="notes" rows="2"></textarea>
						</div>

						{#if form?.error}
							<div style="color: var(--color-error); padding: 0.5rem; border: 1px solid var(--color-error); border-radius: 4px; font-size: 0.875rem;">
								{form.error}
							</div>
						{/if}

						<button type="submit" class="primary">Schedule</button>
					</div>
				</form>
			{/if}

			{#if sessions.length === 0}
				<p style="color: var(--color-secondary);">No sessions scheduled yet.</p>
			{:else}
				<div style="display: flex; flex-direction: column; gap: 0.5rem;">
					{#each sessions as session}
						<div style="display: flex; justify-content: space-between; align-items: start; padding: 0.75rem; border: 1px solid var(--color-border); border-radius: 4px;">
							<div style="flex: 1;">
								<div style="font-weight: 500;">{formatDateTime(session.scheduledAt)}</div>
								<div style="font-size: 0.875rem; color: var(--color-secondary);">
									{session.durationMinutes} minutes
									{#if session.location}
										• {session.location}
									{/if}
								</div>
								{#if session.notes}
									<div style="font-size: 0.875rem; margin-top: 0.25rem;">{session.notes}</div>
								{/if}
							</div>
							{#if isInstructor}
								<div style="display: flex; gap: 0.5rem;">
									<a href="/courses/{course.uuid}/sessions/{session.uuid}/attendance">
										<button style="font-size: 0.875rem;">Attendance</button>
									</a>
									<form method="POST" action="?/deleteSession" use:enhance style="display: inline;">
										<input type="hidden" name="sessionUuid" value={session.uuid} />
										<button type="submit" style="color: var(--color-error); font-size: 0.875rem;" onclick={(e) => {
											if (!confirm('Delete this session?')) e.preventDefault();
										}}>Delete</button>
									</form>
								</div>
							{/if}
						</div>
					{/each}
				</div>
			{/if}
		</div>

		<div class="card">
			<h2>Enrolled Students</h2>
			{#if activeEnrollments.length === 0}
				<p style="color: var(--color-secondary);">No enrollments yet.</p>
			{:else}
				<div style="margin-bottom: 1rem;">
					<strong>{activeEnrollments.length} / {course.capacity}</strong> enrolled
				</div>
				{#if isInstructor}
					<div style="display: flex; flex-direction: column; gap: 0.5rem; font-size: 0.875rem;">
						{#each enrollments as enrollment}
							{#if enrollment.status === 'enrolled' || enrollment.status === 'completed'}
								<div style="display: flex; justify-content: space-between; align-items: center; padding: 0.5rem; border: 1px solid var(--color-border); border-radius: 4px;">
									<div style="flex: 1;">
										Student {enrollment.studentUuid.slice(0, 8)}...
										<span style="color: var(--color-secondary);">
											• {enrollment.status === 'completed' ? 'Completed' : 'Enrolled'} {new Date(enrollment.enrolledAt).toLocaleDateString()}
										</span>
									</div>
									{#if enrollment.status === 'enrolled'}
										<form method="POST" action="?/issueCredential" use:enhance style="display: inline;">
											<input type="hidden" name="enrollmentUuid" value={enrollment.uuid} />
											<button type="submit" class="primary" style="font-size: 0.875rem;">Issue Credential</button>
										</form>
									{:else}
										<span class="badge success">✓ Credential Issued</span>
									{/if}
								</div>
							{/if}
						{/each}
					</div>
				{/if}
			{/if}
		</div>
	</div>

	<div>
		<div class="card">
			<h2>Course Details</h2>
			<div style="display: flex; flex-direction: column; gap: 0.5rem; font-size: 0.875rem;">
				<div><strong>Location:</strong> {course.location}</div>
				{#if course.durationWeeks}
					<div><strong>Duration:</strong> {course.durationWeeks} weeks</div>
				{/if}
				<div><strong>Capacity:</strong> {course.capacity}</div>
				<div><strong>Format:</strong> {course.deliveryFormat === 'classroom' ? 'Classroom' : 'One-on-One'}</div>
				<div><strong>Scheduling:</strong> {course.schedulingModel === 'fixed_schedule' ? 'Fixed Schedule' : 'Flexible Appointments'}</div>
			</div>
		</div>

		<div class="card">
			<h2>Actions</h2>
			<div style="display: flex; flex-direction: column; gap: 0.5rem;">
				{#if !isInstructor}
					{#if isEnrolled}
						<span class="badge success">Enrolled</span>
						<form method="POST" action="?/withdraw" use:enhance>
							<button type="submit" onclick={(e) => {
								if (!confirm('Withdraw from this course?')) e.preventDefault();
							}}>Withdraw</button>
						</form>
					{:else if activeEnrollments.length < course.capacity}
						<form method="POST" action="?/enroll" use:enhance>
							<button type="submit" class="primary">Enroll</button>
						</form>
					{:else}
						<button disabled>Course Full</button>
					{/if}
				{/if}
				{#if isInstructor}
					{#if course.status === 'draft'}
						<button class="primary">Publish Course</button>
					{/if}
					<button>Edit Course</button>
				{/if}
			</div>
			{#if form?.message}
				<div style="margin-top: 1rem; padding: 0.75rem; background: var(--color-success); color: white; border-radius: 4px; font-size: 0.875rem;">
					{form.message}
				</div>
			{/if}
		</div>
	</div>
</div>
