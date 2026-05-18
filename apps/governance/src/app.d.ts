import type { Session } from '$lib/server/infrastructure/auth.js';
import type { Person } from '$lib/server/organization/people.js';

declare global {
	namespace App {
		interface Locals {
			session: Session | null;
			person: Person | null;
		}
	}
}

export {};
