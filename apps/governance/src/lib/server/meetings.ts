import { randomUUID } from 'node:crypto';
import { db } from './db.js';
import { getMotionByUuid, getVoteTally } from './motions.js';
import * as library from './library.js';
import { getVoteRuleByUuid, evaluateTally } from './vote_rules.js';

// --- Types ---

export type MeetingStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled';

export type ActionTaken = 'vote_held' | 'tabled' | 'withdrawn' | 'amended' | 'referred';

export interface Meeting {
	uuid: string;
	body_uuid: string;
	title: string;
	scheduled_at: string;
	location: string | null;
	status: MeetingStatus;
	created_by_uuid: string;
	created_at: string;
	started_at: string | null;
	completed_at: string | null;
	cancelled_at: string | null;
	notes: string | null;
}

export interface MeetingAgendaItem {
	uuid: string;
	meeting_uuid: string;
	motion_uuid: string;
	display_order: number;
	notes: string | null;
	added_at: string;
	removed_at: string | null;
}

export interface MeetingOutcome {
	uuid: string;
	meeting_uuid: string;
	motion_uuid: string;
	action_taken: ActionTaken;
	vote_aye: number | null;
	vote_nay: number | null;
	vote_abstain: number | null;
	notes: string | null;
	recorded_at: string;
	recorded_by_uuid: string;
}

export interface MeetingWithAgenda extends Meeting {
	agenda_items: Array<{
		uuid: string;
		motion_uuid: string;
		motion_title: string;
		motion_number: number;
		motion_status: string;
		display_order: number;
		notes: string | null;
		outcome: MeetingOutcome | null;
	}>;
}

// --- Helpers ---

function now(): string {
	return new Date().toISOString();
}

/**
 * Check if a motion is on the agenda of an active (in_progress) meeting.
 * Returns the meeting UUID if found, null otherwise.
 */
export function getActiveMeetingForMotion(motionUuid: string): string | null {
	const row = db.prepare(`
		SELECT m.uuid
		FROM meeting m
		JOIN meeting_agenda_item ai ON ai.meeting_uuid = m.uuid
		WHERE ai.motion_uuid = ?
		  AND m.status = 'in_progress'
		  AND ai.removed_at IS NULL
		LIMIT 1
	`).get(motionUuid) as { uuid: string } | undefined;
	
	return row?.uuid ?? null;
}

// --- Meeting CRUD ---

export function createMeeting(input: {
	body_uuid: string;
	title: string;
	scheduled_at: string;
	location?: string | null;
	created_by_uuid: string;
	notes?: string | null;
}): Meeting {
	const uuid = randomUUID();
	const meeting: Meeting = {
		uuid,
		body_uuid: input.body_uuid,
		title: input.title,
		scheduled_at: input.scheduled_at,
		location: input.location ?? null,
		status: 'scheduled',
		created_by_uuid: input.created_by_uuid,
		created_at: now(),
		started_at: null,
		completed_at: null,
		cancelled_at: null,
		notes: input.notes ?? null,
	};

	db.prepare(
		`INSERT INTO meeting (uuid, body_uuid, title, scheduled_at, location, status, created_by_uuid, created_at, started_at, completed_at, cancelled_at, notes)
		 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
	).run(
		meeting.uuid,
		meeting.body_uuid,
		meeting.title,
		meeting.scheduled_at,
		meeting.location,
		meeting.status,
		meeting.created_by_uuid,
		meeting.created_at,
		meeting.started_at,
		meeting.completed_at,
		meeting.cancelled_at,
		meeting.notes
	);

	return meeting;
}

export function getMeetingByUuid(uuid: string): Meeting | null {
	return db.prepare('SELECT * FROM meeting WHERE uuid = ?').get(uuid) as Meeting | null;
}

export function listMeetings(opts: {
	body_uuid?: string;
	status?: MeetingStatus;
	upcoming?: boolean;
} = {}): Meeting[] {
	let query = 'SELECT * FROM meeting WHERE 1=1';
	const params: any[] = [];

	if (opts.body_uuid) {
		query += ' AND body_uuid = ?';
		params.push(opts.body_uuid);
	}

	if (opts.status) {
		query += ' AND status = ?';
		params.push(opts.status);
	}

	if (opts.upcoming) {
		query += ' AND scheduled_at >= ? AND status = ?';
		params.push(now(), 'scheduled');
	}

	query += ' ORDER BY scheduled_at DESC';

	return db.prepare(query).all(...params) as Meeting[];
}

export function updateMeetingStatus(uuid: string, status: MeetingStatus): Meeting {
	const meeting = getMeetingByUuid(uuid);
	if (!meeting) throw new Error(`Meeting not found: ${uuid}`);

	const updates: Partial<Meeting> = { status };

	if (status === 'in_progress' && !meeting.started_at) {
		updates.started_at = now();
	} else if (status === 'completed' && !meeting.completed_at) {
		updates.completed_at = now();
	} else if (status === 'cancelled' && !meeting.cancelled_at) {
		updates.cancelled_at = now();
	}

	db.prepare(
		`UPDATE meeting 
		 SET status = ?, started_at = COALESCE(?, started_at), completed_at = COALESCE(?, completed_at), cancelled_at = COALESCE(?, cancelled_at)
		 WHERE uuid = ?`
	).run(updates.status, updates.started_at ?? null, updates.completed_at ?? null, updates.cancelled_at ?? null, uuid);

	return getMeetingByUuid(uuid)!;
}

export function updateMeeting(uuid: string, updates: {
	title?: string;
	scheduled_at?: string;
	location?: string | null;
	notes?: string | null;
}): Meeting {
	const meeting = getMeetingByUuid(uuid);
	if (!meeting) throw new Error(`Meeting not found: ${uuid}`);

	const fields: string[] = [];
	const values: any[] = [];

	if (updates.title !== undefined) {
		fields.push('title = ?');
		values.push(updates.title);
	}
	if (updates.scheduled_at !== undefined) {
		fields.push('scheduled_at = ?');
		values.push(updates.scheduled_at);
	}
	if (updates.location !== undefined) {
		fields.push('location = ?');
		values.push(updates.location);
	}
	if (updates.notes !== undefined) {
		fields.push('notes = ?');
		values.push(updates.notes);
	}

	if (fields.length > 0) {
		values.push(uuid);
		db.prepare(`UPDATE meeting SET ${fields.join(', ')} WHERE uuid = ?`).run(...values);
	}

	return getMeetingByUuid(uuid)!;
}

export function deleteMeeting(uuid: string): void {
	db.prepare('DELETE FROM meeting WHERE uuid = ?').run(uuid);
}

// --- Agenda Management ---

export function addAgendaItem(input: {
	meeting_uuid: string;
	motion_uuid: string;
	notes?: string | null;
}): MeetingAgendaItem {
	// Get next display order
	const result = db.prepare(
		'SELECT COALESCE(MAX(display_order), 0) AS max_order FROM meeting_agenda_item WHERE meeting_uuid = ? AND removed_at IS NULL'
	).get(input.meeting_uuid) as { max_order: number };

	const uuid = randomUUID();
	const item: MeetingAgendaItem = {
		uuid,
		meeting_uuid: input.meeting_uuid,
		motion_uuid: input.motion_uuid,
		display_order: result.max_order + 1,
		notes: input.notes ?? null,
		added_at: now(),
		removed_at: null,
	};

	db.prepare(
		`INSERT INTO meeting_agenda_item (uuid, meeting_uuid, motion_uuid, display_order, notes, added_at, removed_at)
		 VALUES (?, ?, ?, ?, ?, ?, ?)`
	).run(item.uuid, item.meeting_uuid, item.motion_uuid, item.display_order, item.notes, item.added_at, item.removed_at);

	return item;
}

export function removeAgendaItem(uuid: string): void {
	db.prepare('UPDATE meeting_agenda_item SET removed_at = ? WHERE uuid = ?').run(now(), uuid);
}

export function reorderAgendaItem(uuid: string, newOrder: number): void {
	db.prepare('UPDATE meeting_agenda_item SET display_order = ? WHERE uuid = ?').run(newOrder, uuid);
}

export function getAgendaItems(meeting_uuid: string): MeetingAgendaItem[] {
	return db
		.prepare(
			'SELECT * FROM meeting_agenda_item WHERE meeting_uuid = ? AND removed_at IS NULL ORDER BY display_order ASC'
		)
		.all(meeting_uuid) as MeetingAgendaItem[];
}

// --- Meeting with Full Agenda ---

export function getMeetingWithAgenda(uuid: string): MeetingWithAgenda | null {
	const meeting = getMeetingByUuid(uuid);
	if (!meeting) return null;

	const agendaRows = db
		.prepare(
			`SELECT 
				mai.uuid, mai.motion_uuid, mai.display_order, mai.notes,
				m.title AS motion_title, m.motion_number, m.status AS motion_status
			 FROM meeting_agenda_item mai
			 JOIN motion m ON m.uuid = mai.motion_uuid
			 WHERE mai.meeting_uuid = ? AND mai.removed_at IS NULL
			 ORDER BY mai.display_order ASC`
		)
		.all(uuid) as Array<{
		uuid: string;
		motion_uuid: string;
		motion_title: string;
		motion_number: number;
		motion_status: string;
		display_order: number;
		notes: string | null;
	}>;

	// Get outcomes for each agenda item
	const agenda_items = agendaRows.map((row) => {
		const outcome = db
			.prepare('SELECT * FROM meeting_outcome WHERE meeting_uuid = ? AND motion_uuid = ?')
			.get(uuid, row.motion_uuid) as MeetingOutcome | null;

		return {
			...row,
			outcome,
		};
	});

	return {
		...meeting,
		agenda_items,
	};
}

// --- Outcome Recording ---

/**
 * Record the outcome of a motion at a meeting.
 * If votes were cast through the app (vote_tally exists), those counts are used automatically.
 * Otherwise, vote counts can be provided manually.
 */
export function recordOutcome(input: {
	meeting_uuid: string;
	motion_uuid: string;
	action_taken: ActionTaken;
	vote_aye?: number | null;
	vote_nay?: number | null;
	vote_abstain?: number | null;
	notes?: string | null;
	recorded_by_uuid: string;
}): MeetingOutcome {
	const motion = getMotionByUuid(input.motion_uuid);
	if (!motion) throw new Error(`Motion not found: ${input.motion_uuid}`);

	// Check if votes were cast through the app
	const tally = getVoteTally(input.motion_uuid);
	
	// Use tally counts if available, otherwise use provided manual counts
	let vote_aye = input.vote_aye ?? null;
	let vote_nay = input.vote_nay ?? null;
	let vote_abstain = input.vote_abstain ?? null;
	
	if (tally && input.action_taken === 'vote_held') {
		vote_aye = tally.aye_count;
		vote_nay = tally.nay_count;
		vote_abstain = tally.abstain_count;
		
		// Mark tally as closed
		db.prepare('UPDATE motion_vote_tally SET closed_at = ? WHERE motion_uuid = ?')
			.run(now(), input.motion_uuid);
	}

	const uuid = randomUUID();
	const outcome: MeetingOutcome = {
		uuid,
		meeting_uuid: input.meeting_uuid,
		motion_uuid: input.motion_uuid,
		action_taken: input.action_taken,
		vote_aye,
		vote_nay,
		vote_abstain,
		notes: input.notes ?? null,
		recorded_at: now(),
		recorded_by_uuid: input.recorded_by_uuid,
	};

	db.prepare(
		`INSERT INTO meeting_outcome (uuid, meeting_uuid, motion_uuid, action_taken, vote_aye, vote_nay, vote_abstain, notes, recorded_at, recorded_by_uuid)
		 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
	).run(
		outcome.uuid,
		outcome.meeting_uuid,
		outcome.motion_uuid,
		outcome.action_taken,
		outcome.vote_aye,
		outcome.vote_nay,
		outcome.vote_abstain,
		outcome.notes,
		outcome.recorded_at,
		outcome.recorded_by_uuid
	);

	// Update motion status based on action taken
	if (input.action_taken === 'vote_held') {
		const totalVotes = (vote_aye ?? 0) + (vote_nay ?? 0) + (vote_abstain ?? 0);
		
		// Evaluate using vote rule if available
		let passed = false;
		if (motion.vote_rule_uuid && tally) {
			const rule = getVoteRuleByUuid(motion.vote_rule_uuid);
			if (rule) {
				passed = evaluateTally(rule, {
					...tally,
					aye_count: vote_aye ?? 0,
					nay_count: vote_nay ?? 0,
					abstain_count: vote_abstain ?? 0,
				}).passed;
			} else {
				// Fallback to simple majority
				const ayeRatio = totalVotes > 0 ? (vote_aye ?? 0) / totalVotes : 0;
				passed = ayeRatio > 0.5;
			}
		} else {
			// Simple majority: aye must be > 50% of total votes
			const ayeRatio = totalVotes > 0 ? (vote_aye ?? 0) / totalVotes : 0;
			passed = ayeRatio > 0.5;
		}

		const newStatus = passed ? 'enacted' : 'rejected';
		library.updateMotionStatus(motion.slug, newStatus, {
			enacted_at: passed ? now() : undefined,
			vote_closed_at: now(),
		});
	} else if (input.action_taken === 'withdrawn') {
		library.updateMotionStatus(motion.slug, 'withdrawn', {
			vote_closed_at: now(),
		});
	}

	return outcome;
}

export function getOutcome(meeting_uuid: string, motion_uuid: string): MeetingOutcome | null {
	return db
		.prepare('SELECT * FROM meeting_outcome WHERE meeting_uuid = ? AND motion_uuid = ?')
		.get(meeting_uuid, motion_uuid) as MeetingOutcome | null;
}

export function listOutcomes(meeting_uuid: string): MeetingOutcome[] {
	return db
		.prepare('SELECT * FROM meeting_outcome WHERE meeting_uuid = ? ORDER BY recorded_at ASC')
		.all(meeting_uuid) as MeetingOutcome[];
}
