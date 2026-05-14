import { randomUUID } from 'crypto';
import { db } from './db.js';

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

/**
 * Check if a motion has completed its required deliberation period
 */
export function isDeliberationPeriodComplete(
	deliberationOpenedAt: string | null,
	deliberationRule: DeliberationRule | null
): boolean {
	if (!deliberationOpenedAt || !deliberationRule) return true;
	
	const openedDate = new Date(deliberationOpenedAt);
	const now = new Date();
	const elapsedDays = (now.getTime() - openedDate.getTime()) / (1000 * 60 * 60 * 24);
	
	return elapsedDays >= deliberationRule.minimum_days;
}

/**
 * Get days remaining in deliberation period (returns 0 if complete)
 */
export function getDaysRemainingInDeliberation(
	deliberationOpenedAt: string | null,
	deliberationRule: DeliberationRule | null
): number {
	if (!deliberationOpenedAt || !deliberationRule) return 0;
	
	const openedDate = new Date(deliberationOpenedAt);
	const now = new Date();
	const elapsedDays = (now.getTime() - openedDate.getTime()) / (1000 * 60 * 60 * 24);
	const remaining = Math.max(0, deliberationRule.minimum_days - elapsedDays);
	
	return Math.ceil(remaining);
}
