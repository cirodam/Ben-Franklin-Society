import { randomInt, randomUUID } from 'node:crypto';
import { db } from './db.js';
import { getSortitionConfig } from './associations.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Sortition {
	uuid: string;
	association_uuid: string;
	motion_uuid: string;
	conducted_at: string;
	pool_size: number;
	notes: string | null;
}

export interface SeatTerm {
	uuid: string;
	association_uuid: string;
	person_uuid: string;
	motion_uuid: string;
	started_at: string;
	ends_at: string;
	vacated_at: string | null;
}

export interface SortitionList {
	uuid: string;
	motion_uuid: string;
	name: string;
	created_at: string;
}

export type ListItemStatus = 'called' | 'unable' | 'seated';

export interface SortitionListItem {
	uuid: string;
	list_uuid: string;
	position: number;
	item_type: string;
	item_data: string; // JSON: { person_uuid: string }
	status: ListItemStatus;
	status_reason: string | null;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function today(): string {
	return new Date().toISOString().slice(0, 10);
}

/** Cryptographically secure Fisher-Yates shuffle. */
function cryptoShuffle<T>(arr: T[]): T[] {
	const a = [...arr];
	for (let i = a.length - 1; i > 0; i--) {
		const j = randomInt(i + 1);
		[a[i], a[j]] = [a[j]!, a[i]!];
	}
	return a;
}

// ---------------------------------------------------------------------------
// Reads
// ---------------------------------------------------------------------------

export function getSortitionByUuid(uuid: string): Sortition | null {
	return (
		(db.prepare('SELECT * FROM sortition WHERE uuid = ?').get(uuid) as Sortition | undefined) ??
		null
	);
}

export function listSortitions(associationUuid: string): Sortition[] {
	return db
		.prepare('SELECT * FROM sortition WHERE association_uuid = ? ORDER BY conducted_at DESC')
		.all(associationUuid) as Sortition[];
}

export function getSeatTermByUuid(uuid: string): SeatTerm | null {
	return (
		(db.prepare('SELECT * FROM seat_term WHERE uuid = ?').get(uuid) as SeatTerm | undefined) ??
		null
	);
}

export function getListByUuid(uuid: string): SortitionList | null {
	return (
		(db.prepare('SELECT * FROM list WHERE uuid = ?').get(uuid) as SortitionList | undefined) ??
		null
	);
}

export function getListByMotionUuid(motionUuid: string): SortitionList | null {
	return (
		(db
			.prepare('SELECT * FROM list WHERE motion_uuid = ?')
			.get(motionUuid) as SortitionList | undefined) ?? null
	);
}

export function getListItems(listUuid: string): SortitionListItem[] {
	return db
		.prepare('SELECT * FROM list_item WHERE list_uuid = ? ORDER BY position')
		.all(listUuid) as SortitionListItem[];
}

/**
 * Returns all currently active seat terms for a body:
 * started, not yet ended, not vacated.
 */
export function getCurrentTermHolders(associationUuid: string): SeatTerm[] {
	const now = today();
	return db
		.prepare(
			`SELECT * FROM seat_term
			 WHERE association_uuid = ?
			   AND started_at <= ?
			   AND ends_at > ?
			   AND vacated_at IS NULL
			 ORDER BY started_at`
		)
		.all(associationUuid, now, now) as SeatTerm[];
}

// ---------------------------------------------------------------------------
// Writes
// ---------------------------------------------------------------------------

export function vacateSeatTerm(seatTermUuid: string): void {
	db.prepare(
		'UPDATE seat_term SET vacated_at = ? WHERE uuid = ? AND vacated_at IS NULL'
	).run(today(), seatTermUuid);
}

/**
 * Declare inability for a list item. Changes status from 'called' to 'unable'.
 */
export function declareUnable(listItemUuid: string, reason?: string): void {
	db.prepare(
		"UPDATE list_item SET status = 'unable', status_reason = ? WHERE uuid = ? AND status = 'called'"
	).run(reason ?? null, listItemUuid);
}

/**
 * Run a sortition draw. Called as the perform_sortition motion effect.
 *
 * Draws count people from the eligible pool for the given association,
 * creates a sortition record and a list with all drawn persons at status 'called'.
 */
export function performSortition(input: {
	association_uuid: string;
	motion_uuid: string;
	count: number;
	purpose: string;
	notes?: string;
}): { sortition: Sortition; list: SortitionList; items: SortitionListItem[] } {
	const { association_uuid, motion_uuid, count, purpose, notes = null } = input;

	const config = getSortitionConfig(association_uuid);

	// Build the eligible pool
	let pool: { uuid: string }[];
	if (config?.source_college_uuid) {
		pool = db
			.prepare(
				`SELECT p.uuid FROM person p
				 JOIN association_member am ON am.person_uuid = p.uuid
				 WHERE am.association_uuid = ?
				   AND am.removed_at IS NULL
				   AND p.status = 'active'`
			)
			.all(config.source_college_uuid) as { uuid: string }[];
	} else {
		pool = db
			.prepare(`SELECT uuid FROM person WHERE status = 'active'`)
			.all() as { uuid: string }[];
	}

	// Exclude anyone currently holding an active term in this body
	const activeHolders = new Set<string>(
		(
			db
				.prepare(
					`SELECT person_uuid FROM seat_term
					 WHERE association_uuid = ?
					   AND ends_at > ?
					   AND vacated_at IS NULL`
				)
				.all(association_uuid, today()) as { person_uuid: string }[]
		).map((r) => r.person_uuid)
	);

	const eligible = pool.filter((p) => !activeHolders.has(p.uuid));

	if (eligible.length < count) {
		throw new Error(
			`Not enough eligible members (need ${count}, have ${eligible.length})`
		);
	}

	const drawn = cryptoShuffle(eligible).slice(0, count);
	const conductedAt = today();

	return db.transaction(() => {
		const sortitionUuid = randomUUID();
		db.prepare(
			`INSERT INTO sortition (uuid, association_uuid, motion_uuid, conducted_at, pool_size, notes)
			 VALUES (?, ?, ?, ?, ?, ?)`
		).run(sortitionUuid, association_uuid, motion_uuid, conductedAt, eligible.length, notes);

		const listUuid = randomUUID();
		const listCreatedAt = new Date().toISOString();
		db.prepare(
			`INSERT INTO list (uuid, motion_uuid, name, created_at) VALUES (?, ?, ?, ?)`
		).run(listUuid, motion_uuid, purpose, listCreatedAt);

		const insertItem = db.prepare(
			`INSERT INTO list_item (uuid, list_uuid, position, item_type, item_data, status)
			 VALUES (?, ?, ?, 'person', ?, 'called')`
		);

		const items: SortitionListItem[] = [];
		drawn.forEach((person, i) => {
			const itemUuid = randomUUID();
			const itemData = JSON.stringify({ person_uuid: person.uuid });
			insertItem.run(itemUuid, listUuid, i + 1, itemData);
			items.push({
				uuid: itemUuid,
				list_uuid: listUuid,
				position: i + 1,
				item_type: 'person',
				item_data: itemData,
				status: 'called',
				status_reason: null,
			});
		});

		const sortition: Sortition = {
			uuid: sortitionUuid,
			association_uuid,
			motion_uuid,
			conducted_at: conductedAt,
			pool_size: eligible.length,
			notes,
		};

		const list: SortitionList = {
			uuid: listUuid,
			motion_uuid,
			name: purpose,
			created_at: listCreatedAt,
		};

		return { sortition, list, items };
	})();
}

/**
 * Seat members from a list. Called as the seat_members motion effect.
 * Creates seat_term rows for every 'called' list item; marks them 'seated'.
 */
export function seatMembers(input: {
	list_uuid: string;
	association_uuid: string;
	motion_uuid: string;
	starts_at: string;
	ends_at: string;
}): SeatTerm[] {
	const { list_uuid, association_uuid, motion_uuid, starts_at, ends_at } = input;

	const calledItems = db
		.prepare(`SELECT * FROM list_item WHERE list_uuid = ? AND status = 'called'`)
		.all(list_uuid) as SortitionListItem[];

	const insertTerm = db.prepare(
		`INSERT INTO seat_term (uuid, association_uuid, person_uuid, motion_uuid, started_at, ends_at)
		 VALUES (?, ?, ?, ?, ?, ?)`
	);
	const updateItem = db.prepare(
		`UPDATE list_item SET status = 'seated' WHERE uuid = ?`
	);

	const terms: SeatTerm[] = [];

	db.transaction(() => {
		for (const item of calledItems) {
			const data = JSON.parse(item.item_data) as { person_uuid: string };
			const termUuid = randomUUID();
			insertTerm.run(termUuid, association_uuid, data.person_uuid, motion_uuid, starts_at, ends_at);
			updateItem.run(item.uuid);
			terms.push({
				uuid: termUuid,
				association_uuid,
				person_uuid: data.person_uuid,
				motion_uuid,
				started_at: starts_at,
				ends_at,
				vacated_at: null,
			});
		}
	})();

	return terms;
}
