// ============================================================================
// Org Chart Templates
// ============================================================================
// Functions for applying org chart documents to associations

import { db } from '../db.js';
import { loadOrgChartDocument } from '../documents/library.js';
import type { OrgChartContent } from '../documents/library-types.js';
import type { OrgSection, RoleTemplate, Role } from './types.js';
import { createOrgSection } from './org-sections.js';
import { createRoleTemplate, setRoleTemplatePermissions } from './role-templates.js';
import { createRole } from './roles.js';

/**
 * Apply an org chart template from the library to an association.
 * This will create sections, role templates, and roles based on the template.
 * 
 * @param associationUuid - The association to apply the template to
 * @param orgChartSlug - The slug of the org chart document in the library
 * @returns Object containing created sections, templates, and roles with ID mappings
 */
export function applyOrgChartTemplate(
	associationUuid: string,
	orgChartSlug: string
): {
	sections: Map<string, OrgSection>;
	templates: Map<string, RoleTemplate>;
	roles: Map<string, Role>;
} | null {
	// Load the org chart document from the library
	const orgChartDoc = loadOrgChartDocument(orgChartSlug);
	if (!orgChartDoc) {
		console.error(`Org chart document ${orgChartSlug} not found`);
		return null;
	}

	const content = orgChartDoc.content as OrgChartContent;

	// Track mappings from template IDs to created UUIDs
	const sectionMap = new Map<string, OrgSection>();
	const templateMap = new Map<string, RoleTemplate>();
	const roleMap = new Map<string, Role>();

	db.transaction(() => {
		// Step 1: Create sections (must handle parent relationships)
		// First pass: create all sections without parent relationships
		for (const section of content.sections) {
			const created = createOrgSection({
				association_uuid: associationUuid,
				name: section.name,
				description: section.description ?? null,
				parent_section_uuid: null // Will be set in second pass
			});
			sectionMap.set(section.id, created);
		}

		// Second pass: update parent relationships
		for (const section of content.sections) {
			if (section.parent_section_id) {
				const created = sectionMap.get(section.id)!;
				const parentSection = sectionMap.get(section.parent_section_id);
				if (parentSection) {
					db.prepare('UPDATE org_section SET parent_section_uuid = ? WHERE uuid = ?')
						.run(parentSection.uuid, created.uuid);
				}
			}
		}

		// Step 2: Create role templates
		for (const template of content.templates) {
			const created = createRoleTemplate({
				association_uuid: associationUuid,
				template_key: template.template_key,
				title: template.title,
				description: null,
				compensation_franks: template.compensation_franks ?? 0
			});
			templateMap.set(template.id, created);

			// Set template permissions if any
			if (template.permissions && template.permissions.length > 0) {
				setRoleTemplatePermissions(
					created.uuid,
					template.permissions.map(p => ({
						app: p.app,
						permission: p.permission
					}))
				);
			}
		}

		// Step 3: Create roles (must handle reports_to relationships)
		// First pass: create all roles without reporting relationships
		for (const role of content.roles) {
			const sectionUuid = role.section_id ? sectionMap.get(role.section_id)?.uuid : null;
			const templateUuid = role.template_id ? templateMap.get(role.template_id)?.uuid : null;

			const created = createRole({
				association_uuid: associationUuid,
				title: role.title,
				section_uuid: sectionUuid ?? null,
				template_uuid: templateUuid ?? null,
				description: null,
				compensation_franks: role.compensation_franks ?? 0,
				reports_to_role_uuid: null // Will be set in second pass
			});
			roleMap.set(role.id, created);
		}

		// Second pass: update reporting relationships
		for (const role of content.roles) {
			if (role.reports_to_role_id) {
				const created = roleMap.get(role.id)!;
				const reportsToRole = roleMap.get(role.reports_to_role_id);
				if (reportsToRole) {
					db.prepare('UPDATE role SET reports_to_role_uuid = ? WHERE uuid = ?')
						.run(reportsToRole.uuid, created.uuid);
				}
			}
		}

		// Step 4: Update the association to reference this org chart
		db.prepare('UPDATE association SET org_chart_slug = ? WHERE uuid = ?')
			.run(orgChartSlug, associationUuid);
	})();

	return {
		sections: sectionMap,
		templates: templateMap,
		roles: roleMap
	};
}
