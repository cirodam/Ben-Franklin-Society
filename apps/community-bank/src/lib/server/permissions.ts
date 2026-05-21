/**
 * Community Bank Permission Constants
 * 
 * Permissions are now embedded in the OIDC access token and available
 * via session.permissions. No REST API calls needed.
 */

export const PERMISSIONS = {
	TELLER: 'teller',
	ADMIN: 'admin',
	ACT_AS: 'act_as',
	MANAGE_MONETARY: 'manage_monetary',
	COLLECT_DEMURRAGE: 'collect_demurrage',
} as const;
