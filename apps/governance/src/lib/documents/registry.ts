import type { ComponentType } from 'svelte';
import type { LibraryDocument, LibraryItemSummary } from '$lib/server/documents/library-types.js';
import type { Person } from '$lib/server/schema.js';

/**
 * Configuration for a document type in the library system.
 * Each document type (governing, motion, budget, etc.) registers its behavior here.
 */
export interface DocumentTypeConfig<TContent = any> {
	/** Unique type identifier (e.g., "governing", "motion") */
	type: string;

	/** Display name singular (e.g., "Governing Document") */
	label: string;

	/** Display name plural (e.g., "Governing Documents") */
	pluralLabel: string;

	/** Emoji icon for UI display */
	icon: string;

	/** Directory path for file storage (e.g., "governing", "motions") */
	directory: string;

	/** Allowed status values for this document type */
	statuses: readonly string[];

	/** Generate the detail route URL for a document */
	detailRoute: (doc: LibraryItemSummary | LibraryDocument<TContent>) => string;

	/** Load a full document by slug */
	loadBySlug: (slug: string) => LibraryDocument<TContent> | null | Promise<LibraryDocument<TContent> | null>;

	/** Load a full document by UUID */
	loadByUuid?: (uuid: string) => LibraryDocument<TContent> | null | Promise<LibraryDocument<TContent> | null>;

	/** Get subtitle text to display in lists (e.g., "Charter" for governing docs) */
	getSubtitle?: (doc: LibraryItemSummary | LibraryDocument<TContent>) => string;

	/** Get CSS class for status badges */
	getStatusClass?: (status: string) => string;

	/** Check if person can create this document type */
	canCreate?: (person: Person) => boolean;

	/** Check if person can edit this specific document */
	canEdit?: (person: Person, doc: LibraryDocument<TContent>) => boolean;

	/** Check if person can view this specific document */
	canView?: (person: Person, doc: LibraryDocument<TContent>) => boolean;
}

/**
 * Central registry of all document types in the system.
 */
class DocumentTypeRegistry {
	private types = new Map<string, DocumentTypeConfig>();

	/**
	 * Register a new document type.
	 * If the type is already registered, it will be replaced (for HMR support).
	 */
	register(config: DocumentTypeConfig): void {
		this.types.set(config.type, config);
	}

	/**
	 * Get configuration for a document type.
	 */
	get(type: string): DocumentTypeConfig {
		const config = this.types.get(type);
		if (!config) {
			throw new Error(`Document type "${type}" is not registered`);
		}
		return config;
	}

	/**
	 * Check if a document type is registered.
	 */
	has(type: string): boolean {
		return this.types.has(type);
	}

	/**
	 * Get all registered document types.
	 */
	getAll(): DocumentTypeConfig[] {
		return Array.from(this.types.values());
	}

	/**
	 * Get all document type identifiers.
	 */
	getAllTypes(): string[] {
		return Array.from(this.types.keys());
	}

	/**
	 * Get icon for a document type.
	 */
	getIcon(type: string): string {
		return this.get(type).icon;
	}

	/**
	 * Get detail route for a document.
	 */
	getDetailRoute(doc: LibraryItemSummary | LibraryDocument<any>): string {
		return this.get(doc.type).detailRoute(doc);
	}

	/**
	 * Get subtitle for a document.
	 */
	getSubtitle(doc: LibraryItemSummary | LibraryDocument<any>): string {
		const config = this.get(doc.type);
		return config.getSubtitle ? config.getSubtitle(doc) : config.label;
	}

	/**
	 * Get status CSS class for a document.
	 */
	getStatusClass(doc: LibraryItemSummary, status: string): string {
		const config = this.get(doc.type);
		return config.getStatusClass ? config.getStatusClass(status) : `status--${status}`;
	}

	/**
	 * Get directory path for a document type.
	 */
	getDirectory(type: string): string {
		return this.get(type).directory;
	}

	/**
	 * Load a document by slug using type-specific loader.
	 */
	loadBySlug(type: string, slug: string): LibraryDocument<any> | null | Promise<LibraryDocument<any> | null> {
		return this.get(type).loadBySlug(slug);
	}

	/**
	 * Load a document by UUID using type-specific loader.
	 */
	loadByUuid(type: string, uuid: string): LibraryDocument<any> | null | Promise<LibraryDocument<any> | null> {
		const config = this.get(type);
		if (config.loadByUuid) {
			return config.loadByUuid(uuid);
		}
		// Fallback: query database for slug, then load by slug
		return null;
	}

	/**
	 * Get all statuses across all document types.
	 */
	getAllStatuses(): string[] {
		const statusSet = new Set<string>();
		for (const config of this.types.values()) {
			for (const status of config.statuses) {
				statusSet.add(status);
			}
		}
		return Array.from(statusSet);
	}

	/**
	 * Get statuses for specific document types.
	 */
	getStatusesForTypes(types: string[]): string[] {
		const statusSet = new Set<string>();
		for (const type of types) {
			const config = this.get(type);
			for (const status of config.statuses) {
				statusSet.add(status);
			}
		}
		return Array.from(statusSet);
	}
}

/**
 * Global document type registry instance.
 */
export const documentTypes = new DocumentTypeRegistry();
