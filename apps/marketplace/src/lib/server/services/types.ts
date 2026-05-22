/**
 * Type definitions for service listings
 */

export interface ServiceListing {
	uuid: string;
	provider_uuid: string;
	provider_handle_cache: string;
	provider_society_handle: string;
	title: string;
	description: string;
	category: string;
	rate: number;
	rate_unit: 'per_hour' | 'per_job' | 'negotiable';
	service_area: string | null;
	scope: 'local' | 'federated';
	status: 'active' | 'withdrawn' | 'removed';
	created_at: string;
}

export interface ServiceOpts {
	category?: string;
	keyword?: string;
	scope?: 'local' | 'federated';
	page?: number;
}

export interface CreateServiceOpts {
	provider_uuid: string;
	provider_handle_cache: string;
	provider_society_handle: string;
	title: string;
	description: string;
	category: string;
	rate: number;
	rate_unit: 'per_hour' | 'per_job' | 'negotiable';
	service_area: string | null;
	scope: 'local' | 'federated';
}

export interface UpdateServiceOpts {
	title: string;
	description: string;
	category: string;
	rate: number;
	rate_unit: 'per_hour' | 'per_job' | 'negotiable';
	service_area: string | null;
	scope: 'local' | 'federated';
}
