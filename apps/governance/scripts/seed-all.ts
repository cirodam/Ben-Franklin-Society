#!/usr/bin/env node
/**
 * Main CLI for seeding associations, services, colleges, and committees.
 * 
 * Usage:
 *   pnpm seed:all                              # Seed everything
 *   pnpm seed:services                         # Seed all services
 *   pnpm seed:services food-service            # Seed specific service(s)
 *   pnpm seed:colleges                         # Seed all colleges
 *   pnpm seed:committees                       # Seed all committees
 * 
 * Options:
 *   --with-structure    Include organizational structures (Phase 2 feature)
 */

import { parseArgs } from 'node:util';
import { db } from '../src/lib/server/db.js';
import { services } from './seed-data/services.js';
import { colleges } from './seed-data/colleges.js';
import { committees } from './seed-data/committees.js';
import { seedServices } from './seeders/seed-services.js';
import { seedColleges } from './seeders/seed-colleges.js';
import { seedCommittees } from './seeders/seed-committees.js';
import { seedAdminRoles } from './seeders/seed-roles.js';

// Parse command-line arguments
const { values, positionals } = parseArgs({
	options: {
		'with-structure': { type: 'boolean', default: false },
	},
	allowPositionals: true,
});

const command = positionals[0]; // 'all', 'services', 'colleges', 'committees'
const filters = positionals.slice(1); // specific handles to seed

// Validation
if (!command) {
	console.error('Error: No command specified.');
	console.error('Usage: pnpm seed:all | pnpm seed:services | pnpm seed:colleges | pnpm seed:committees');
	process.exit(1);
}

const validCommands = ['all', 'services', 'colleges', 'committees'];
if (!validCommands.includes(command)) {
	console.error(`Error: Invalid command "${command}".`);
	console.error(`Valid commands: ${validCommands.join(', ')}`);
	process.exit(1);
}

// Get founder UUID (first person in database)
const founder = db.prepare('SELECT uuid FROM person ORDER BY joined_at ASC LIMIT 1').get() as { uuid: string } | undefined;
if (!founder) {
	console.error('Error: No founder found. Please run setup first to create the initial user.');
	process.exit(1);
}

console.log('🌱 BFS Association Seeder\n');
console.log(`Database: ${process.env.DATABASE_PATH || './dev.sqlite'}`);
console.log(`Founder: ${founder.uuid}\n`);

// Execute seeding based on command
try {
	if (command === 'all' || command === 'services') {
		// Filter services if specific handles provided
		const servicesToSeed = filters.length > 0
			? services.filter(s => filters.includes(s.handle))
			: services;

		if (servicesToSeed.length === 0 && filters.length > 0) {
			console.warn(`⚠️  No services found matching: ${filters.join(', ')}`);
		} else {
			seedServices(servicesToSeed, founder.uuid);
		}
	}

	if (command === 'all' || command === 'colleges') {
		// Filter colleges if specific handles provided
		const collegesToSeed = filters.length > 0
			? colleges.filter(c => filters.includes(c.handle))
			: colleges;

		if (collegesToSeed.length === 0 && filters.length > 0) {
			console.warn(`⚠️  No colleges found matching: ${filters.join(', ')}`);
		} else {
			seedColleges(collegesToSeed, founder.uuid);
		}
	}

	if (command === 'all' || command === 'committees') {
		// Filter committees if specific handles provided
		const committeesToSeed = filters.length > 0
			? committees.filter(c => filters.includes(c.handle))
			: committees;

		if (committeesToSeed.length === 0 && filters.length > 0) {
			console.warn(`⚠️  No committees found matching: ${filters.join(', ')}`);
		} else {
			seedCommittees(committeesToSeed, founder.uuid);
		}
	}

	// Seed admin roles for satellite apps (only when seeding all or services)
	if (command === 'all' || command === 'services') {
		// Only seed admin roles if the required services exist
		const requiredServices = ['community-bank', 'communications-service', 'commerce-service'];
		const servicesToCheck = filters.length > 0 ? filters : requiredServices;
		const hasRequiredServices = requiredServices.every(s => servicesToCheck.includes(s));
		
		if (hasRequiredServices || filters.length === 0) {
			seedAdminRoles(founder.uuid);
		}
	}

	console.log('\n✅ Seeding complete!\n');
} catch (error) {
	console.error('\n❌ Seeding failed:', error);
	process.exit(1);
}
