/**
 * Central Bank module - manages Frank issuance to Treasury
 * This is a logical module within Governance, not a separate app
 */

import { getAssociationByHandle } from '../organization/associations.js';
import { queueMintCommand } from './outbox.js';

/**
 * Calculate a person's age in complete years from their date of birth
 */
export function calculateAgeInYears(dateOfBirth: string): number {
	const dob = new Date(dateOfBirth);
	const today = new Date();
	
	let age = today.getFullYear() - dob.getFullYear();
	const monthDiff = today.getMonth() - dob.getMonth();
	
	// Adjust if birthday hasn't occurred yet this year
	if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
		age--;
	}
	
	return age;
}

/**
 * Issue initial Franks for a new member (2000 per year of age)
 * Queues a mint command to be delivered to Community Bank
 */
export function issueInitialFranks(opts: {
	personUuid: string;
	dateOfBirth: string;
	performedByUuid: string;
}): string {
	console.log('[issueInitialFranks] Called with:', { personUuid: opts.personUuid, dateOfBirth: opts.dateOfBirth });
	const age = calculateAgeInYears(opts.dateOfBirth);
	console.log('[issueInitialFranks] Age calculated:', age);
	const amount = age * 2000; // Constitutional: 2000 Franks per person-year
	console.log('[issueInitialFranks] Amount to issue:', amount);
	
	// Get Treasury association UUID
	const treasury = getAssociationByHandle('treasury');
	if (!treasury) {
		console.warn('[issueInitialFranks] Treasury not found - skipping issuance (this is normal during initial setup)');
		throw new Error('Treasury association not found');
	}
	
	// Queue command in outbox - will be delivered by background worker
	const commandUuid = queueMintCommand({
		amount,
		owner_uuid: treasury.uuid,
		reason: `initial_issuance:${opts.personUuid}`,
		performed_by_uuid: opts.performedByUuid
	});
	
	console.log(`Queued initial issuance: ${amount} Franks for person ${opts.personUuid} (command ${commandUuid})`);
	
	return commandUuid;
}

/**
 * Issue birthday Franks for a member (2000 Franks)
 * Queues a mint command to be delivered to Community Bank
 */
export function issueBirthdayFranks(opts: {
	personUuid: string;
	performedByUuid: string;
}): string {
	const amount = 2000; // Constitutional: 2000 Franks per person per year
	
	// Get Treasury association UUID
	const treasury = getAssociationByHandle('treasury');
	if (!treasury) {
		throw new Error('Treasury association not found');
	}
	
	// Queue command in outbox - will be delivered by background worker
	const commandUuid = queueMintCommand({
		amount,
		owner_uuid: treasury.uuid,
		reason: `birthday_issuance:${opts.personUuid}`,
		performed_by_uuid: opts.performedByUuid
	});
	
	console.log(`Queued birthday issuance: ${amount} Franks for person ${opts.personUuid} (command ${commandUuid})`);
	
	return commandUuid;
}
