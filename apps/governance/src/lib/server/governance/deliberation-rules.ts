import { randomUUID } from 'crypto';
import { db } from '../db.js';

/**
 * Deliberation rules define recommended discussion periods before voting.
 * These serve as guidelines for minimum deliberation time before vote sessions.
 */
export interface DeliberationRule {
	uuid: string;
	association_uuid: string;
	name: string;
	minimum_days: number;
	created_at: string;
}

export function getDeliberationRuleByUuid(uuid: string): DeliberationRule | null {
	return (db.prepare('SELECT * FROM deliberation_rule WHERE uuid = ?').get(uuid) as DeliberationRule | undefined) ?? null;
}

export function listDeliberationRules(associationUuid: string): DeliberationRule[] {
	return db
		.prepare('SELECT * FROM deliberation_rule WHERE association_uuid = ? ORDER BY name')
		.all(associationUuid) as DeliberationRule[];
}

export function createDeliberationRule(input: {
	association_uuid: string;
	name: string;
	minimum_days: number;
}): DeliberationRule {
	const uuid = randomUUID();
	const now = new Date().toISOString();
	db.prepare(
		`INSERT INTO deliberation_rule (uuid, association_uuid, name, minimum_days, created_at)
		 VALUES (?, ?, ?, ?, ?)`
	).run(
		uuid,
		input.association_uuid,
		input.name,
		input.minimum_days,
		now
	);
	return getDeliberationRuleByUuid(uuid)!;
}
