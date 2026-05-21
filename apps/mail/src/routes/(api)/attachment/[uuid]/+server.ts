import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { getAttachment, readAttachment, canAccessAttachment } from '$lib/server/attachments.js';

export const GET: RequestHandler = async ({ locals, params }) => {
	const session = locals.session;
	if (!session) {
		error(401, 'Not authenticated');
	}

	const uuid = params.uuid;
	const attachment = getAttachment(uuid);

	if (!attachment) {
		error(404, 'Attachment not found');
	}

	// Check access permissions
	if (!canAccessAttachment(uuid, session.acting_as_uuid)) {
		error(403, 'Access denied');
	}

	const data = await readAttachment(uuid);
	if (!data) {
		error(404, 'Attachment file not found');
	}

	return new Response(data, {
		headers: {
			'Content-Type': attachment.content_type,
			'Content-Disposition': `attachment; filename="${attachment.filename}"`,
			'Content-Length': String(attachment.size_bytes),
		},
	});
};
