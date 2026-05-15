import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { getRoleTemplatePermissions } from '$lib/server/associations.js';

export const GET: RequestHandler = async ({ params }) => {
	const permissions = getRoleTemplatePermissions(params.uuid);
	return json({ permissions });
};
