# Filter & Navigation Components

Components for browsing, filtering, and navigating listing collections.

---

## FilterPanel.svelte

**Purpose:** Unified filter sidebar for classifieds and services  
**File:** `src/lib/components/FilterPanel.svelte` (115 lines)  
**Usage:** Classifieds browse page, services browse page

### Props

```typescript
interface Props {
	type: 'classified' | 'service';
	categories: string[];
	filters: ClassifiedFilters | ServiceFilters;
	clearUrl: string;
}
```

### Features

- **Type-aware fields**: Shows price filters only for classifieds
- **Category dropdown**: Populated from available categories
- **Search input**: Keyword search across title and description
- **Scope selector**: Local vs federated listings
- **Conditional filters**: Price range and negotiable checkbox for classifieds only
- **Clear action**: Link to clear all filters
- **Form submission**: Uses GET method to update URL parameters

### Example Usage

```svelte
<script>
	import FilterPanel from '$lib/components/FilterPanel.svelte';
	
	let { categories, filters } = $props();
</script>

<div class="layout">
	<FilterPanel 
		type="classified"
		{categories}
		{filters}
		clearUrl="/classifieds"
	/>
	
	<div class="results">
		<!-- Listing results -->
	</div>
</div>

<style>
	.layout {
		display: grid;
		grid-template-columns: 260px 1fr;
		gap: var(--space-6);
	}
</style>
```

### Form Fields

**Common (both types):**
- `keyword` (text): Search term
- `category` (select): Category filter
- `scope` (select): 'local', 'federated', or 'all'

**Classified-specific:**
- `minPrice` (number): Minimum price
- `maxPrice` (number): Maximum price
- `negotiable` (checkbox): Only negotiable items

**Service-specific:**
- (Currently no service-specific filters, but structure supports them)

### Visual Design

```
┌─────────────────────┐
│ Search...           │ [text input]
├─────────────────────┤
│ Category            │
│ [All Categories ▼]  │
├─────────────────────┤
│ Price Range         │ (classifieds only)
│ Min: [____]         │
│ Max: [____]         │
│ ☐ Negotiable only   │
├─────────────────────┤
│ Scope               │
│ [All ▼]             │
├─────────────────────┤
│ [Apply Filters]     │
│ Clear filters       │
└─────────────────────┘
```

### Filter State Types

```typescript
interface ClassifiedFilters {
	keyword?: string;
	category?: string;
	minPrice?: number;
	maxPrice?: number;
	negotiable?: boolean;
	scope?: 'local' | 'federated';
	page?: number;
}

interface ServiceFilters {
	keyword?: string;
	category?: string;
	scope?: 'local' | 'federated';
	page?: number;
}
```

### Clear Filters

The "Clear filters" link resets to base URL:

```svelte
{#if Object.keys(filters).length > 0}
	<a href={clearUrl} class="clear-link">Clear filters</a>
{/if}
```

---

## Pagination.svelte

**Purpose:** Page navigation with prev/next controls  
**File:** `src/lib/components/Pagination.svelte` (39 lines)  
**Usage:** Any paginated list (classifieds, services, search results)

### Props

```typescript
interface Props {
	currentPage: number;     // 1-indexed
	totalPages: number;
	buildUrl: (page: number) => string;
}
```

### Features

- **Conditional rendering**: Only shows when totalPages > 1
- **Prev/Next buttons**: Disabled at boundaries
- **Page indicator**: "Page X of Y"
- **URL building**: Accepts function to construct page URLs
- **Accessibility**: Proper ARIA labels and disabled states

### Example Usage

```svelte
<script>
	import Pagination from '$lib/components/Pagination.svelte';
	import { buildClassifiedUrl } from '$lib/utils/url.js';
	import { PAGE_SIZE } from '$lib/constants.js';
	
	let { listings, total, filters, page } = $props();
	const totalPages = $derived(Math.ceil(total / PAGE_SIZE));
</script>

<List>
	{#each listings as listing}
		<!-- Listing rows -->
	{/each}
</List>

<Pagination 
	currentPage={page}
	{totalPages}
	buildUrl={(p) => buildClassifiedUrl('/classifieds', filters, { page: p })}
/>
```

### Visual Design

```
[← Previous]   Page 2 of 5   [Next →]

[← Previous]   Page 1 of 5   [Next →]  (Prev disabled)

[← Previous]   Page 5 of 5   [Next →]  (Next disabled)
```

### URL Building Pattern

The `buildUrl` function should preserve all current filters:

```typescript
// From src/lib/utils/url.ts
export function buildClassifiedUrl(
	basePath: string,
	currentFilters: ClassifiedFilters,
	overrides: Partial<ClassifiedFilters> = {}
): string {
	const params = new URLSearchParams();
	const filters = { ...currentFilters, ...overrides };
	
	if (filters.keyword) params.set('keyword', filters.keyword);
	if (filters.category) params.set('category', filters.category);
	if (filters.page && filters.page > 1) params.set('page', String(filters.page));
	// ... other filters
	
	const query = params.toString();
	return query ? `${basePath}?${query}` : basePath;
}
```

### Disabled States

```svelte
{#if currentPage > 1}
	<a href={buildUrl(currentPage - 1)}>← Previous</a>
{:else}
	<span class="disabled">← Previous</span>
{/if}

<span class="page-indicator">Page {currentPage} of {totalPages}</span>

{#if currentPage < totalPages}
	<a href={buildUrl(currentPage + 1)}>Next →</a>
{:else}
	<span class="disabled">Next →</span>
{/if}
```

---

## BrowseCard.svelte

**Purpose:** Category navigation cards for home page  
**File:** `src/lib/components/BrowseCard.svelte` (50 lines)  
**Usage:** Landing page category browse section

### Props

```typescript
interface Props {
	title: string;
	description: string;
	href: string;
}
```

### Features

- **Market stall styling**: Canvas background, thick border
- **Hover effects**: Green border on hover
- **Large title**: Prominent serif font
- **Description text**: Muted color, smaller size
- **Link card**: Entire card is clickable

### Example Usage

```svelte
<script>
	import BrowseCard from '$lib/components/BrowseCard.svelte';
</script>

<div class="browse-grid">
	<BrowseCard 
		title="Classifieds"
		description="Browse goods for sale by community members"
		href="/classifieds"
	/>
	
	<BrowseCard 
		title="Services"
		description="Find services offered by skilled providers"
		href="/services"
	/>
	
	<BrowseCard 
		title="Markets"
		description="Upcoming community markets and craft fairs"
		href="/markets"
	/>
</div>

<style>
	.browse-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
		gap: var(--space-5);
	}
</style>
```

### Visual Design

```
┌──────────────────────────────┐
│                              │
│      Classifieds             │  (large serif)
│                              │
│  Browse goods for sale by    │  (muted)
│  community members           │
│                              │
└──────────────────────────────┘
      ↑ Thick border, green on hover
```

### Styling

```css
.browse-card {
	display: flex;
	flex-direction: column;
	gap: var(--space-3);
	padding: var(--space-6);
	background: var(--canvas);
	border: 2px solid var(--deep-forest);
	border-radius: var(--radius-lg);
	text-decoration: none;
	transition: all 0.2s ease;
}

.browse-card:hover {
	border-color: var(--market-green);
	transform: translateY(-2px);
	box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.card-title {
	font-size: var(--text-xl);
	font-weight: var(--weight-bold);
	font-family: var(--font-serif);
	color: var(--charcoal);
}

.card-description {
	font-size: var(--text-sm);
	color: var(--slate);
	line-height: 1.6;
}
```

---

## Common Patterns

### Filter + List + Pagination Pattern

Standard paginated list page:

```svelte
<script>
	import { FilterPanel, Pagination } from '$lib/components';
	import { List, ListItem } from '@bfs/ui';
	import ListingRow from '$lib/components/ListingRow.svelte';
	import { buildClassifiedUrl } from '$lib/utils/url.js';
	import { PAGE_SIZE } from '$lib/constants.js';
	
	let { data } = $props();
	const { listings, total, categories, filters, page } = $derived(data);
	const totalPages = $derived(Math.ceil(total / PAGE_SIZE));
</script>

<div class="page-layout">
	<FilterPanel 
		type="classified"
		{categories}
		{filters}
		clearUrl="/classifieds"
	/>
	
	<div class="results">
		<h1>Classifieds {#if filters.category}· {filters.category}{/if}</h1>
		
		{#if listings.length === 0}
			<EmptyState title="No listings found" />
		{:else}
			<List>
				{#each listings as listing}
					<ListItem>
						<ListingRow 
							type="classified"
							{listing}
							href="/classifieds/{listing.uuid}"
						/>
					</ListItem>
				{/each}
			</List>
			
			<Pagination 
				currentPage={page}
				{totalPages}
				buildUrl={(p) => buildClassifiedUrl('/classifieds', filters, { page: p })}
			/>
		{/if}
	</div>
</div>

<style>
	.page-layout {
		display: grid;
		grid-template-columns: 260px 1fr;
		gap: var(--space-6);
		align-items: start;
	}
	
	.results {
		display: flex;
		flex-direction: column;
		gap: var(--space-5);
	}
</style>
```

### Browse Grid Pattern

Home page category navigation:

```svelte
<section class="browse-section">
	<h2>Browse by Category</h2>
	
	<div class="browse-grid">
		<BrowseCard 
			title="Classifieds"
			description="Browse goods for sale by community members"
			href="/classifieds"
		/>
		<BrowseCard 
			title="Services"
			description="Find services offered by skilled providers"
			href="/services"
		/>
		<BrowseCard 
			title="Markets"
			description="Upcoming community markets and craft fairs"
			href="/markets"
		/>
	</div>
</section>

<style>
	.browse-section {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
	}
	
	h2 {
		font-size: var(--text-xl);
		font-weight: var(--weight-bold);
		font-family: var(--font-serif);
	}
	
	.browse-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
		gap: var(--space-5);
	}
</style>
```

---

## URL Building Utilities

All navigation components work with type-safe URL builders:

### buildClassifiedUrl

```typescript
export function buildClassifiedUrl(
	basePath: string,
	currentFilters: ClassifiedFilters,
	overrides: Partial<ClassifiedFilters> = {}
): string {
	const params = new URLSearchParams();
	const filters = { ...currentFilters, ...overrides };
	
	if (filters.keyword) params.set('keyword', filters.keyword);
	if (filters.category) params.set('category', filters.category);
	if (filters.minPrice !== undefined) params.set('minPrice', String(filters.minPrice));
	if (filters.maxPrice !== undefined) params.set('maxPrice', String(filters.maxPrice));
	if (filters.negotiable) params.set('negotiable', '1');
	if (filters.scope) params.set('scope', filters.scope);
	if (filters.page && filters.page > 1) params.set('page', String(filters.page));
	
	const query = params.toString();
	return query ? `${basePath}?${query}` : basePath;
}
```

### buildServiceUrl

```typescript
export function buildServiceUrl(
	basePath: string,
	currentFilters: ServiceFilters,
	overrides: Partial<ServiceFilters> = {}
): string {
	const params = new URLSearchParams();
	const filters = { ...currentFilters, ...overrides };
	
	if (filters.keyword) params.set('keyword', filters.keyword);
	if (filters.category) params.set('category', filters.category);
	if (filters.scope) params.set('scope', filters.scope);
	if (filters.page && filters.page > 1) params.set('page', String(filters.page));
	
	const query = params.toString();
	return query ? `${basePath}?${query}` : basePath;
}
```

---

## Testing Examples

### FilterPanel

```typescript
import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import FilterPanel from './FilterPanel.svelte';

describe('FilterPanel', () => {
	it('shows price filters for classifieds', () => {
		render(FilterPanel, {
			props: {
				type: 'classified',
				categories: ['Tools', 'Electronics'],
				filters: {},
				clearUrl: '/classifieds',
			},
		});
		
		expect(screen.getByLabelText('Min Price')).toBeInTheDocument();
		expect(screen.getByLabelText('Max Price')).toBeInTheDocument();
		expect(screen.getByLabelText('Negotiable only')).toBeInTheDocument();
	});
	
	it('hides price filters for services', () => {
		render(FilterPanel, {
			props: {
				type: 'service',
				categories: ['Plumbing', 'Carpentry'],
				filters: {},
				clearUrl: '/services',
			},
		});
		
		expect(screen.queryByLabelText('Min Price')).not.toBeInTheDocument();
	});
});
```

### Pagination

```typescript
import { render, screen } from '@testing-library/svelte';
import Pagination from './Pagination.svelte';

describe('Pagination', () => {
	it('disables prev on first page', () => {
		render(Pagination, {
			props: {
				currentPage: 1,
				totalPages: 5,
				buildUrl: (p) => `/page?p=${p}`,
			},
		});
		
		expect(screen.getByText('← Previous')).toHaveClass('disabled');
		expect(screen.getByText('Next →')).not.toHaveClass('disabled');
	});
	
	it('disables next on last page', () => {
		render(Pagination, {
			props: {
				currentPage: 5,
				totalPages: 5,
				buildUrl: (p) => `/page?p=${p}`,
			},
		});
		
		expect(screen.getByText('← Previous')).not.toHaveClass('disabled');
		expect(screen.getByText('Next →')).toHaveClass('disabled');
	});
	
	it('hides when only one page', () => {
		const { container } = render(Pagination, {
			props: {
				currentPage: 1,
				totalPages: 1,
				buildUrl: (p) => `/page?p=${p}`,
			},
		});
		
		expect(container.firstChild).toBeNull();
	});
});
```

---

## Related Documentation

- [Listing Components](components_listings.md)
- [Component Library Overview](README.md)
- [URL Building Utilities](../utilities.md)
- [Design System](../design_system.md)
