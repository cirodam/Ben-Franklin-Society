// ============================================================================
// Bulletin Types
// ============================================================================

export interface BulletinPost {
	uuid: string;
	author_uuid: string;
	association_uuid: string | null;
	title: string;
	body: string;
	visibility: 'public' | 'members_only' | 'officers_only';
	category: 'announcement' | 'discussion' | 'question' | 'event' | 'policy' | null;
	created_at: string;
	updated_at: string | null;
	expires_at: string | null;
	deleted_at: string | null;
	pinned_at: string | null;
}

export interface BulletinPostWithAuthor extends BulletinPost {
	author_given_name: string;
	author_family_name: string;
	author_handle: string;
	comment_count: number;
	association_name?: string;
	association_handle?: string;
}

export interface BulletinComment {
	uuid: string;
	post_uuid: string;
	author_uuid: string;
	body: string;
	created_at: string;
	deleted_at: string | null;
}

export interface BulletinCommentWithAuthor extends BulletinComment {
	author_given_name: string;
	author_family_name: string;
	author_handle: string;
}
