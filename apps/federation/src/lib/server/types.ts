export interface Society {
	uuid: string;
	handle: string;
	parent_uuid: string | null;
	public_key: string;
	bfs_url: string | null;
	url: string | null;
	ip_address: string | null;
	port: number;
	founded_at: number;
	registered_at: number;
	status: string;
	people_count: number | null;
	person_years: number | null;
	issued_florens: number;
}

export interface FoundingRecord {
	type: 'society_founding';
	parent: {
		handle: string;
		uuid: string;
		public_key: string;
	};
	child: {
		handle: string;
		uuid: string;
		public_key: string;
	};
	founded_at: string;
	parent_attestation: string;
	signature: string;
	members?: Array<{
		name: string;
		public_key: string;
		joined_at: string;
	}>;
}
