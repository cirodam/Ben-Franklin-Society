import { db } from '$lib/server/core/db.js';
import { getConfig } from '$lib/server/config.js';

interface HealthCheck {
	status: 'ok' | 'error';
	timestamp: string;
	checks: {
		database: { status: 'ok' | 'error'; message?: string };
		oidcConfig: { status: 'ok' | 'error'; message?: string };
		governanceConnectivity: { status: 'ok' | 'error'; message?: string };
	};
}

export async function GET() {
	const checks: HealthCheck = {
		status: 'ok',
		timestamp: new Date().toISOString(),
		checks: {
			database: { status: 'ok' },
			oidcConfig: { status: 'ok' },
			governanceConnectivity: { status: 'ok' },
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

	// Test OIDC configuration
	try {
		const config = getConfig();
		if (!config) {
			checks.checks.oidcConfig = { status: 'error', message: 'OIDC configuration not found' };
			checks.status = 'error';
		} else if (!config.governance_url || !config.client_id || !config.client_secret) {
			checks.checks.oidcConfig = { status: 'error', message: 'Incomplete OIDC configuration' };
			checks.status = 'error';
		}
	} catch (err) {
		const message = err instanceof Error ? err.message : 'Unknown OIDC config error';
		checks.checks.oidcConfig = { status: 'error', message };
		checks.status = 'error';
	}

	// Test governance connectivity (with timeout)
	try {
		const config = getConfig();
		if (config?.governance_url) {
			const controller = new AbortController();
			const timeout = setTimeout(() => controller.abort(), 5000); // 5 second timeout

			const response = await fetch(`${config.governance_url}/health`, {
				signal: controller.signal,
			});

			clearTimeout(timeout);

			if (!response.ok) {
				checks.checks.governanceConnectivity = {
					status: 'error',
					message: `Governance returned status ${response.status}`,
				};
				checks.status = 'error';
			}
		} else {
			checks.checks.governanceConnectivity = { status: 'error', message: 'Governance URL not configured' };
			checks.status = 'error';
		}
	} catch (err) {
		const message = err instanceof Error ? err.message : 'Unknown connectivity error';
		checks.checks.governanceConnectivity = { status: 'error', message };
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

