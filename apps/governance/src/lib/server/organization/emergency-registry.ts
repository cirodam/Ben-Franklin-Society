import { randomUUID } from 'node:crypto';
import { db } from '../db.js';

// --- Types ---

export interface EmergencySkill {
	uuid: string;
	name: string;
	category: string | null;
	description: string | null;
	active: boolean;
	created_at: string;
	updated_at: string;
}

export interface EmergencyTool {
	uuid: string;
	name: string;
	category: string | null;
	description: string | null;
	active: boolean;
	created_at: string;
	updated_at: string;
}

export interface PersonEmergencySkill {
	person_uuid: string;
	skill_uuid: string;
	notes: string | null;
	proficiency: 'beginner' | 'intermediate' | 'expert' | null;
	available: boolean;
	added_at: string;
}

export interface PersonEmergencyTool {
	person_uuid: string;
	tool_uuid: string;
	notes: string | null;
	quantity: number | null;
	available: boolean;
	added_at: string;
}

export interface PersonSkillDetail extends PersonEmergencySkill {
	skill_name: string;
	skill_category: string | null;
}

export interface PersonToolDetail extends PersonEmergencyTool {
	tool_name: string;
	tool_category: string | null;
}

// --- Helpers ---

function now(): string {
	return new Date().toISOString();
}

function toBoolean(value: number): boolean {
	return value === 1;
}

function fromBoolean(value: boolean): number {
	return value ? 1 : 0;
}

// --- Emergency Skill Queries ---

export function listEmergencySkills(activeOnly = true): EmergencySkill[] {
	const query = activeOnly
		? 'SELECT * FROM emergency_skill WHERE active = 1 ORDER BY category, name'
		: 'SELECT * FROM emergency_skill ORDER BY category, name';
	
	const rows = db.prepare(query).all() as Array<Omit<EmergencySkill, 'active'> & { active: number }>;
	return rows.map(row => ({ ...row, active: toBoolean(row.active) }));
}

export function getEmergencySkillByUuid(uuid: string): EmergencySkill | null {
	const row = db.prepare('SELECT * FROM emergency_skill WHERE uuid = ?').get(uuid) as (Omit<EmergencySkill, 'active'> & { active: number }) | undefined;
	return row ? { ...row, active: toBoolean(row.active) } : null;
}

export function createEmergencySkill(data: {
	name: string;
	category?: string;
	description?: string;
}): EmergencySkill {
	const uuid = randomUUID();
	const timestamp = now();
	
	db.prepare(
		`INSERT INTO emergency_skill (uuid, name, category, description, active, created_at, updated_at)
		 VALUES (?, ?, ?, ?, 1, ?, ?)`
	).run(uuid, data.name, data.category ?? null, data.description ?? null, timestamp, timestamp);
	
	return getEmergencySkillByUuid(uuid)!;
}

export function updateEmergencySkill(
	uuid: string,
	updates: { name?: string; category?: string | null; description?: string | null }
): void {
	const fields: string[] = [];
	const params: unknown[] = [];
	
	if (updates.name !== undefined) { fields.push('name = ?'); params.push(updates.name); }
	if (updates.category !== undefined) { fields.push('category = ?'); params.push(updates.category); }
	if (updates.description !== undefined) { fields.push('description = ?'); params.push(updates.description); }
	
	if (!fields.length) return;
	
	fields.push('updated_at = ?');
	params.push(now(), uuid);
	
	db.prepare(`UPDATE emergency_skill SET ${fields.join(', ')} WHERE uuid = ?`).run(...params);
}

export function deactivateEmergencySkill(uuid: string): void {
	db.prepare('UPDATE emergency_skill SET active = 0, updated_at = ? WHERE uuid = ?').run(now(), uuid);
}

export function reactivateEmergencySkill(uuid: string): void {
	db.prepare('UPDATE emergency_skill SET active = 1, updated_at = ? WHERE uuid = ?').run(now(), uuid);
}

// --- Emergency Tool Queries ---

export function listEmergencyTools(activeOnly = true): EmergencyTool[] {
	const query = activeOnly
		? 'SELECT * FROM emergency_tool WHERE active = 1 ORDER BY category, name'
		: 'SELECT * FROM emergency_tool ORDER BY category, name';
	
	const rows = db.prepare(query).all() as Array<Omit<EmergencyTool, 'active'> & { active: number }>;
	return rows.map(row => ({ ...row, active: toBoolean(row.active) }));
}

export function getEmergencyToolByUuid(uuid: string): EmergencyTool | null {
	const row = db.prepare('SELECT * FROM emergency_tool WHERE uuid = ?').get(uuid) as (Omit<EmergencyTool, 'active'> & { active: number }) | undefined;
	return row ? { ...row, active: toBoolean(row.active) } : null;
}

export function createEmergencyTool(data: {
	name: string;
	category?: string;
	description?: string;
}): EmergencyTool {
	const uuid = randomUUID();
	const timestamp = now();
	
	db.prepare(
		`INSERT INTO emergency_tool (uuid, name, category, description, active, created_at, updated_at)
		 VALUES (?, ?, ?, ?, 1, ?, ?)`
	).run(uuid, data.name, data.category ?? null, data.description ?? null, timestamp, timestamp);
	
	return getEmergencyToolByUuid(uuid)!;
}

export function updateEmergencyTool(
	uuid: string,
	updates: { name?: string; category?: string | null; description?: string | null }
): void {
	const fields: string[] = [];
	const params: unknown[] = [];
	
	if (updates.name !== undefined) { fields.push('name = ?'); params.push(updates.name); }
	if (updates.category !== undefined) { fields.push('category = ?'); params.push(updates.category); }
	if (updates.description !== undefined) { fields.push('description = ?'); params.push(updates.description); }
	
	if (!fields.length) return;
	
	fields.push('updated_at = ?');
	params.push(now(), uuid);
	
	db.prepare(`UPDATE emergency_tool SET ${fields.join(', ')} WHERE uuid = ?`).run(...params);
}

export function deactivateEmergencyTool(uuid: string): void {
	db.prepare('UPDATE emergency_tool SET active = 0, updated_at = ? WHERE uuid = ?').run(now(), uuid);
}

export function reactivateEmergencyTool(uuid: string): void {
	db.prepare('UPDATE emergency_tool SET active = 1, updated_at = ? WHERE uuid = ?').run(now(), uuid);
}

// --- Person Emergency Skill Queries ---

export function getPersonSkills(personUuid: string): PersonSkillDetail[] {
	const rows = db.prepare(`
		SELECT 
			pes.*,
			es.name as skill_name,
			es.category as skill_category
		FROM person_emergency_skill pes
		JOIN emergency_skill es ON pes.skill_uuid = es.uuid
		WHERE pes.person_uuid = ?
		ORDER BY es.category, es.name
	`).all(personUuid) as Array<Omit<PersonSkillDetail, 'available'> & { available: number }>;
	
	return rows.map(row => ({ ...row, available: toBoolean(row.available) }));
}

export function addPersonSkill(
	personUuid: string,
	skillUuid: string,
	data: {
		notes?: string;
		proficiency?: 'beginner' | 'intermediate' | 'expert';
		available?: boolean;
	} = {}
): void {
	db.prepare(
		`INSERT INTO person_emergency_skill (person_uuid, skill_uuid, notes, proficiency, available, added_at)
		 VALUES (?, ?, ?, ?, ?, ?)`
	).run(
		personUuid,
		skillUuid,
		data.notes ?? null,
		data.proficiency ?? null,
		fromBoolean(data.available ?? true),
		now()
	);
}

export function updatePersonSkill(
	personUuid: string,
	skillUuid: string,
	updates: {
		notes?: string | null;
		proficiency?: 'beginner' | 'intermediate' | 'expert' | null;
		available?: boolean;
	}
): void {
	const fields: string[] = [];
	const params: unknown[] = [];
	
	if (updates.notes !== undefined) { fields.push('notes = ?'); params.push(updates.notes); }
	if (updates.proficiency !== undefined) { fields.push('proficiency = ?'); params.push(updates.proficiency); }
	if (updates.available !== undefined) { fields.push('available = ?'); params.push(fromBoolean(updates.available)); }
	
	if (!fields.length) return;
	
	params.push(personUuid, skillUuid);
	
	db.prepare(`UPDATE person_emergency_skill SET ${fields.join(', ')} WHERE person_uuid = ? AND skill_uuid = ?`).run(...params);
}

export function removePersonSkill(personUuid: string, skillUuid: string): void {
	db.prepare('DELETE FROM person_emergency_skill WHERE person_uuid = ? AND skill_uuid = ?').run(personUuid, skillUuid);
}

// --- Person Emergency Tool Queries ---

export function getPersonTools(personUuid: string): PersonToolDetail[] {
	const rows = db.prepare(`
		SELECT 
			pet.*,
			et.name as tool_name,
			et.category as tool_category
		FROM person_emergency_tool pet
		JOIN emergency_tool et ON pet.tool_uuid = et.uuid
		WHERE pet.person_uuid = ?
		ORDER BY et.category, et.name
	`).all(personUuid) as Array<Omit<PersonToolDetail, 'available'> & { available: number }>;
	
	return rows.map(row => ({ ...row, available: toBoolean(row.available) }));
}

export function addPersonTool(
	personUuid: string,
	toolUuid: string,
	data: {
		notes?: string;
		quantity?: number;
		available?: boolean;
	} = {}
): void {
	db.prepare(
		`INSERT INTO person_emergency_tool (person_uuid, tool_uuid, notes, quantity, available, added_at)
		 VALUES (?, ?, ?, ?, ?, ?)`
	).run(
		personUuid,
		toolUuid,
		data.notes ?? null,
		data.quantity ?? null,
		fromBoolean(data.available ?? true),
		now()
	);
}

export function updatePersonTool(
	personUuid: string,
	toolUuid: string,
	updates: {
		notes?: string | null;
		quantity?: number | null;
		available?: boolean;
	}
): void {
	const fields: string[] = [];
	const params: unknown[] = [];
	
	if (updates.notes !== undefined) { fields.push('notes = ?'); params.push(updates.notes); }
	if (updates.quantity !== undefined) { fields.push('quantity = ?'); params.push(updates.quantity); }
	if (updates.available !== undefined) { fields.push('available = ?'); params.push(fromBoolean(updates.available)); }
	
	if (!fields.length) return;
	
	params.push(personUuid, toolUuid);
	
	db.prepare(`UPDATE person_emergency_tool SET ${fields.join(', ')} WHERE person_uuid = ? AND tool_uuid = ?`).run(...params);
}

export function removePersonTool(personUuid: string, toolUuid: string): void {
	db.prepare('DELETE FROM person_emergency_tool WHERE person_uuid = ? AND tool_uuid = ?').run(personUuid, toolUuid);
}

// --- Search Functions ---

export interface RegistrySearchResult {
	person_uuid: string;
	person_handle: string;
	person_given_name: string;
	person_family_name: string;
	latitude: number | null;
	longitude: number | null;
	skills: PersonSkillDetail[];
	tools: PersonToolDetail[];
}

export function searchRegistry(options: {
	skillUuid?: string;
	toolUuid?: string;
	availableOnly?: boolean;
}): RegistrySearchResult[] {
	const { skillUuid, toolUuid, availableOnly = true } = options;
	
	let query = `
		SELECT DISTINCT
			p.uuid as person_uuid,
			p.handle as person_handle,
			p.given_name as person_given_name,
			p.family_name as person_family_name,
			p.latitude,
			p.longitude
		FROM person p
	`;
	
	const conditions: string[] = [];
	const params: unknown[] = [];
	
	if (skillUuid) {
		query += ` JOIN person_emergency_skill pes ON p.uuid = pes.person_uuid`;
		conditions.push('pes.skill_uuid = ?');
		params.push(skillUuid);
		if (availableOnly) {
			conditions.push('pes.available = 1');
		}
	}
	
	if (toolUuid) {
		query += ` JOIN person_emergency_tool pet ON p.uuid = pet.person_uuid`;
		conditions.push('pet.tool_uuid = ?');
		params.push(toolUuid);
		if (availableOnly) {
			conditions.push('pet.available = 1');
		}
	}
	
	// Only return people who have at least one skill or tool registered
	if (!skillUuid && !toolUuid) {
		query += ` 
			WHERE EXISTS (SELECT 1 FROM person_emergency_skill WHERE person_uuid = p.uuid ${availableOnly ? 'AND available = 1' : ''})
			   OR EXISTS (SELECT 1 FROM person_emergency_tool WHERE person_uuid = p.uuid ${availableOnly ? 'AND available = 1' : ''})
		`;
	} else if (conditions.length > 0) {
		query += ` WHERE ${conditions.join(' AND ')}`;
	}
	
	query += ` ORDER BY p.family_name, p.given_name`;
	
	const people = db.prepare(query).all(...params) as RegistrySearchResult[];
	
	// Fetch skills and tools for each person
	return people.map(person => ({
		...person,
		skills: getPersonSkills(person.person_uuid),
		tools: getPersonTools(person.person_uuid)
	}));
}
