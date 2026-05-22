# Library Service Integration Examples

Code examples for integrating the Library service into other BFS apps.

## Setup

First, copy the client library to your app:

```bash
# From your app directory (e.g., apps/mail)
cp ../library/src/lib/client.ts src/lib/library-client.ts
```

Or create a shared package:

```bash
# packages/library-client/index.ts
export * from './client.js';
```

---

## Example 1: Mail App - Attach File from Library

Allow users to attach files from their library when composing a message.

### Frontend: File Picker Component

```svelte
<!-- apps/mail/src/lib/components/LibraryFilePicker.svelte -->
<script lang="ts">
	import { onMount } from 'svelte';
	
	interface Props {
		onSelect: (file: FileMetadata) => void;
	}
	
	let { onSelect }: Props = $props();
	
	let files = $state<FileMetadata[]>([]);
	let loading = $state(true);
	let selectedBucket = $state('');
	let buckets = $state<Bucket[]>([]);
	
	onMount(async () => {
		// Fetch user's buckets and files
		const bucketsRes = await fetch('/api/library/buckets');
		const bucketsData = await bucketsRes.json();
		buckets = bucketsData.buckets;
		
		if (buckets.length > 0) {
			selectedBucket = buckets[0].bucket_key;
			await loadFiles(selectedBucket);
		}
		loading = false;
	});
	
	async function loadFiles(bucketKey: string) {
		const res = await fetch(`/api/library/buckets/${bucketKey}/files`);
		const data = await res.json();
		files = data.files;
	}
	
	async function handleBucketChange(event: Event) {
		const target = event.target as HTMLSelectElement;
		selectedBucket = target.value;
		await loadFiles(selectedBucket);
	}
</script>

<div class="library-picker">
	<h3 class="t-label">Attach from Library</h3>
	
	{#if loading}
		<p>Loading files...</p>
	{:else}
		<label>
			Bucket:
			<select value={selectedBucket} onchange={handleBucketChange}>
				{#each buckets as bucket}
					<option value={bucket.bucket_key}>{bucket.name}</option>
				{/each}
			</select>
		</label>
		
		<div class="file-list">
			{#each files as file}
				<button
					class="file-item"
					onclick={() => onSelect(file)}
				>
					<span>{file.filename}</span>
					<span class="t-numeric">{formatBytes(file.size_bytes)}</span>
				</button>
			{/each}
		</div>
	{/if}
</div>

<style>
	.library-picker {
		border: 1px solid var(--border);
		padding: 1rem;
		margin: 1rem 0;
	}
	
	.file-list {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		margin-top: 1rem;
	}
	
	.file-item {
		display: flex;
		justify-content: space-between;
		padding: 0.5rem;
		border: 1px solid var(--border);
		background: var(--paper);
		cursor: pointer;
	}
	
	.file-item:hover {
		background: var(--tint-gold);
	}
</style>
```

### Backend: Proxy Endpoints

```typescript
// apps/mail/src/routes/api/library/buckets/+server.ts
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';

export const GET: RequestHandler = async ({ fetch }) => {
	// Forward to library service with user's JWT
	const response = await fetch('http://localhost:5177/api/buckets');
	
	if (!response.ok) {
		return json({ error: 'Failed to fetch buckets' }, { status: response.status });
	}
	
	return json(await response.json());
};
```

```typescript
// apps/mail/src/routes/api/library/buckets/[bucket_key]/files/+server.ts
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';

export const GET: RequestHandler = async ({ fetch, params }) => {
	const { bucket_key } = params;
	
	const response = await fetch(`http://localhost:5177/api/buckets/${bucket_key}/files`);
	
	if (!response.ok) {
		return json({ error: 'Failed to fetch files' }, { status: response.status });
	}
	
	return json(await response.json());
};
```

### Backend: Download and Embed File

```typescript
// apps/mail/src/routes/compose/+page.server.ts
import { LibraryClient } from '$lib/library-client.js';
import type { Actions } from './$types.js';

export const actions = {
	compose: async ({ request, locals, fetch }) => {
		const session = locals.session;
		if (!session) {
			return { error: 'Not authenticated' };
		}
		
		const data = await request.formData();
		const recipientUuid = data.get('recipient');
		const subject = data.get('subject');
		const body = data.get('body');
		const attachedFileId = data.get('attached_file_id');
		
		let attachmentData = null;
		
		// If user selected file from library, download it
		if (attachedFileId) {
			const client = new LibraryClient(
				session.jwt_token,
				'http://localhost:5177'
			);
			
			const file = await client.downloadFile(Number(attachedFileId));
			
			// Embed file data in message
			attachmentData = {
				filename: file.filename,
				content_type: file.contentType,
				data: Buffer.from(file.data).toString('base64')
			};
		}
		
		// Create message with attachment
		await createMessage({
			sender_uuid: session.acting_as_uuid,
			recipient_uuid: recipientUuid,
			subject,
			body,
			attachment: attachmentData
		});
		
		return { success: true };
	}
} satisfies Actions;
```

---

## Example 2: Mail App - Save Attachment to Library

Allow recipients to save attachments to their library.

### Frontend: Save Button

```svelte
<!-- apps/mail/src/routes/messages/[id]/+page.svelte -->
<script lang="ts">
	let { data } = $props();
	let message = data.message;
	let saving = $state(false);
	
	async function saveToLibrary() {
		saving = true;
		
		const res = await fetch(`/api/messages/${message.id}/save-attachment`, {
			method: 'POST'
		});
		
		if (res.ok) {
			alert('Saved to your library!');
		} else {
			alert('Failed to save file');
		}
		
		saving = false;
	}
</script>

{#if message.attachment}
	<div class="attachment">
		<h4>Attachment</h4>
		<p>{message.attachment.filename} ({formatBytes(message.attachment.size)})</p>
		
		<div class="actions">
			<a href="/api/messages/{message.id}/download" download>Download</a>
			<button onclick={saveToLibrary} disabled={saving}>
				{saving ? 'Saving...' : 'Save to Library'}
			</button>
		</div>
	</div>
{/if}
```

### Backend: Save Attachment Action

```typescript
// apps/mail/src/routes/api/messages/[id]/save-attachment/+server.ts
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { LibraryClient } from '$lib/library-client.js';
import { getMessage } from '$lib/server/messages.js';

export const POST: RequestHandler = async ({ params, locals }) => {
	const session = locals.session;
	if (!session) {
		return json({ error: 'Not authenticated' }, { status: 401 });
	}
	
	const messageId = Number(params.id);
	const message = getMessage(messageId);
	
	if (!message || message.recipient_uuid !== session.acting_as_uuid) {
		return json({ error: 'Not authorized' }, { status: 403 });
	}
	
	if (!message.attachment) {
		return json({ error: 'No attachment' }, { status: 400 });
	}
	
	try {
		// Upload attachment to recipient's library bucket
		const client = new LibraryClient(
			session.jwt_token,
			'http://localhost:5177'
		);
		
		const fileData = Buffer.from(message.attachment.data, 'base64');
		const bucketKey = `user-${session.acting_as_uuid}`;
		
		const fileMetadata = await client.uploadFile(
			fileData,
			message.attachment.filename,
			bucketKey
		);
		
		return json({ success: true, file: fileMetadata });
	} catch (err: any) {
		console.error('Failed to save attachment:', err);
		return json({ error: 'Failed to save file' }, { status: 500 });
	}
};
```

---

## Example 3: Governance App - Upload Motion Document

Allow users to upload supporting documents when creating motions.

### Frontend: Document Upload

```svelte
<!-- apps/governance/src/routes/associations/[handle]/motions/new/+page.svelte -->
<script lang="ts">
	import { enhance } from '$app/forms';
	
	let uploading = $state(false);
</script>

<form method="POST" use:enhance={() => {
	uploading = true;
	return async ({ update }) => {
		await update();
		uploading = false;
	};
}}>
	<label class="t-label">
		Title
		<input type="text" name="title" required />
	</label>
	
	<label class="t-label">
		Description
		<textarea name="description" required></textarea>
	</label>
	
	<label class="t-label">
		Supporting Document (optional)
		<input type="file" name="document" />
	</label>
	
	<button type="submit" class="btn btn--primary" disabled={uploading}>
		{uploading ? 'Creating...' : 'Create Motion'}
	</button>
</form>
```

### Backend: Upload Document to Association Bucket

```typescript
// apps/governance/src/routes/associations/[handle]/motions/new/+page.server.ts
import { LibraryClient } from '$lib/library-client.js';
import type { Actions } from './$types.js';
import { createMotion } from '$lib/server/motions.js';

export const actions = {
	default: async ({ request, params, locals }) => {
		const session = locals.session;
		if (!session) {
			return { error: 'Not authenticated' };
		}
		
		const { handle } = params;
		const data = await request.formData();
		const title = data.get('title') as string;
		const description = data.get('description') as string;
		const documentFile = data.get('document') as File;
		
		let documentFileId: number | null = null;
		
		// Upload document to association's library bucket if provided
		if (documentFile && documentFile.size > 0) {
			const client = new LibraryClient(
				session.jwt_token,
				'http://localhost:5177'
			);
			
			const bucketKey = `association-${handle}`;
			const fileBuffer = Buffer.from(await documentFile.arrayBuffer());
			
			const fileMetadata = await client.uploadFile(
				fileBuffer,
				documentFile.name,
				bucketKey
			);
			
			documentFileId = fileMetadata.id;
		}
		
		// Create motion with document reference
		const motion = await createMotion({
			association_handle: handle,
			title,
			description,
			document_file_id: documentFileId,
			created_by: session.acting_as_uuid
		});
		
		return { success: true, motion };
	}
} satisfies Actions;
```

### Display Document Link

```svelte
<!-- apps/governance/src/routes/associations/[handle]/motions/[id]/+page.svelte -->
<script lang="ts">
	let { data } = $props();
	let motion = data.motion;
</script>

<h1 class="t-display">{motion.title}</h1>
<p class="t-prose">{motion.description}</p>

{#if motion.document_file_id}
	<div class="document">
		<h3 class="t-label">Supporting Document</h3>
		<a 
			href="http://localhost:5177/api/files/{motion.document_file_id}"
			target="_blank"
			class="btn btn--secondary"
		>
			View Document
		</a>
	</div>
{/if}
```

---

## Example 4: Marketplace App - Product Images

Allow vendors to upload product images.

### Backend: Upload Product Image

```typescript
// apps/marketplace/src/routes/products/new/+page.server.ts
import { LibraryClient } from '$lib/library-client.js';
import { uploadToUserBucket } from '$lib/library-client.js';
import type { Actions } from './$types.js';

export const actions = {
	default: async ({ request, locals }) => {
		const session = locals.session;
		if (!session) {
			return { error: 'Not authenticated' };
		}
		
		const data = await request.formData();
		const name = data.get('name') as string;
		const description = data.get('description') as string;
		const price = Number(data.get('price'));
		const imageFile = data.get('image') as File;
		
		let imageFileId: number | null = null;
		
		// Upload product image to vendor's library bucket
		if (imageFile && imageFile.size > 0) {
			const imageBuffer = Buffer.from(await imageFile.arrayBuffer());
			
			const fileMetadata = await uploadToUserBucket(
				session.jwt_token,
				session.acting_as_uuid,
				imageBuffer,
				imageFile.name,
				'http://localhost:5177'
			);
			
			imageFileId = fileMetadata.id;
		}
		
		// Create product with image reference
		const product = await createProduct({
			name,
			description,
			price,
			image_file_id: imageFileId,
			vendor_uuid: session.acting_as_uuid
		});
		
		return { success: true, product };
	}
} satisfies Actions;
```

---

## Environment Configuration

Add library service URL to your app's environment:

```typescript
// apps/mail/.env
LIBRARY_SERVICE_URL=http://localhost:5177

// Production
LIBRARY_SERVICE_URL=https://library.bfs.society
```

Use in code:

```typescript
import { env } from '$env/dynamic/private';

const client = new LibraryClient(
	session.jwt_token,
	env.LIBRARY_SERVICE_URL || 'http://localhost:5177'
);
```

---

## Error Handling

Always wrap library API calls in try-catch:

```typescript
try {
	const file = await client.uploadFile(data, filename, bucketKey);
	return { success: true, file };
} catch (err: any) {
	console.error('Library upload failed:', err);
	return { error: 'Failed to upload file. Please try again.' };
}
```

---

## Performance Tips

1. **Avoid downloading large files unnecessarily**: Check file size before downloading
2. **Stream large uploads**: For files > 10MB, consider chunked uploads
3. **Cache file metadata**: Store file IDs in your database instead of re-querying
4. **Use appropriate timeouts**: Set fetch timeouts for large file operations
5. **Validate file types**: Check MIME types before accepting uploads

---

## Security Checklist

- ✅ Always pass user's JWT token for authentication
- ✅ Validate user has permission to access bucket
- ✅ Sanitize filenames before displaying
- ✅ Check file size limits before upload
- ✅ Validate file types (MIME type whitelist)
- ✅ Use HTTPS in production
- ✅ Don't expose library file IDs to unauthorized users
- ✅ Log all file access for audit trail
