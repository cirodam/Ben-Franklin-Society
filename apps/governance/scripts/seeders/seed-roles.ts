#!/usr/bin/env node
/**
 * Helper for creating admin roles in special associations.
 * Used for satellite app permissions (bank, mail, marketplace).
 */

import { randomUUID } from 'node:crypto';
import { db } from '../../src/lib/server/db.js';
import { assignRole, getAssociationByHandle } from '../../src/lib/server/organization/associations.js';

export interface AdminRoleConfig {
	associationHandle: string;
	title: string;
	description: string;
	app: string;
	permissions: string[];
}

/**
 * Create an admin role in an association with specific app permissions.
 * Also grants 'act_as' permission in governance app.
 * 
 * @param config - Admin role configuration
 * @param personUuid - UUID of person to assign the role to
 * @returns The created role UUID
 */
export function createAdminRole(config: AdminRoleConfig, personUuid: string): string {
	const association = getAssociationByHandle(config.associationHandle);
	if (!association) {
		throw new Error(`Association @${config.associationHandle} not found`);
	}

	const roleUuid = randomUUID();
	const createdAt = new Date().toISOString();

	// Create the role
	db.prepare(
		`INSERT INTO role (uuid, association_uuid, title, description, created_at)
		 VALUES (?, ?, ?, ?, ?)`
	).run(roleUuid, association.uuid, config.title, config.description, createdAt);

	// Add app-specific permissions
	const insertPerm = db.prepare(
		`INSERT INTO role_permission (role_uuid, app, permission) VALUES (?, ?, ?)`
	);
	
	for (const permission of config.permissions) {
		insertPerm.run(roleUuid, config.app, permission);
	}

	// Add governance 'act_as' permission
	insertPerm.run(roleUuid, 'governance', 'act_as');

	// Assign role to the person
	assignRole(roleUuid, personUuid);

	console.log(`  ✓ Created role "${config.title}" in @${config.associationHandle} with ${config.permissions.length} permission(s)`);

	return roleUuid;
}

/**
 * Seed standard admin roles for satellite apps.
 * 
 * @param founderUuid - UUID of founder to assign roles to
 */
export function seedAdminRoles(founderUuid: string): void {
	console.log('\n🔑 Seeding admin roles for satellite apps...');

	// Bank Administrator
	createAdminRole({
		associationHandle: 'community-bank',
		title: 'Administrator',
		description: 'Bank administrators with full system access',
		app: 'bank',
		permissions: ['admin', 'manage_monetary'],
	}, founderUuid);

	// Mail Moderator
	createAdminRole({
		associationHandle: 'communications-service',
		title: 'Moderator',
		description: 'Mail moderators with system oversight access',
		app: 'mail',
		permissions: ['moderator'],
	}, founderUuid);

	// Marketplace Administrator
	createAdminRole({
		associationHandle: 'commerce-service',
		title: 'Administrator',
		description: 'Marketplace administrators with full system access',
		app: 'marketplace',
		permissions: ['administrator'],
	}, founderUuid);

	// Treasury Treasurer
	createAdminRole({
		associationHandle: 'treasury',
		title: 'Treasurer',
		description: 'Manages Treasury accounts and appropriations',
		app: 'bank',
		permissions: [],
	}, founderUuid);

	console.log('✅ Seeded admin roles');
}
