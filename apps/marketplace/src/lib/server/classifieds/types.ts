/**
 * Type definitions for classified listings
 */

export interface ClassifiedListing {
	uuid: string;
	seller_uuid: string;
	seller_handle_cache: string;
	seller_society_handle: string;
	title: string;
	description: string;
	category: string;
	price: number;
	price_negotiable: number; // 0 | 1
	scope: 'local' | 'federated';
	status: 'active' | 'withdrawn' | 'removed';
	expires_at: string | null;
	created_at: string;
}

export interface ClassifiedOpts {
	category?: string;
	keyword?: string;
	minPrice?: number;
	maxPrice?: number;
	negotiable?: boolean;
	scope?: 'local' | 'federated';
	page?: number;
}

export interface CreateClassifiedOpts {
	seller_uuid: string;
	seller_handle_cache: string;
	seller_society_handle: string;
	title: string;
	description: string;
	category: string;
	price: number;
	price_negotiable: boolean;
	scope: 'local' | 'federated';
	expires_at: string | null;
}

export interface UpdateClassifiedOpts {
	title: string;
	description: string;
	category: string;
	price: number;
	price_negotiable: boolean;
	scope: 'local' | 'federated';
	expires_at: string | null;
}
