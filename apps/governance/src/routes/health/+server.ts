import { db } from '$lib/server/db.js';
import { getKeyPair } from '$lib/server/infrastructure/oidc.js';

interface HealthCheck {
	status: 'ok' | 'error';
	timestamp: string;
	checks: {
		database: { status: 'ok' | 'error'; message?: string };
		oidcKeys: { status: 'ok' | 'error'; message?: string };
	};
}

export async function GET() {
	const checks: HealthCheck = {
		status: 'ok',
		timestamp: new Date().toISOString(),
		checks: {
			database: { status: 'ok' },
			oidcKeys: { status: 'ok' },
		},
	};

	// Test database connectivity
	try {
		const result = db.prepare('SELECT 1 as test').get() as { test: number } | undefined;
		if (result?.test !== 1) {
			checks.checks.database = { status: 'error', message: 'Database query returned unexpected result' };
			checks.status = 'error';
		}
	} catch (err) {
		const message = err instanceof Error ? err.message : 'Unknown database error';
		checks.checks.database = { status: 'error', message };
		checks.status = 'error';
	}

	// Test OIDC key availability
	try {
		const keyPair = getKeyPair();
		if (!keyPair || !keyPair.privateKey) {
			checks.checks.oidcKeys = { status: 'error', message: 'OIDC private key not found' };
			checks.status = 'error';
		}
	} catch (err) {
		const message = err instanceof Error ? err.message : 'Unknown OIDC key error';
		checks.checks.oidcKeys = { status: 'error', message };
		checks.status = 'error';
	}

	const statusCode = checks.status === 'ok' ? 200 : 503;

	return new Response(JSON.stringify(checks, null, 2), {
		status: statusCode,
		headers: {
			'Content-Type': 'application/json',
		},
	});
}

