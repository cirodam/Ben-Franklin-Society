import { db } from './db.js';
import { lookupSocietyByUuid } from './queries.js';
import { recordFlorenIssuance } from './updates.js';
import type { FoundingRecord } from './types.js';

/**
 * Calculate Floren issuance based on member count
 * Formula: 2,000 Florens per member
 */
export function calculateFlorenAmount(memberCount: number): number {
	return memberCount * 2000;
}

/**
 * Calculate how many members we've already issued Florens for
 */
export function getMembersIssuedFor(issuedFlorens: number): number {
	return Math.floor(issuedFlorens / 2000);
}

/**
 * Calculate how many new Florens to issue based on growth
 */
export function calculateGrowthIssuance(params: {
	currentMemberCount: number;
	alreadyIssuedFlorens: number;
}): number {
	const { currentMemberCount, alreadyIssuedFlorens } = params;
	const membersAlreadyIssuedFor = getMembersIssuedFor(alreadyIssuedFlorens);
	const newMembers = currentMemberCount - membersAlreadyIssuedFor;
	
	if (newMembers <= 0) {
		return 0;
	}
	
	return calculateFlorenAmount(newMembers);
}

/**
 * Extract member count from founding record
 * The founding record contains the initial member list
 */
function getMemberCountFromFoundingRecord(foundingRecord: FoundingRecord): number {
	return foundingRecord.members?.length || 0;
}

/**
 * Check if society has received any Floren issuance
 */
export function hasReceivedIssuance(societyUuid: string): boolean {
	const society = lookupSocietyByUuid(societyUuid);
	return society ? society.issued_florens > 0 : false;
}

/**
 * Issue Florens to a society based on verified member count
 * Can be called multiple times as society grows
 * Only issues for new members (delta between current and already-issued-for)
 * 
 * @param societyUuid - UUID of the society to receive Florens
 * @param verifiedMemberCount - Member count verified by audit
 * @returns Result with issuance amount or error
 */
export function issueFlorenForMembers(params: {
	societyUuid: string;
	verifiedMemberCount: number;
}): { success: boolean; amount?: number; newMembers?: number; error?: string } {
	const { societyUuid, verifiedMemberCount } = params;

	// 1. Check society exists
	const society = lookupSocietyByUuid(societyUuid);
	if (!society) {
		return { success: false, error: 'Society not found' };
	}

	// 2. Check society is active
	if (society.status !== 'active') {
		return { success: false, error: `Cannot issue to ${society.status} society` };
	}

	// 3. Validate member count
	if (verifiedMemberCount <= 0) {
		return { success: false, error: 'Invalid member count' };
	}

	// 4. Calculate how many members we've already issued for
	const membersAlreadyIssuedFor = getMembersIssuedFor(society.issued_florens);

	// 5. Calculate new members (growth)
	const newMembers = verifiedMemberCount - membersAlreadyIssuedFor;

	// 6. Check if there are new members to issue for
	if (newMembers <= 0) {
		return { 
			success: false, 
			error: `Already issued for ${membersAlreadyIssuedFor} members. No new members to issue for.`,
			newMembers: 0
		};
	}

	// 7. Calculate issuance amount for new members
	const issuanceAmount = calculateFlorenAmount(newMembers);

	// 8. Record issuance in database
	const recordResult = recordFlorenIssuance({
		uuid: societyUuid,
		amount: issuanceAmount
	});

	if (!recordResult.success) {
		return { success: false, error: recordResult.error };
	}

	// 9. TODO: Actually mint and distribute Florens to society's Community Bank
	// This would involve:
	// - Minting Florens in Federation's central bank wallet
	// - Transferring to society's Community Bank endpoint
	// - Waiting for confirmation
	
	return { 
		success: true, 
		amount: issuanceAmount,
		newMembers
	};
}

/**
 * Get issuance status for a society
 */
export function getIssuanceStatus(societyUuid: string): {
	uuid: string;
	handle: string;
	issued_florens: number;
	members_issued_for: number;
	people_count: number | null;
	person_years: number | null;
	potential_new_issuance: number;
} | null {
	const society = lookupSocietyByUuid(societyUuid);
	
	if (!society) {
		return null;
	}

	const membersIssuedFor = getMembersIssuedFor(society.issued_florens);
	const potentialNewIssuance = society.people_count 
		? calculateGrowthIssuance({
				currentMemberCount: society.people_count,
				alreadyIssuedFlorens: society.issued_florens
			})
		: 0;

	return {
		uuid: society.uuid,
		handle: society.handle,
		issued_florens: society.issued_florens,
		members_issued_for: membersIssuedFor,
		people_count: society.people_count,
		person_years: society.person_years,
		potential_new_issuance: potentialNewIssuance
	};
}

/**
 * Audit a society's claimed member count
 * Compare claimed count against founding record or other verification
 */
export function auditMemberCount(params: {
	societyUuid: string;
	claimedCount: number;
}): { verified: boolean; actualCount?: number; error?: string } {
	const { societyUuid, claimedCount } = params;

	// Get society and founding record
	const result = db.prepare(/* sql */ `
		SELECT founding_record_json
		FROM societies
		WHERE uuid = ?
	`).get(societyUuid) as { founding_record_json: string } | undefined;

	if (!result) {
		return { verified: false, error: 'Society not found' };
	}

	let foundingRecord: FoundingRecord;
	try {
		foundingRecord = JSON.parse(result.founding_record_json);
	} catch {
		return { verified: false, error: 'Invalid founding record' };
	}

	// Get actual member count from founding record
	const actualCount = getMemberCountFromFoundingRecord(foundingRecord);

	// TODO: This needs proper member list in founding record
	// For now, we can't verify without member data
	if (actualCount === 0) {
		return { 
			verified: false, 
			error: 'Cannot verify: founding record missing member list' 
		};
	}

	// Compare claimed vs actual
	const verified = claimedCount === actualCount;

	return {
		verified,
		actualCount,
		error: verified ? undefined : 'Claimed count does not match founding record'
	};
}
