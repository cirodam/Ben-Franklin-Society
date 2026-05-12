/**
 * Community Bank Permission Constants
 * 
 * Permissions are now embedded in the OIDC access token and available
 * via session.permissions. No REST API calls needed.
 */

export const PERMISSIONS = {
	TELLER: 'teller',
	ADMIN: 'admin',
} as const;
