import { randomUUID } from 'crypto';
import { db } from './db.js';

export interface VoteRule {
	uuid: string;
	association_uuid: string;
	name: string;
	numerator: number;
	denominator: number;
	quorum_numerator: number;
	quorum_denominator: number;
	created_at: string;
}

export function getVoteRuleByUuid(uuid: string): VoteRule | null {
	return (db.prepare('SELECT * FROM vote_rule WHERE uuid = ?').get(uuid) as VoteRule | undefined) ?? null;
}

export function listVoteRules(associationUuid: string): VoteRule[] {
	return db
		.prepare('SELECT * FROM vote_rule WHERE association_uuid = ? ORDER BY name')
		.all(associationUuid) as VoteRule[];
}

export function createVoteRule(input: {
	association_uuid: string;
	name: string;
	numerator: number;
	denominator: number;
	quorum_numerator?: number;
	quorum_denominator?: number;
}): VoteRule {
	const uuid = randomUUID();
	const now = new Date().toISOString();
	db.prepare(
		`INSERT INTO vote_rule (uuid, association_uuid, name, numerator, denominator, quorum_numerator, quorum_denominator, created_at)
		 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
	).run(
		uuid,
		input.association_uuid,
		input.name,
		input.numerator,
		input.denominator,
		input.quorum_numerator ?? 0,
		input.quorum_denominator ?? 1,
		now
	);
	return getVoteRuleByUuid(uuid)!;
}

export function deleteVoteRule(uuid: string): void {
	db.prepare('DELETE FROM vote_rule WHERE uuid = ?').run(uuid);
}

/**
 * Evaluate a completed tally against a vote rule.
 * Returns true if the motion passes under this rule.
 */
export function evaluateTally(
	rule: VoteRule,
	tally: { aye_count: number; nay_count: number; abstain_count: number; eligible_count: number }
): { passed: boolean; reason: string } {
	const { aye_count, nay_count, eligible_count } = tally;
	const cast = aye_count + nay_count + tally.abstain_count;

	// Check quorum first (if configured)
	if (rule.quorum_numerator > 0) {
		const quorumRequired = (rule.quorum_numerator / rule.quorum_denominator) * eligible_count;
		if (cast < quorumRequired) {
			return {
				passed: false,
				reason: `Quorum not met: ${cast} of ${eligible_count} voted (required ${Math.ceil(quorumRequired)})`,
			};
		}
	}

	// Threshold: aye / (aye + nay) >= numerator / denominator
	// Abstentions do not count for or against.
	const deciding = aye_count + nay_count;
	if (deciding === 0) {
		return { passed: false, reason: 'No aye or nay votes cast' };
	}

	// aye/deciding >= num/den  ↔  aye * den >= num * deciding
	const passed = aye_count * rule.denominator >= rule.numerator * deciding;
	const pct = Math.round((aye_count / deciding) * 100);
	const required = Math.round((rule.numerator / rule.denominator) * 100);
	return {
		passed,
		reason: passed
			? `Passed: ${aye_count}–${nay_count} (${pct}% aye, required ${required}%)`
			: `Failed: ${aye_count}–${nay_count} (${pct}% aye, required ${required}%)`,
	};
}
