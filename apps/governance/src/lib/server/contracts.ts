import { randomUUID } from 'node:crypto';
import { createHash } from 'node:crypto';
import { db } from './db.js';

// --- Types ---

export type ContractStatus = 'draft' | 'active' | 'completed' | 'disputed' | 'terminated';
export type ContractJurisdiction = 'intra' | 'inter';
export type PartySide = 'party_a' | 'party_b';
export type MilestoneStatus = 'pending' | 'attested' | 'skipped';
export type ContractEventType =
	| 'created'
	| 'party_acknowledged'
	| 'activated'
	| 'milestone_attested'
	| 'milestone_skipped'
	| 'dispute_declared'
	| 'force_majeure_declared'
	| 'force_majeure_lifted'
	| 'completed'
	| 'terminated';

export interface Contract {
	uuid: string;
	title: string;
	body: string;
	body_hash: string;
	jurisdiction: ContractJurisdiction;
	jurisdiction_society_handle: string | null;
	status: ContractStatus;
	effective_date: string | null;
	expiry_date: string | null;
	created_at: string;
	activated_at: string | null;
	closed_at: string | null;
}

export interface ContractParty {
	uuid: string;
	contract_uuid: string;
	side: PartySide;
	principal_uuid: string;
	principal_handle: string;
	principal_society_handle: string;
	role: string;
	signature: string | null;
	signed_at: string | null;
}

export interface ContractMilestone {
	uuid: string;
	contract_uuid: string;
	title: string;
	description: string | null;
	due_date: string | null;
	transfer_amount: number | null;
	transfer_from_party_uuid: string | null;
	transfer_to_party_uuid: string | null;
	status: MilestoneStatus;
	attested_by_party_uuid: string | null;
	attested_at: string | null;
}

export interface ContractEvent {
	uuid: string;
	contract_uuid: string;
	event_type: ContractEventType;
	actor_party_uuid: string | null;
	detail: string | null;
	recorded_at: string;
}

// --- Helpers ---

function now(): string {
	return new Date().toISOString();
}

function hashContractBody(body: string): string {
	return createHash('sha256').update(body, 'utf8').digest('hex');
}

// --- Contract queries ---

export function getContractByUuid(uuid: string): Contract | null {
	return (
		(db.prepare('SELECT * FROM contract WHERE uuid = ?').get(uuid) as Contract | undefined) ?? null
	);
}

export function listContracts(opts: {
	status?: ContractStatus;
	principalUuid?: string;
} = {}): Contract[] {
	let sql = 'SELECT DISTINCT c.* FROM contract c';
	const conditions: string[] = [];
	const params: any[] = [];

	if (opts.principalUuid) {
		sql += ' JOIN contract_party cp ON cp.contract_uuid = c.uuid';
		conditions.push('cp.principal_uuid = ?');
		params.push(opts.principalUuid);
	}

	if (opts.status) {
		conditions.push('c.status = ?');
		params.push(opts.status);
	}

	if (conditions.length > 0) {
		sql += ' WHERE ' + conditions.join(' AND ');
	}

	sql += ' ORDER BY c.created_at DESC';

	return db.prepare(sql).all(...params) as Contract[];
}

export function getContractParties(contractUuid: string): ContractParty[] {
	return db
		.prepare('SELECT * FROM contract_party WHERE contract_uuid = ? ORDER BY side')
		.all(contractUuid) as ContractParty[];
}

export function getContractMilestones(contractUuid: string): ContractMilestone[] {
	return db
		.prepare('SELECT * FROM contract_milestone WHERE contract_uuid = ? ORDER BY due_date NULLS LAST, title')
		.all(contractUuid) as ContractMilestone[];
}

export function getContractEvents(contractUuid: string): ContractEvent[] {
	return db
		.prepare('SELECT * FROM contract_event WHERE contract_uuid = ? ORDER BY recorded_at ASC')
		.all(contractUuid) as ContractEvent[];
}

// --- Contract mutations ---

export function createContract(input: {
	title: string;
	body: string;
	jurisdiction: ContractJurisdiction;
	jurisdiction_society_handle?: string;
	party_a: {
		principal_uuid: string;
		principal_handle: string;
		principal_society_handle: string;
		role: string;
	};
	party_b: {
		principal_uuid: string;
		principal_handle: string;
		principal_society_handle: string;
		role: string;
	};
	effective_date?: string;
	expiry_date?: string;
}): string {
	const uuid = randomUUID();
	const body_hash = hashContractBody(input.body);
	const created_at = now();

	db.prepare(`
		INSERT INTO contract (
			uuid, title, body, body_hash, jurisdiction, jurisdiction_society_handle,
			status, effective_date, expiry_date, created_at
		) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
	`).run(
		uuid,
		input.title,
		input.body,
		body_hash,
		input.jurisdiction,
		input.jurisdiction_society_handle ?? null,
		'draft',
		input.effective_date ?? null,
		input.expiry_date ?? null,
		created_at
	);

	// Create both parties
	const partyAUuid = randomUUID();
	db.prepare(`
		INSERT INTO contract_party (
			uuid, contract_uuid, side, principal_uuid, principal_handle,
			principal_society_handle, role
		) VALUES (?, ?, ?, ?, ?, ?, ?)
	`).run(
		partyAUuid,
		uuid,
		'party_a',
		input.party_a.principal_uuid,
		input.party_a.principal_handle,
		input.party_a.principal_society_handle,
		input.party_a.role
	);

	const partyBUuid = randomUUID();
	db.prepare(`
		INSERT INTO contract_party (
			uuid, contract_uuid, side, principal_uuid, principal_handle,
			principal_society_handle, role
		) VALUES (?, ?, ?, ?, ?, ?, ?)
	`).run(
		partyBUuid,
		uuid,
		'party_b',
		input.party_b.principal_uuid,
		input.party_b.principal_handle,
		input.party_b.principal_society_handle,
		input.party_b.role
	);

	// Log creation event
	addContractEvent(uuid, 'created', null, `Contract created: ${input.title}`);

	return uuid;
}

export function updateContractBody(contractUuid: string, body: string): void {
	const contract = getContractByUuid(contractUuid);
	if (!contract) throw new Error('Contract not found');
	if (contract.status !== 'draft') throw new Error('Cannot edit contract after acknowledgment');

	const body_hash = hashContractBody(body);
	db.prepare('UPDATE contract SET body = ?, body_hash = ? WHERE uuid = ?').run(
		body,
		body_hash,
		contractUuid
	);
}

export function acknowledgeContract(contractUuid: string, principalUuid: string): void {
	const contract = getContractByUuid(contractUuid);
	if (!contract) throw new Error('Contract not found');
	if (contract.status !== 'draft') throw new Error('Contract already activated');

	const party = db
		.prepare('SELECT * FROM contract_party WHERE contract_uuid = ? AND principal_uuid = ?')
		.get(contractUuid, principalUuid) as ContractParty | undefined;

	if (!party) throw new Error('Not a party to this contract');
	if (party.signed_at) throw new Error('Already acknowledged');

	const acknowledged_at = now();

	db.prepare('UPDATE contract_party SET signed_at = ? WHERE uuid = ?').run(
		acknowledged_at,
		party.uuid
	);

	addContractEvent(contractUuid, 'party_acknowledged', party.uuid, `${party.role} acknowledged`);

	// Check if both parties have acknowledged
	const parties = getContractParties(contractUuid);
	const allAcknowledged = parties.every((p) => p.signed_at !== null);

	if (allAcknowledged) {
		activateContract(contractUuid);
	}
}

function activateContract(contractUuid: string): void {
	const activated_at = now();
	const contract = getContractByUuid(contractUuid);

	// If no effective_date was specified, use activation time
	const effective_date = contract?.effective_date ?? activated_at.split('T')[0];

	db.prepare(
		'UPDATE contract SET status = ?, activated_at = ?, effective_date = ? WHERE uuid = ?'
	).run('active', activated_at, effective_date, contractUuid);

	addContractEvent(contractUuid, 'activated', null, 'Contract activated - all parties acknowledged');
}

export function addMilestone(input: {
	contract_uuid: string;
	title: string;
	description?: string;
	due_date?: string;
}): string {
	const contract = getContractByUuid(input.contract_uuid);
	if (!contract) throw new Error('Contract not found');
	if (contract.status !== 'draft') throw new Error('Cannot add milestones after activation');

	const uuid = randomUUID();

	db.prepare(`
		INSERT INTO contract_milestone (
			uuid, contract_uuid, title, description, due_date, status
		) VALUES (?, ?, ?, ?, ?, ?)
	`).run(
		uuid,
		input.contract_uuid,
		input.title,
		input.description ?? null,
		input.due_date ?? null,
		'pending'
	);

	return uuid;
}

export function attestMilestone(
	milestoneUuid: string,
	partyUuid: string
): void {
	const milestone = db
		.prepare('SELECT * FROM contract_milestone WHERE uuid = ?')
		.get(milestoneUuid) as ContractMilestone | undefined;

	if (!milestone) throw new Error('Milestone not found');
	if (milestone.status !== 'pending') throw new Error('Milestone already processed');

	const contract = getContractByUuid(milestone.contract_uuid);
	if (!contract) throw new Error('Contract not found');
	if (contract.status !== 'active') throw new Error('Contract not active');

	const attested_at = now();

	db.prepare(
		'UPDATE contract_milestone SET status = ?, attested_by_party_uuid = ?, attested_at = ? WHERE uuid = ?'
	).run('attested', partyUuid, attested_at, milestoneUuid);

	addContractEvent(
		milestone.contract_uuid,
		'milestone_attested',
		partyUuid,
		`Milestone attested: ${milestone.title}`
	);

	// Check if all milestones are complete
	checkContractCompletion(milestone.contract_uuid);
}

export function skipMilestone(milestoneUuid: string, partyUuid: string): void {
	const milestone = db
		.prepare('SELECT * FROM contract_milestone WHERE uuid = ?')
		.get(milestoneUuid) as ContractMilestone | undefined;

	if (!milestone) throw new Error('Milestone not found');
	if (milestone.status !== 'pending') throw new Error('Milestone already processed');

	db.prepare('UPDATE contract_milestone SET status = ? WHERE uuid = ?').run('skipped', milestoneUuid);

	addContractEvent(
		milestone.contract_uuid,
		'milestone_skipped',
		partyUuid,
		`Milestone skipped: ${milestone.title}`
	);

	checkContractCompletion(milestone.contract_uuid);
}

function checkContractCompletion(contractUuid: string): void {
	const milestones = getContractMilestones(contractUuid);
	const allComplete = milestones.length > 0 && milestones.every((m) => m.status !== 'pending');

	if (allComplete) {
		completeContract(contractUuid);
	}
}

function completeContract(contractUuid: string): void {
	const closed_at = now();
	db.prepare('UPDATE contract SET status = ?, closed_at = ? WHERE uuid = ?').run(
		'completed',
		closed_at,
		contractUuid
	);

	addContractEvent(contractUuid, 'completed', null, 'All milestones complete');
}

export function declareDispute(
	contractUuid: string,
	partyUuid: string,
	reason: string
): void {
	const contract = getContractByUuid(contractUuid);
	if (!contract) throw new Error('Contract not found');
	if (contract.status !== 'active') throw new Error('Can only dispute active contracts');

	db.prepare('UPDATE contract SET status = ? WHERE uuid = ?').run('disputed', contractUuid);

	addContractEvent(contractUuid, 'dispute_declared', partyUuid, reason);
}

export function terminateContract(
	contractUuid: string,
	reason: string
): void {
	const contract = getContractByUuid(contractUuid);
	if (!contract) throw new Error('Contract not found');

	const closed_at = now();
	db.prepare('UPDATE contract SET status = ?, closed_at = ? WHERE uuid = ?').run(
		'terminated',
		closed_at,
		contractUuid
	);

	addContractEvent(contractUuid, 'terminated', null, reason);
}

// --- Event logging ---

function addContractEvent(
	contractUuid: string,
	eventType: ContractEventType,
	actorPartyUuid: string | null,
	detail: string | null
): void {
	const uuid = randomUUID();
	const recorded_at = now();

	db.prepare(`
		INSERT INTO contract_event (uuid, contract_uuid, event_type, actor_party_uuid, detail, recorded_at)
		VALUES (?, ?, ?, ?, ?, ?)
	`).run(uuid, contractUuid, eventType, actorPartyUuid, detail, recorded_at);
}
