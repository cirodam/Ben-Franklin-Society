/**
 * Rate Limiter
 * 
 * Simple in-memory rate limiter using sliding window.
 * For multi-instance deployments, consider Redis-backed rate limiting.
 */

interface RateLimitEntry {
	attempts: number[];
}

const store = new Map<string, RateLimitEntry>();

// Cleanup old entries every 10 minutes
setInterval(() => {
	const now = Date.now();
	for (const [key, entry] of store.entries()) {
		entry.attempts = entry.attempts.filter(t => now - t < 3600000); // Keep last hour
		if (entry.attempts.length === 0) {
			store.delete(key);
		}
	}
}, 600000);

export interface RateLimitConfig {
	/** Maximum number of attempts allowed */
	maxAttempts: number;
	/** Time window in milliseconds */
	windowMs: number;
	/** Optional: identifier for logging */
	context?: string;
}

export interface RateLimitResult {
	allowed: boolean;
	remaining: number;
	resetAt: Date;
}

/**
 * Check if a request is allowed under rate limit
 */
export function checkRateLimit(key: string, config: RateLimitConfig): RateLimitResult {
	const now = Date.now();
	const cutoff = now - config.windowMs;

	let entry = store.get(key);
	if (!entry) {
		entry = { attempts: [] };
		store.set(key, entry);
	}

	// Remove old attempts outside the window
	entry.attempts = entry.attempts.filter(t => t > cutoff);

	const remaining = config.maxAttempts - entry.attempts.length;
	const allowed = remaining > 0;

	if (allowed) {
		entry.attempts.push(now);
	}

	// Calculate when the oldest attempt will expire
	const oldestAttempt = entry.attempts[0] ?? now;
	const resetAt = new Date(oldestAttempt + config.windowMs);

	return { allowed, remaining: Math.max(0, remaining - 1), resetAt };
}

/**
 * Reset rate limit for a key (e.g., after successful login)
 */
export function resetRateLimit(key: string): void {
	store.delete(key);
}

/**
 * Get current rate limit status without incrementing
 */
export function getRateLimitStatus(key: string, config: RateLimitConfig): RateLimitResult {
	const now = Date.now();
	const cutoff = now - config.windowMs;

	const entry = store.get(key);
	if (!entry) {
		return {
			allowed: true,
			remaining: config.maxAttempts,
			resetAt: new Date(now + config.windowMs)
		};
	}

	const activeAttempts = entry.attempts.filter(t => t > cutoff);
	const remaining = config.maxAttempts - activeAttempts.length;
	const oldestAttempt = activeAttempts[0] ?? now;

	return {
		allowed: remaining > 0,
		remaining: Math.max(0, remaining),
		resetAt: new Date(oldestAttempt + config.windowMs)
	};
}

// Preset configurations
export const RATE_LIMITS = {
	LOGIN: {
		maxAttempts: 5,
		windowMs: 15 * 60 * 1000, // 15 minutes
		context: 'login'
	},
	API: {
		maxAttempts: 100,
		windowMs: 60 * 1000, // 1 minute
		context: 'api'
	},
	OIDC_AUTHORIZE: {
		maxAttempts: 10,
		windowMs: 60 * 1000, // 1 minute
		context: 'oidc_authorize'
	},
	OIDC_TOKEN: {
		maxAttempts: 10,
		windowMs: 60 * 1000, // 1 minute
		context: 'oidc_token'
	}
} as const;
