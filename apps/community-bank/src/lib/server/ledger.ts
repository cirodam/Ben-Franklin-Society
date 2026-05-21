import { randomUUID } from 'node:crypto';
import { db } from './db.js';

export interface Transaction {
	uuid: string;
	from_uuid: string;
	to_uuid: string;
	amount: number;
	type: string;
	source: string;
	slip_serial: string | null;
	memo: string | null;
	entered_by_uuid: string | null;
	created_at: string;
}

export interface EnrichedTransaction extends Transaction {
	from_name: string;
	to_name: string;
}

// ---------------------------------------------------------------------------
// Post a transaction and update both balances atomically.
// ---------------------------------------------------------------------------
export function postTransaction(opts: {
	from_uuid: string;
	to_uuid: string;
	amount: number;
	type: string;
	source?: string;
	slip_serial?: string | null;
	memo?: string | null;
	entered_by_uuid?: string | null;
}): Transaction {
	if (opts.amount <= 0) throw new Error('Amount must be a positive integer.');

	const uuid = randomUUID();
	const now = new Date().toISOString();

	const insert = db.prepare(
		`INSERT INTO "transaction" (uuid, from_uuid, to_uuid, amount, type, source, slip_serial, memo, entered_by_uuid, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
	);
	const debit  = db.prepare(`UPDATE account SET balance = balance - ? WHERE uuid = ?`);
	const credit = db.prepare(`UPDATE account SET balance = balance + ? WHERE uuid = ?`);

	db.transaction(() => {
		insert.run(
			uuid,
			opts.from_uuid,
			opts.to_uuid,
			opts.amount,
			opts.type,
			opts.source ?? 'online',
			opts.slip_serial ?? null,
			opts.memo ?? null,
			opts.entered_by_uuid ?? null,
			now
		);
		debit.run(opts.amount, opts.from_uuid);
		credit.run(opts.amount, opts.to_uuid);
	})();

	return db
		.prepare(`SELECT * FROM "transaction" WHERE uuid = ?`)
		.get(uuid) as Transaction;
}

// ---------------------------------------------------------------------------
// Fetch transactions for an account (paginated), enriched with handle/name.
// ---------------------------------------------------------------------------
export function getTransactionsForAccount(
	account_uuid: string,
	opts: { limit?: number; offset?: number; type?: string } = {}
): EnrichedTransaction[] {
	const limit  = opts.limit  ?? 50;
	const offset = opts.offset ?? 0;
	const typePart = opts.type ? `AND t.type = ?` : '';
	const params: unknown[] = opts.type
		? [account_uuid, account_uuid, opts.type, limit, offset]
		: [account_uuid, account_uuid, limit, offset];

	return db
		.prepare(
			`SELECT t.*,
              fa.name AS from_name,
              ta.name AS to_name
       FROM "transaction" t
       JOIN account fa ON fa.uuid = t.from_uuid
       JOIN account ta ON ta.uuid = t.to_uuid
       WHERE (t.from_uuid = ? OR t.to_uuid = ?)
       ${typePart}
       ORDER BY t.created_at DESC
       LIMIT ? OFFSET ?`
		)
		.all(...params) as EnrichedTransaction[];
}

// ---------------------------------------------------------------------------
// Slip transactions entered by this teller today (session log).
// ---------------------------------------------------------------------------
export function getSlipsForTellerToday(entered_by_uuid: string): EnrichedTransaction[] {
	return db
		.prepare(
			`SELECT t.*,
              fa.name AS from_name,
              ta.name AS to_name
       FROM "transaction" t
       JOIN account fa ON fa.uuid = t.from_uuid
       JOIN account ta ON ta.uuid = t.to_uuid
       WHERE t.source = 'teller'
         AND t.entered_by_uuid = ?
         AND date(t.created_at) = date('now')
       ORDER BY t.created_at DESC`
		)
		.all(entered_by_uuid) as EnrichedTransaction[];
}

export function getTransactionsForNamedAccount(
	name: string,
	opts: { limit?: number; offset?: number } = {}
): EnrichedTransaction[] {
	const limit  = opts.limit  ?? 50;
	const offset = opts.offset ?? 0;
	const row = db.prepare(`SELECT uuid FROM account WHERE name = ?`).get(name) as { uuid: string } | undefined;
	if (!row) return [];
	return getTransactionsForAccount(row.uuid, { limit, offset });
}
