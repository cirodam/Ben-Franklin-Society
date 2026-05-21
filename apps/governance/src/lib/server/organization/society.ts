import { db } from '../db.js';
import type { Person } from './people.js';

/**
 * Calculate total person-years for the society.
 * Person-years = sum of ages of all active members.
 * Used for monetary policy calculations.
 */
export function calculatePersonYears(referenceDate?: Date): number {
	const refDate = referenceDate ?? new Date();
	
	const activePersons = db
		.prepare('SELECT date_of_birth FROM person WHERE status = ?')
		.all('active') as Pick<Person, 'date_of_birth'>[];

	let totalYears = 0;
	for (const person of activePersons) {
		const birthDate = new Date(person.date_of_birth);
		const ageMs = refDate.getTime() - birthDate.getTime();
		const ageYears = ageMs / (1000 * 60 * 60 * 24 * 365.25); // Account for leap years
		totalYears += ageYears;
	}

	return Math.floor(totalYears);
}

/**
 * Get count of active members
 */
export function getActiveMemberCount(): number {
	const result = db
		.prepare('SELECT COUNT(*) as count FROM person WHERE status = ?')
		.get('active') as { count: number };
	return result.count;
}

/**
 * Get society statistics including person-years
 */
export function getSocietyStatistics(referenceDate?: Date): {
	member_count: number;
	person_years: number;
	calculated_at: string;
} {
	return {
		member_count: getActiveMemberCount(),
		person_years: calculatePersonYears(referenceDate),
		calculated_at: (referenceDate ?? new Date()).toISOString()
	};
}
