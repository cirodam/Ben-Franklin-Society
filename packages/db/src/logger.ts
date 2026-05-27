/**
 * Simple structured logging utility
 * Logs JSON objects to stdout for easy parsing and monitoring
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
	timestamp: string;
	level: LogLevel;
	message: string;
	context?: string;
	[key: string]: unknown;
}

/**
 * Create a logger instance with optional context
 */
export function createLogger(context?: string) {
	const log = (level: LogLevel, message: string, meta?: Record<string, unknown>) => {
		const entry: LogEntry = {
			timestamp: new Date().toISOString(),
			level,
			message,
			...(context && { context }),
			...meta,
		};

		// In production, log as JSON for easy parsing
		// In development, use pretty format
		if (process.env.NODE_ENV === 'production') {
			console.log(JSON.stringify(entry));
		} else {
			const levelEmoji = {
				debug: '🔍',
				info: 'ℹ️',
				warn: '⚠️',
				error: '❌',
			};
			const emoji = levelEmoji[level] || '';
			const prefix = context ? `[${context}]` : '';
			console.log(`${emoji} ${prefix} ${message}`, meta || '');
		}
	};

	return {
		debug: (message: string, meta?: Record<string, unknown>) => log('debug', message, meta),
		info: (message: string, meta?: Record<string, unknown>) => log('info', message, meta),
		warn: (message: string, meta?: Record<string, unknown>) => log('warn', message, meta),
		error: (message: string, meta?: Record<string, unknown>) => log('error', message, meta),
	};
}

// Export a default logger for quick use
export const logger = createLogger();
