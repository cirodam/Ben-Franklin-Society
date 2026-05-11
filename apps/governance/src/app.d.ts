import type { Session } from '$lib/server/auth.js';
import type { Person } from '$lib/server/people.js';

declare global {
	namespace App {
		interface Locals {
			session: Session | null;
			person: Person | null;
		}
	}
}

export {};
