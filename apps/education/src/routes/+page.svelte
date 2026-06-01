<script lang="ts">
	import { PLATFORM_NAME } from '@bfs/types';
</script>

<svelte:head>
	<title>Education - {PLATFORM_NAME}</title>
</svelte:head>

<h1>Education Dashboard</h1>

<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1.5rem; margin-top: 2rem;">
	<div class="card">
		<h3>Browse Courses</h3>
		<p>Explore available courses in your community.</p>
		<a href="/courses"><button class="primary">View Courses</button></a>
	</div>

	<div class="card">
		<h3>My Courses</h3>
		<p>View courses you're currently enrolled in.</p>
		<a href="/my-courses"><button class="primary">My Enrollments</button></a>
	</div>

	<div class="card">
		<h3>Teaching</h3>
		<p>Manage courses you're teaching.</p>
		<a href="/teaching"><button class="primary">My Teaching</button></a>
	</div>

	<div class="card">
		<h3>Credentials</h3>
		<p>View your completed courses and credentials.</p>
		<a href="/credentials"><button class="primary">View Credentials</button></a>
	</div>
</div>
