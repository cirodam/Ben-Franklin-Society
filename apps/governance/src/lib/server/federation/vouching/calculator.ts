import { db } from '../../db.js';
import { getLineage } from '../lineage/walker.js';
import { verifyVouch } from './verifier.js';
import { getCredentials } from './receiver.js';

export interface TrustScore {
	handle: string;
	total_score: number; // 0-100
	lineage_score: number; // 0-100
	vouch_score: number; // 0-100
	history_score: number; // 0-100
	lineage_depth: number;
	valid_vouch_count: number;
	total_vouch_count: number;
	interaction_count: number;
	last_calculated: string;
}

export interface TrustScoreWeights {
	lineage: number; // 0-1
	vouches: number; // 0-1
	history: number; // 0-1
}

// Default weights: lineage 40%, vouches 40%, history 20%
const DEFAULT_WEIGHTS: TrustScoreWeights = {
	lineage: 0.4,
	vouches: 0.4,
	history: 0.2
};

/**
 * Calculate lineage-based trust score
 * Shorter lineages (closer to root) score higher
 * Root society scores 100, each level down reduces score
 */
export async function calculateLineageScore(handle: string): Promise<{
	score: number;
	depth: number;
}> {
	const lineage = await getLineage(handle);

	if (!lineage || lineage.length === 0) {
		return { score: 0, depth: 0 };
	}

	const depth = lineage.length;

	// Root society (depth 1) = 100 points
	// Each additional level reduces score
	// Formula: 100 - (depth - 1) * 10, minimum 10
	const score = Math.max(10, 100 - (depth - 1) * 10);

	return { score, depth };
}

/**
 * Calculate vouch-based trust score
 * More vouches = higher score
 * Confidence levels: strong = 1.0, moderate = 0.7, weak = 0.4
 * Voucher reputation multiplier based on their lineage
 */
export async function calculateVouchScore(handle: string): Promise<{
	score: number;
	valid_count: number;
	total_count: number;
	weighted_sum: number;
}> {
	// Get all credentials this society holds
	const credentials = getCredentials({ verified: true });

	// Filter for this society
	const relevantCredentials = credentials.filter((c) => {
		// Check if this credential is for our handle
		// Note: In the real implementation, we'd need to verify this matches
		return true; // For now, assume all credentials are for us
	});

	if (relevantCredentials.length === 0) {
		return { score: 0, valid_count: 0, total_count: 0, weighted_sum: 0 };
	}

	let weightedSum = 0;
	let validCount = 0;

	for (const credential of relevantCredentials) {
		// Get voucher's lineage score (reputation multiplier)
		const voucherLineage = await calculateLineageScore(credential.voucher_handle);
		const voucherMultiplier = voucherLineage.score / 100; // 0-1 range

		// Confidence weights
		const confidenceWeights: Record<string, number> = {
			strong: 1.0,
			moderate: 0.7,
			weak: 0.4
		};

		// Note: We don't store confidence in credentials table
		// In real implementation, we'd need to query the voucher for current confidence
		// For now, assume moderate confidence
		const confidenceWeight = 0.7;

		// Calculate weighted vouch value
		const vouchValue = confidenceWeight * voucherMultiplier * 100;
		weightedSum += vouchValue;
		validCount++;
	}

	// Calculate score: average of weighted vouches, capped at 100
	const score = Math.min(100, validCount > 0 ? weightedSum / validCount : 0);

	return {
		score,
		valid_count: validCount,
		total_count: relevantCredentials.length,
		weighted_sum: weightedSum
	};
}

/**
 * Calculate history-based trust score
 * Based on interaction count and recency
 */
export function calculateHistoryScore(handle: string): {
	score: number;
	interaction_count: number;
	last_interaction: number | null;
} {
	// Get society from cache
	const stmt = db.prepare(
		'SELECT interaction_count, last_interaction FROM societies WHERE handle = ?'
	);
	const row = stmt.get(handle) as
		| { interaction_count: number; last_interaction: number | null }
		| undefined;

	if (!row) {
		return { score: 0, interaction_count: 0, last_interaction: null };
	}

	const { interaction_count, last_interaction } = row;

	// Base score from interaction count
	// 0 interactions = 0, 10+ interactions = 100
	const interactionScore = Math.min(100, (interaction_count / 10) * 100);

	// Recency bonus: if interacted within last 30 days, +20% bonus
	let recencyBonus = 0;
	if (last_interaction) {
		const now = Math.floor(Date.now() / 1000);
		const daysSinceInteraction = (now - last_interaction) / 86400;

		if (daysSinceInteraction <= 30) {
			recencyBonus = 20;
		}
	}

	const score = Math.min(100, interactionScore + recencyBonus);

	return {
		score,
		interaction_count,
		last_interaction
	};
}

/**
 * Calculate comprehensive trust score for a society
 * Combines lineage, vouches, and history with configurable weights
 */
export async function calculateTrustScore(
	handle: string,
	weights: TrustScoreWeights = DEFAULT_WEIGHTS
): Promise<TrustScore> {
	// Validate weights sum to 1.0
	const weightSum = weights.lineage + weights.vouches + weights.history;
	if (Math.abs(weightSum - 1.0) > 0.01) {
		throw new Error('Trust score weights must sum to 1.0');
	}

	// Calculate component scores
	const lineageResult = await calculateLineageScore(handle);
	const vouchResult = await calculateVouchScore(handle);
	const historyResult = calculateHistoryScore(handle);

	// Weighted total score
	const totalScore =
		lineageResult.score * weights.lineage +
		vouchResult.score * weights.vouches +
		historyResult.score * weights.history;

	return {
		handle,
		total_score: Math.round(totalScore * 10) / 10, // Round to 1 decimal
		lineage_score: Math.round(lineageResult.score * 10) / 10,
		vouch_score: Math.round(vouchResult.score * 10) / 10,
		history_score: Math.round(historyResult.score * 10) / 10,
		lineage_depth: lineageResult.depth,
		valid_vouch_count: vouchResult.valid_count,
		total_vouch_count: vouchResult.total_count,
		interaction_count: historyResult.interaction_count,
		last_calculated: new Date().toISOString()
	};
}

/**
 * Calculate trust scores for multiple societies
 * Useful for ranking or filtering societies
 */
export async function calculateMultipleTrustScores(
	handles: string[],
	weights?: TrustScoreWeights
): Promise<TrustScore[]> {
	const scores: TrustScore[] = [];

	for (const handle of handles) {
		try {
			const score = await calculateTrustScore(handle, weights);
			scores.push(score);
		} catch (error) {
			console.error(`Failed to calculate trust score for ${handle}:`, error);
		}
	}

	return scores;
}

/**
 * Get ranked list of societies by trust score
 */
export async function getRankedSocieties(params?: {
	minScore?: number;
	limit?: number;
	weights?: TrustScoreWeights;
}): Promise<TrustScore[]> {
	const { minScore = 0, limit = 100, weights } = params || {};

	// Get all known societies
	const stmt = db.prepare('SELECT handle FROM societies LIMIT ?');
	const rows = stmt.all(limit * 2) as Array<{ handle: string }>; // Get extra for filtering

	// Calculate scores
	const scores = await calculateMultipleTrustScores(
		rows.map((r) => r.handle),
		weights
	);

	// Filter and sort
	return scores
		.filter((s) => s.total_score >= minScore)
		.sort((a, b) => b.total_score - a.total_score)
		.slice(0, limit);
}

/**
 * Compare trust between two societies
 */
export async function compareTrust(handleA: string, handleB: string): Promise<{
	society_a: TrustScore;
	society_b: TrustScore;
	winner: string;
	difference: number;
}> {
	const scoreA = await calculateTrustScore(handleA);
	const scoreB = await calculateTrustScore(handleB);

	const difference = Math.abs(scoreA.total_score - scoreB.total_score);
	const winner = scoreA.total_score > scoreB.total_score ? handleA : handleB;

	return {
		society_a: scoreA,
		society_b: scoreB,
		winner,
		difference: Math.round(difference * 10) / 10
	};
}

/**
 * Get trust category label
 */
export function getTrustCategory(score: number): string {
	if (score >= 80) return 'Excellent';
	if (score >= 60) return 'Good';
	if (score >= 40) return 'Moderate';
	if (score >= 20) return 'Low';
	return 'Minimal';
}
