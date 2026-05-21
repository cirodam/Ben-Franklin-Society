import { randomUUID } from 'node:crypto';
import { db } from './db.js';

export interface ContactGroup {
	uuid: string;
	mailbox_uuid: string;
	name: string;
	created_at: string;
}

export interface ContactGroupMember {
	group_uuid: string;
	owner_uuid: string;
	handle_cache: string;
}

export interface ContactGroupWithMembers extends ContactGroup {
	members: ContactGroupMember[];
}

export function getContactGroups(mailbox_uuid: string): ContactGroupWithMembers[] {
	const groups = db
		.prepare('SELECT * FROM contact_group WHERE mailbox_uuid = ? ORDER BY name ASC')
		.all(mailbox_uuid) as ContactGroup[];

	return groups.map((group) => ({
		...group,
		members: getGroupMembers(group.uuid),
	}));
}

export function getContactGroup(uuid: string, mailbox_uuid: string): ContactGroupWithMembers | null {
	const group = db
		.prepare('SELECT * FROM contact_group WHERE uuid = ? AND mailbox_uuid = ?')
		.get(uuid, mailbox_uuid) as ContactGroup | null;

	if (!group) return null;

	return {
		...group,
		members: getGroupMembers(uuid),
	};
}

export function getGroupMembers(group_uuid: string): ContactGroupMember[] {
	return db
		.prepare('SELECT * FROM contact_group_member WHERE group_uuid = ? ORDER BY handle_cache ASC')
		.all(group_uuid) as ContactGroupMember[];
}

export function createContactGroup(params: {
	mailbox_uuid: string;
	name: string;
	members: Array<{ owner_uuid: string; handle_cache: string }>;
}): ContactGroupWithMembers {
	const uuid = randomUUID();
	const created_at = new Date().toISOString();

	db.transaction(() => {
		db.prepare(
			`INSERT INTO contact_group (uuid, mailbox_uuid, name, created_at)
       VALUES (?, ?, ?, ?)`
		).run(uuid, params.mailbox_uuid, params.name, created_at);

		for (const member of params.members) {
			db.prepare(
				`INSERT INTO contact_group_member (group_uuid, owner_uuid, handle_cache)
         VALUES (?, ?, ?)`
			).run(uuid, member.owner_uuid, member.handle_cache);
		}
	})();

	return getContactGroup(uuid, params.mailbox_uuid)!;
}

export function updateContactGroup(params: {
	uuid: string;
	mailbox_uuid: string;
	name: string;
	members: Array<{ owner_uuid: string; handle_cache: string }>;
}): void {
	db.transaction(() => {
		db.prepare(
			`UPDATE contact_group 
       SET name = ? 
       WHERE uuid = ? AND mailbox_uuid = ?`
		).run(params.name, params.uuid, params.mailbox_uuid);

		// Remove all existing members
		db.prepare('DELETE FROM contact_group_member WHERE group_uuid = ?').run(params.uuid);

		// Add new members
		for (const member of params.members) {
			db.prepare(
				`INSERT INTO contact_group_member (group_uuid, owner_uuid, handle_cache)
         VALUES (?, ?, ?)`
			).run(params.uuid, member.owner_uuid, member.handle_cache);
		}
	})();
}

export function deleteContactGroup(uuid: string, mailbox_uuid: string): void {
	// contact_group_member will be cascade deleted
	db.prepare('DELETE FROM contact_group WHERE uuid = ? AND mailbox_uuid = ?').run(
		uuid,
		mailbox_uuid
	);
}

// Helper to expand group names in recipient strings
export function expandGroupsInHandles(
	handles: string[],
	mailbox_uuid: string
): Array<{ owner_uuid: string; handle_cache: string; from_group?: string }> {
	const result: Array<{ owner_uuid: string; handle_cache: string; from_group?: string }> = [];
	const groups = getContactGroups(mailbox_uuid);

	for (const handle of handles) {
		// Check if it's a group name (without @ prefix)
		const groupName = handle.startsWith('@') ? handle.slice(1) : handle;
		const group = groups.find((g) => g.name.toLowerCase() === groupName.toLowerCase());

		if (group) {
			// Expand group to members
			for (const member of group.members) {
				result.push({
					owner_uuid: member.owner_uuid,
					handle_cache: member.handle_cache,
					from_group: group.name,
				});
			}
		} else {
			// Not a group, treat as individual handle
			// The calling code will resolve this handle
		}
	}

	return result;
}
