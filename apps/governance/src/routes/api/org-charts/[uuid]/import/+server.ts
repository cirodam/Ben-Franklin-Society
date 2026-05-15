import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import {
	getAssociationByUuid,
	createOrgSection,
	createRoleTemplate,
	setRoleTemplatePermissions,
	createRole,
} from '$lib/server/associations.js';

export const POST: RequestHandler = async ({ params, request }) => {
	const association = getAssociationByUuid(params.uuid);
	if (!association) {
		return json({ error: 'Association not found' }, { status: 404 });
	}

	try {
		const data = await request.json();

		// Validate version
		if (data.version !== '1.0') {
			return json({ error: 'Unsupported format version' }, { status: 400 });
		}

		// Maps for tracking created entities (string ID -> new UUID)
		const sectionMap = new Map<string, string>();
		const templateMap = new Map<string, string>();
		const roleMap = new Map<string, string>();

		// Import sections first
		if (data.sections && Array.isArray(data.sections)) {
			// First pass: create all sections without parent relationships
			for (const section of data.sections) {
				const newSection = createOrgSection({
					association_uuid: params.uuid,
					name: section.name,
					description: section.description || null,
					parent_section_uuid: null, // Will update in second pass
				});
				sectionMap.set(section.id, newSection.uuid);
			}

			// Second pass: update parent relationships
			// (This would require an updateOrgSection function - skipping for now)
		}

		// Import templates
		if (data.templates && Array.isArray(data.templates)) {
			for (const template of data.templates) {
				const newTemplate = createRoleTemplate({
					association_uuid: params.uuid,
					template_key: template.template_key,
					title: template.title,
					description: template.description || null,
					compensation_franks: template.compensation_franks || 0,
				});
				templateMap.set(template.id, newTemplate.uuid);

				// Set permissions
				if (template.permissions && Array.isArray(template.permissions)) {
					setRoleTemplatePermissions(
						newTemplate.uuid,
						template.permissions.map((p: any) => ({
							app: p.app,
							permission: p.permission,
						}))
					);
				}
			}
		}

		// Import roles
		if (data.roles && Array.isArray(data.roles)) {
			for (const role of data.roles) {
				const section_uuid = role.section_id ? sectionMap.get(role.section_id) || null : null;
				const template_uuid = role.template_id ? templateMap.get(role.template_id) || null : null;
				
				// For now, we create roles without parent relationships
				// A full implementation would need a second pass to set reports_to_role_uuid
				const newRole = createRole({
					association_uuid: params.uuid,
					section_uuid,
					template_uuid,
					title: role.title,
					description: role.description || null,
					compensation_franks: role.compensation_franks || 0,
					reports_to_role_uuid: null, // Would map in second pass
				});
				roleMap.set(role.id, newRole.uuid);

				// Set permissions if not using a template
				// (This would require setRolePermissions function)
			}
		}

		return json({
			success: true,
			imported: {
				sections: sectionMap.size,
				templates: templateMap.size,
				roles: roleMap.size,
			},
		});
	} catch (error) {
		console.error('Import error:', error);
		return json(
			{ error: error instanceof Error ? error.message : 'Import failed' },
			{ status: 500 }
		);
	}
};
