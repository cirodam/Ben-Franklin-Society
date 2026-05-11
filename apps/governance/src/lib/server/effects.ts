import { randomUUID } from 'node:crypto';
import { db } from './db.js';
import { getEffects, markEffectExecuted, markEffectFailed } from './motions.js';

// ---------------------------------------------------------------------------
// Payload shapes — one interface per effect type
// ---------------------------------------------------------------------------

interface CreateAssociationPayload {
	handle: string;
	name: string;
	type: 'association' | 'service' | 'college' | 'committee' | 'general_assembly' | 'central_bank' | 'social_insurance_fund' | 'community_bank';
}

interface DissolveAssociationPayload {
	association_uuid: string;
}

interface AddMemberPayload {
	association_uuid: string;
	person_uuid: string;
}

interface RemoveMemberPayload {
	association_uuid: string;
	person_uuid: string;
}

interface CreateRolePayload {
	association_uuid: string;
	name: string;
}

interface SetRolePermissionsPayload {
	role_uuid: string;
	permissions: Array<{ app: string; permission: string }>;
}

interface AssignRolePayload {
	person_uuid: string;
	role_uuid: string;
	association_uuid: string;
}

interface RemoveRolePayload {
	person_uuid: string;
	role_uuid: string;
}

interface CreateDocumentPayload {
	title: string;
	slug: string;
	owner_uuid?: string;
}

interface AddArticlePayload {
	document_uuid: string;
	number: number;
	title: string;
}

interface AddSectionPayload {
	article_uuid: string;
	number: number;
	prose: string;
	rationale: string;
}

interface AmendSectionPayload {
	section_uuid: string;
	prose: string;
	rationale: string;
}

interface SetConfigPayload {
	key: string;
	value: string;
	description?: string;
}

interface CreateCalendarEventPayload {
	title: string;
	description?: string;
	organizer_uuid: string;
	starts_at: string;
	ends_at?: string;
	location?: string;
}

// ---------------------------------------------------------------------------
// Handler map
// ---------------------------------------------------------------------------

function now(): string {
	return new Date().toISOString();
}

type Handler = (payload: unknown, motionUuid: string) => void;

const handlers: Record<string, Handler> = {
	create_association(payload, motionUuid) {
		const p = payload as CreateAssociationPayload;
		const handleTaken =
			db.prepare('SELECT 1 FROM person WHERE handle = ?').get(p.handle) ??
			db.prepare('SELECT 1 FROM association WHERE handle = ?').get(p.handle);
		if (handleTaken) throw new Error(`Handle already taken: ${p.handle}`);
		db.prepare(
			`INSERT INTO association (uuid, handle, name, type, status, established_by_motion_uuid, created_at)
			 VALUES (?, ?, ?, ?, 'active', ?, ?)`
		).run(randomUUID(), p.handle, p.name, p.type, motionUuid, now());
	},

	dissolve_association(payload) {
		const p = payload as DissolveAssociationPayload;
		db.prepare(
			"UPDATE association SET status = 'dissolved', dissolved_at = ? WHERE uuid = ?"
		).run(now(), p.association_uuid);
	},

	add_member(payload) {
		const p = payload as AddMemberPayload;
		const existing = db
			.prepare(
				'SELECT removed_at FROM association_member WHERE association_uuid = ? AND person_uuid = ?'
			)
			.get(p.association_uuid, p.person_uuid) as { removed_at: string | null } | undefined;
		if (existing) {
			if (existing.removed_at === null) return;
			db.prepare(
				'UPDATE association_member SET joined_at = ?, removed_at = NULL WHERE association_uuid = ? AND person_uuid = ?'
			).run(now(), p.association_uuid, p.person_uuid);
		} else {
			db.prepare(
				'INSERT INTO association_member (association_uuid, person_uuid, joined_at) VALUES (?, ?, ?)'
			).run(p.association_uuid, p.person_uuid, now());
		}
	},

	remove_member(payload) {
		const p = payload as RemoveMemberPayload;
		const t = now();
		db.prepare(
			'UPDATE association_member SET removed_at = ? WHERE association_uuid = ? AND person_uuid = ? AND removed_at IS NULL'
		).run(t, p.association_uuid, p.person_uuid);
		db.prepare(
			'UPDATE person_role SET removed_at = ? WHERE association_uuid = ? AND person_uuid = ? AND removed_at IS NULL'
		).run(t, p.association_uuid, p.person_uuid);
	},

	create_role(payload) {
		const p = payload as CreateRolePayload;
		db.prepare(
			'INSERT INTO role (uuid, association_uuid, name, created_at) VALUES (?, ?, ?, ?)'
		).run(randomUUID(), p.association_uuid, p.name, now());
	},

	set_role_permissions(payload) {
		const p = payload as SetRolePermissionsPayload;
		db.prepare('DELETE FROM role_permission WHERE role_uuid = ?').run(p.role_uuid);
		const insert = db.prepare(
			'INSERT INTO role_permission (role_uuid, app, permission) VALUES (?, ?, ?)'
		);
		for (const perm of p.permissions) {
			insert.run(p.role_uuid, perm.app, perm.permission);
		}
	},

	assign_role(payload) {
		const p = payload as AssignRolePayload;
		const existing = db
			.prepare('SELECT removed_at FROM person_role WHERE person_uuid = ? AND role_uuid = ?')
			.get(p.person_uuid, p.role_uuid) as { removed_at: string | null } | undefined;
		if (existing) {
			if (existing.removed_at === null) return;
			db.prepare(
				'UPDATE person_role SET assigned_at = ?, removed_at = NULL WHERE person_uuid = ? AND role_uuid = ?'
			).run(now(), p.person_uuid, p.role_uuid);
		} else {
			db.prepare(
				'INSERT INTO person_role (person_uuid, role_uuid, association_uuid, assigned_at) VALUES (?, ?, ?, ?)'
			).run(p.person_uuid, p.role_uuid, p.association_uuid, now());
		}
	},

	remove_role(payload) {
		const p = payload as RemoveRolePayload;
		db.prepare(
			'UPDATE person_role SET removed_at = ? WHERE person_uuid = ? AND role_uuid = ? AND removed_at IS NULL'
		).run(now(), p.person_uuid, p.role_uuid);
	},

	create_document(payload, motionUuid) {
		const p = payload as CreateDocumentPayload;
		db.prepare(
			`INSERT INTO document (uuid, title, slug, owner_uuid, status, created_at, created_by_motion_uuid)
			 VALUES (?, ?, ?, ?, 'active', ?, ?)`
		).run(randomUUID(), p.title, p.slug, p.owner_uuid ?? null, now(), motionUuid);
	},

	add_article(payload) {
		const p = payload as AddArticlePayload;
		db.prepare(
			'INSERT INTO article (uuid, document_uuid, number, title) VALUES (?, ?, ?, ?)'
		).run(randomUUID(), p.document_uuid, p.number, p.title);
	},

	add_section(payload) {
		const p = payload as AddSectionPayload;
		db.prepare(
			`INSERT INTO section (uuid, article_uuid, number, prose, rationale, version)
			 VALUES (?, ?, ?, ?, ?, 1)`
		).run(randomUUID(), p.article_uuid, p.number, p.prose, p.rationale);
	},

	amend_section(payload, motionUuid) {
		const p = payload as AmendSectionPayload;
		const current = db
			.prepare('SELECT uuid, prose, rationale, version FROM section WHERE uuid = ?')
			.get(p.section_uuid) as
			| { uuid: string; prose: string; rationale: string; version: number }
			| undefined;
		if (!current) throw new Error(`Section not found: ${p.section_uuid}`);

		// Archive current version
		db.prepare(
			`INSERT INTO section_history (uuid, section_uuid, version, prose, rationale, amended_by_motion_uuid, recorded_at)
			 VALUES (?, ?, ?, ?, ?, ?, ?)`
		).run(
			randomUUID(),
			current.uuid,
			current.version,
			current.prose,
			current.rationale,
			motionUuid,
			now()
		);

		// Update to new version
		db.prepare(
			`UPDATE section SET prose = ?, rationale = ?, version = version + 1, amended_by_motion_uuid = ?
			 WHERE uuid = ?`
		).run(p.prose, p.rationale, motionUuid, p.section_uuid);
	},

	set_config(payload, motionUuid) {
		const p = payload as SetConfigPayload;
		const existing = db
			.prepare('SELECT key, value FROM community_config WHERE key = ?')
			.get(p.key) as { key: string; value: string } | undefined;

		const t = now();

		if (existing) {
			// Archive the old value
			db.prepare(
				`INSERT INTO community_config_history (uuid, key, value, updated_by_motion_uuid, superseded_at)
				 VALUES (?, ?, ?, ?, ?)`
			).run(randomUUID(), existing.key, existing.value, motionUuid, t);

			db.prepare(
				'UPDATE community_config SET value = ?, updated_by_motion_uuid = ?, updated_at = ? WHERE key = ?'
			).run(p.value, motionUuid, t, p.key);
		} else {
			db.prepare(
				`INSERT INTO community_config (key, value, description, updated_by_motion_uuid, updated_at)
				 VALUES (?, ?, ?, ?, ?)`
			).run(p.key, p.value, p.description ?? '', motionUuid, t);
		}
	},

	create_calendar_event(payload, motionUuid) {
		const p = payload as CreateCalendarEventPayload;
		db.prepare(
			`INSERT INTO calendar_event
			   (uuid, title, description, organizer_uuid, starts_at, ends_at, location, created_by_motion_uuid, created_at)
			 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
		).run(
			randomUUID(),
			p.title,
			p.description ?? null,
			p.organizer_uuid,
			p.starts_at,
			p.ends_at ?? null,
			p.location ?? null,
			motionUuid,
			now()
		);
	},
};

// ---------------------------------------------------------------------------
// Public executor
// ---------------------------------------------------------------------------

// Run all effects for an enacted motion atomically.
// All effects succeed or none do. Throws if any effect fails.
export function executeEffects(motionUuid: string): void {
	const effects = getEffects(motionUuid);
	if (effects.length === 0) return;

	db.transaction(() => {
		for (const effect of effects) {
			if (effect.executed_at !== null) continue; // already ran (idempotent retry)

			let payload: unknown;
			try {
				payload = JSON.parse(effect.payload);
			} catch {
				const msg = 'Invalid JSON in effect payload';
				markEffectFailed(effect.uuid, msg);
				throw new Error(`Effect ${effect.uuid} (seq ${effect.seq}): ${msg}`);
			}

			const handler = handlers[effect.type];
			if (!handler) {
				const msg = `Unknown effect type: ${effect.type}`;
				markEffectFailed(effect.uuid, msg);
				throw new Error(`Effect ${effect.uuid} (seq ${effect.seq}): ${msg}`);
			}

			try {
				handler(payload, motionUuid);
				markEffectExecuted(effect.uuid);
			} catch (err) {
				const msg = err instanceof Error ? err.message : String(err);
				markEffectFailed(effect.uuid, msg);
				throw new Error(`Effect ${effect.uuid} (seq ${effect.seq}, type ${effect.type}): ${msg}`);
			}
		}
	})();
}

