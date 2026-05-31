import { db } from '../../db.js';

export interface Context {
	uuid: string;
	type: 'person' | 'association';
	label: string;
}

/**
 * Get all contexts (identities) a person can switch to.
 * Always includes themselves, plus any associations where they have act_as permission.
 */
export function getAvailableContexts(personUuid: string): Context[] {
	// Get person's name for personal context
	const person = db
		.prepare('SELECT given_name, family_name FROM person WHERE uuid = ?')
		.get(personUuid) as { given_name: string; family_name: string } | undefined;
	
	if (!person) return [];

	const contexts: Context[] = [
		{
			uuid: personUuid,
			type: 'person',
			label: `${person.given_name} ${person.family_name} (personal)`
		}
	];

	// Get associations where they have act_as permission
	const associations = db.prepare(`
		SELECT DISTINCT 
			a.uuid,
			a.name,
			r.title as role_title
		FROM association a
		JOIN role r ON r.association_uuid = a.uuid
		JOIN role_assignment ra ON ra.role_uuid = r.uuid
		JOIN role_permission rp ON rp.role_uuid = r.uuid
		WHERE ra.person_uuid = ?
			AND ra.removed_at IS NULL
			AND rp.app = 'governance'
			AND rp.permission = 'act_as'
		ORDER BY a.name
	`).all(personUuid) as Array<{
		uuid: string;
		name: string;
		role_title: string;
	}>;

	for (const assoc of associations) {
		contexts.push({
			uuid: assoc.uuid,
			type: 'association',
			label: `${assoc.name} (${assoc.role_title})`
		});
	}

	return contexts;
}

export function updateActingAs(sessionUuid: string, actingAsUuid: string): void {
	db.prepare('UPDATE session SET acting_as_uuid = ? WHERE uuid = ?').run(
		actingAsUuid,
		sessionUuid
	);
}
