import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import {
	getAssociationByUuid,
	getRolesByAssociation,
	getSectionsByAssociation,
	getRoleTemplatesByAssociation,
	getRoleTemplatePermissions,
	getPermissionsForRole,
} from '$lib/server/associations.js';
import { db } from '$lib/server/db.js';

export const GET: RequestHandler = async ({ params }) => {
	const association = getAssociationByUuid(params.uuid);
	if (!association) {
		return json({ error: 'Association not found' }, { status: 404 });
	}

	// Get all org data
	const roles = getRolesByAssociation(params.uuid);
	const sections = getSectionsByAssociation(params.uuid);
	const templates = getRoleTemplatesByAssociation(params.uuid);

	// Transform sections to use id field
	const transformedSections = sections.map((section) => ({
		id: section.uuid,
		name: section.name,
		description: section.description,
		parent_section_id: section.parent_section_uuid,
	}));

	// Transform templates to use id field and add permissions
	const transformedTemplates = templates.map((template) => ({
		id: template.uuid,
		template_key: template.template_key,
		title: template.title,
		description: template.description,
		compensation_franks: template.compensation_franks,
		permissions: getRoleTemplatePermissions(template.uuid),
	}));

	// Transform roles to use id fields, add permissions and assignments
	const transformedRoles = roles.map((role) => {
		const permissions = getPermissionsForRole(role.uuid);
		const assignment = db
			.prepare(
				`SELECT ra.*, p.uuid as person_uuid, p.given_name, p.family_name
				 FROM role_assignment ra
				 JOIN person p ON p.uuid = ra.person_uuid
				 WHERE ra.role_uuid = ? AND ra.removed_at IS NULL`
			)
			.get(role.uuid) as any;
		
		return {
			id: role.uuid,
			title: role.title,
			description: role.description,
			compensation_franks: role.compensation_franks,
			section_id: role.section_uuid,
			template_id: role.template_uuid,
			reports_to_role_id: role.reports_to_role_uuid,
			permissions,
			assignment: assignment ? {
				person_id: assignment.person_uuid,
				person_name: `${assignment.given_name} ${assignment.family_name}`,
				assigned_at: assignment.assigned_at,
			} : null,
		};
	});

	// Build export data
	const exportData = {
		version: '1.0',
		association: {
			handle: association.handle,
			name: association.name,
			type: association.type,
		},
		exported_at: new Date().toISOString(),
		sections: transformedSections,
		templates: transformedTemplates,
		roles: transformedRoles,
	};

	return json(exportData);
};
