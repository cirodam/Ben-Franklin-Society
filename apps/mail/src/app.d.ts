// See https://kit.svelte.dev/docs/types#app
import type { Session } from '@bfs/oidc-client';

declare global {
	namespace App {
		interface Locals {
			session: Session | null;
		}
	}
}

export {};
