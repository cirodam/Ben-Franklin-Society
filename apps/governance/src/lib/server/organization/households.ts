import { db } from '../db.js';
import { randomUUID } from 'node:crypto';

// --- Types ---

export interface Household {
	uuid: string;
	created_at: string;
	dissolved_at: string | null;
}

export interface HouseholdMember {
	household_uuid: string;
	person_uuid: string;
	joined_at: string;
	left_at: string | null;
}

export interface Dependent {
	uuid: string;
	household_uuid: string;
	given_name: string;
	family_name: string;
	date_of_birth: string;
	relationship: string;
	eligibility_date: string | null;
	notes: string | null;
	created_at: string;
	removed_at: string | null;
}

export interface NewDependentInput {
	household_uuid: string;
	given_name: string;
	family_name: string;
	date_of_birth: string;
	relationship: string;
	eligibility_date?: string | null;
	notes?: string | null;
}

// --- Household Queries ---

/**
 * Get a household by UUID
 */
export function getHouseholdByUuid(uuid: string): Household | null {
	return (db.prepare('SELECT * FROM household WHERE uuid = ?').get(uuid) as Household | undefined) ?? null;
}

/**
 * Get all active households
 */
export function listActiveHouseholds(): Household[] {
	return db
		.prepare('SELECT * FROM household WHERE dissolved_at IS NULL ORDER BY created_at')
		.all() as Household[];
}

/**
 * Get households a person is a member of (active memberships only)
 */
export function getHouseholdsByPerson(personUuid: string): Household[] {
	return db
		.prepare(
			`SELECT h.* FROM household h
			 JOIN household_member hm ON h.uuid = hm.household_uuid
			 WHERE hm.person_uuid = ? AND hm.left_at IS NULL AND h.dissolved_at IS NULL
			 ORDER BY hm.joined_at`
		)
		.all(personUuid) as Household[];
}

/**
 * Get all members of a household (active only by default)
 */
export function getHouseholdMembers(householdUuid: string, includeFormer = false): HouseholdMember[] {
	const query = includeFormer
		? 'SELECT * FROM household_member WHERE household_uuid = ? ORDER BY joined_at'
		: 'SELECT * FROM household_member WHERE household_uuid = ? AND left_at IS NULL ORDER BY joined_at';
	
	return db.prepare(query).all(householdUuid) as HouseholdMember[];
}

/**
 * Count active members in a household
 */
export function countHouseholdMembers(householdUuid: string): number {
	const result = db
		.prepare('SELECT COUNT(*) as count FROM household_member WHERE household_uuid = ? AND left_at IS NULL')
		.get(householdUuid) as { count: number };
	return result.count;
}

// --- Household Mutations ---

/**
 * Create a new household
 */
export function createHousehold(): Household {
	const uuid = randomUUID();
	const createdAt = new Date().toISOString();
	
	db.prepare('INSERT INTO household (uuid, created_at) VALUES (?, ?)').run(uuid, createdAt);
	
	return getHouseholdByUuid(uuid)!;
}

/**
 * Add a member to a household
 */
export function addHouseholdMember(householdUuid: string, personUuid: string): HouseholdMember {
	const joinedAt = new Date().toISOString();
	
	db.prepare(
		'INSERT INTO household_member (household_uuid, person_uuid, joined_at) VALUES (?, ?, ?)'
	).run(householdUuid, personUuid, joinedAt);
	
	return db
		.prepare('SELECT * FROM household_member WHERE household_uuid = ? AND person_uuid = ?')
		.get(householdUuid, personUuid) as HouseholdMember;
}

/**
 * Remove a member from a household (can leave unilaterally)
 */
export function removeHouseholdMember(householdUuid: string, personUuid: string): void {
	const leftAt = new Date().toISOString();
	db.prepare(
		'UPDATE household_member SET left_at = ? WHERE household_uuid = ? AND person_uuid = ? AND left_at IS NULL'
	).run(leftAt, householdUuid, personUuid);
}

/**
 * Dissolve a household (marks it as ended)
 */
export function dissolveHousehold(householdUuid: string): void {
	const dissolvedAt = new Date().toISOString();
	db.prepare('UPDATE household SET dissolved_at = ? WHERE uuid = ?').run(dissolvedAt, householdUuid);
	
	// Mark all current members as having left
	db.prepare(
		'UPDATE household_member SET left_at = ? WHERE household_uuid = ? AND left_at IS NULL'
	).run(dissolvedAt, householdUuid);
}

// --- Dependent Queries ---

/**
 * Get all dependents in a household (active only by default)
 */
export function getDependentsByHousehold(householdUuid: string, includeRemoved = false): Dependent[] {
	const query = includeRemoved
		? 'SELECT * FROM dependent WHERE household_uuid = ? ORDER BY date_of_birth'
		: 'SELECT * FROM dependent WHERE household_uuid = ? AND removed_at IS NULL ORDER BY date_of_birth';
	
	return db.prepare(query).all(householdUuid) as Dependent[];
}

/**
 * Get a dependent by UUID
 */
export function getDependentByUuid(uuid: string): Dependent | null {
	return (db.prepare('SELECT * FROM dependent WHERE uuid = ?').get(uuid) as Dependent | undefined) ?? null;
}

/**
 * Count active dependents in a household
 */
export function countDependents(householdUuid: string): number {
	const result = db
		.prepare('SELECT COUNT(*) as count FROM dependent WHERE household_uuid = ? AND removed_at IS NULL')
		.get(householdUuid) as { count: number };
	return result.count;
}

/**
 * Get all dependents approaching eligibility (within specified days)
 */
export function getDependentsNearingEligibility(daysAhead = 30): Dependent[] {
	const futureDate = new Date();
	futureDate.setDate(futureDate.getDate() + daysAhead);
	
	return db
		.prepare(
			`SELECT * FROM dependent 
			 WHERE eligibility_date IS NOT NULL 
			 AND eligibility_date <= ? 
			 AND removed_at IS NULL
			 ORDER BY eligibility_date`
		)
		.all(futureDate.toISOString()) as Dependent[];
}

// --- Dependent Mutations ---

/**
 * Add a new dependent to a household
 */
export function addDependent(input: NewDependentInput): Dependent {
	const uuid = randomUUID();
	const createdAt = new Date().toISOString();
	
	db.prepare(
		`INSERT INTO dependent (uuid, household_uuid, given_name, family_name, date_of_birth, relationship, eligibility_date, notes, created_at)
		 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
	).run(
		uuid,
		input.household_uuid,
		input.given_name,
		input.family_name,
		input.date_of_birth,
		input.relationship,
		input.eligibility_date ?? null,
		input.notes ?? null,
		createdAt
	);
	
	return getDependentByUuid(uuid)!;
}

/**
 * Update dependent information
 */
export function updateDependent(
	uuid: string,
	updates: {
		given_name?: string;
		family_name?: string;
		date_of_birth?: string;
		relationship?: string;
		eligibility_date?: string | null;
		notes?: string | null;
	}
): Dependent {
	const current = getDependentByUuid(uuid);
	if (!current) throw new Error('Dependent not found');
	
	const fields: string[] = [];
	const values: any[] = [];
	
	if (updates.given_name !== undefined) {
		fields.push('given_name = ?');
		values.push(updates.given_name);
	}
	if (updates.family_name !== undefined) {
		fields.push('family_name = ?');
		values.push(updates.family_name);
	}
	if (updates.date_of_birth !== undefined) {
		fields.push('date_of_birth = ?');
		values.push(updates.date_of_birth);
	}
	if (updates.relationship !== undefined) {
		fields.push('relationship = ?');
		values.push(updates.relationship);
	}
	if (updates.eligibility_date !== undefined) {
		fields.push('eligibility_date = ?');
		values.push(updates.eligibility_date);
	}
	if (updates.notes !== undefined) {
		fields.push('notes = ?');
		values.push(updates.notes);
	}
	
	if (fields.length > 0) {
		values.push(uuid);
		db.prepare(`UPDATE dependent SET ${fields.join(', ')} WHERE uuid = ?`).run(...values);
	}
	
	return getDependentByUuid(uuid)!;
}

/**
 * Mark a dependent as removed (soft delete)
 */
export function removeDependent(uuid: string): void {
	const removedAt = new Date().toISOString();
	db.prepare('UPDATE dependent SET removed_at = ? WHERE uuid = ?').run(removedAt, uuid);
}

/**
 * Transfer a dependent to a different household
 */
export function transferDependent(uuid: string, newHouseholdUuid: string): Dependent {
	db.prepare('UPDATE dependent SET household_uuid = ? WHERE uuid = ?').run(newHouseholdUuid, uuid);
	return getDependentByUuid(uuid)!;
}

// --- Utility Functions ---

/**
 * Get total household size (active members + active dependents)
 */
export function getHouseholdSize(householdUuid: string): number {
	const members = countHouseholdMembers(householdUuid);
	const dependents = countDependents(householdUuid);
	return members + dependents;
}

/**
 * Get effective household size for a person (useful for service allocations)
 * Returns 1 if not in any household, otherwise returns household size
 */
export function getEffectiveHouseholdSize(personUuid: string): number {
	const households = getHouseholdsByPerson(personUuid);
	if (households.length === 0) return 1;
	
	// If member of multiple households, return the largest
	return Math.max(...households.map(h => getHouseholdSize(h.uuid)));
}
