# Listing Components

Display components for marketplace listings (classifieds and services).

---

## ListingCard.svelte

**Purpose:** Card-style display for grid layouts (browse/landing page)  
**File:** `src/lib/components/ListingCard.svelte` (103 lines)  
**Usage:** Recent listings grid, search results

### Props

```typescript
interface Props {
	type: 'classified' | 'service';
	listing: ClassifiedListing | ServiceListing;
	href: string;
}
```

### Features

- **Market stall aesthetic**: Canvas background, visible border, hover lift
- **Type-aware rendering**: Displays price OR rate based on type
- **Seller/provider display**: Formatted handle with link
- **Category badge**: Uppercase category tag
- **Title display**: Serif font, product name styling
- **Hover effects**: Border color change + subtle lift animation

### Example Usage

```svelte
<script>
	import ListingCard from '$lib/components/ListingCard.svelte';
	import type { ClassifiedListing } from '$lib/server/listings.js';
	
	let { recentClassifieds }: { recentClassifieds: ClassifiedListing[] } = $props();
</script>

<div class="grid">
	{#each recentClassifieds as listing}
		<ListingCard 
			type="classified"
			{listing}
			href="/classifieds/{listing.uuid}"
		/>
	{/each}
</div>

<style>
	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
		gap: var(--space-5);
	}
</style>
```

### Visual Design

```
┌─────────────────────────┐
│ [Category Badge]        │
│ Product Title           │
│ $50.00 (or negotiable)  │
│ @seller_handle          │
└─────────────────────────┘
   ↑ Hover: lifts 2px
```

### Type-Specific Behavior

**Classified:**
- Shows `formatPrice(price, price_negotiable)`
- Links to `/classifieds?seller={seller_uuid}`
- Displays `seller_handle_cache`

**Service:**
- Shows `formatRate(rate, rate_unit)`
- No seller link (provider not linkable)
- Displays `provider_handle_cache`

---

## ListingRow.svelte

**Purpose:** Compact horizontal row for list displays  
**File:** `src/lib/components/ListingRow.svelte` (72 lines)  
**Usage:** Classifieds list, services list, my-listings page

### Props

```typescript
interface Props {
	type: 'classified' | 'service';
	listing: ClassifiedListing | ServiceListing;
	href: string;
}
```

### Features

- **Grid layout**: 140px category, 1fr title, auto price, auto date
- **Compact display**: Single-line row with key information
- **Shortened formatting**: Uses `formatPriceShort()` and `formatRate()`
- **Seller display**: Simple text handle, no link
- **Date display**: Formatted creation date

### Example Usage

```svelte
<script>
	import { List, ListItem } from '@bfs/ui';
	import ListingRow from '$lib/components/ListingRow.svelte';
	
	let { listings }: { listings: ClassifiedListing[] } = $props();
</script>

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
```

### Visual Design

```
[Category    ] | Title of the listing          | $50 | May 21
[Tools       ] | Vintage hammer with...        | $25 | May 20
[Electronics ] | Laptop for sale (negotiable)  | $300| May 19
```

### Grid Structure

```css
.row {
	display: grid;
	grid-template-columns: 140px 1fr auto auto;
	gap: var(--space-4);
	align-items: center;
}
```

---

## ListingDetail.svelte

**Purpose:** Full detail view with description, actions, and report form  
**File:** `src/lib/components/ListingDetail.svelte` (204 lines)  
**Usage:** Classified detail page, service detail page

### Props

```typescript
interface Props {
	type: 'classified' | 'service';
	listing: ClassifiedListing | ServiceListing;
	isOwn: boolean;
	mailUrl: string;
	form?: { reported?: boolean; reportError?: string };
	additionalNote?: Snippet;  // Optional content injection
}
```

### Features

- **Full detail display**: Category, title, price/rate, metadata, description
- **Type-aware metadata**: Shows expires_at for classifieds, service_area for services
- **Contact button**: Links to mail compose with pre-filled subject
- **Report system**: Expandable report form (hidden for own listings)
- **Form state handling**: Success/error messages from SvelteKit form actions
- **Snippet support**: Inject custom content (e.g., payment instructions)

### Example Usage

```svelte
<script>
	import ListingDetail from '$lib/components/ListingDetail.svelte';
	
	let { data, form } = $props();
	const { listing, isOwn } = data;
	
	const mailUrl = $derived(
		`${MAIL_URL}/compose?to_raw=@${listing.seller_handle_cache}&subject=${encodeURIComponent(`Re: ${listing.title}`)}`
	);
</script>

<ListingDetail 
	type="classified"
	{listing}
	{isOwn}
	{mailUrl}
	{form}
/>

<!-- With optional note snippet -->
<ListingDetail type="service" {listing} {isOwn} {mailUrl} {form}>
	{#snippet additionalNote()}
		<p class="note">Payment settled through Community Bank.</p>
	{/snippet}
</ListingDetail>
```

### Visual Design

```
CATEGORY (small uppercase)
═══════════════════════════
Large Title in Serif Font
$50.00 (bold display font)

Listed by @seller · May 21 · Expires Jun 21

┌─────────────────────────┐
│ Description text with   │
│ line wrapping and       │
│ proper formatting       │
└─────────────────────────┘

[Contact seller via Mail]

Report this listing (expandable)
```

### Report Form Flow

1. User clicks "Report this listing"
2. Form expands with textarea
3. User enters reason
4. Submit → Server action → Success/error message
5. Form collapses on success

### Type-Specific Fields

**Classified:**
- Price with negotiable indicator
- Seller handle (linked to filter)
- Expiration date (if set)

**Service:**
- Rate with unit
- Provider handle (not linked)
- Service area (if set)

---

## RelatedListings.svelte

**Purpose:** Sidebar component for showing related listings  
**File:** `src/lib/components/RelatedListings.svelte` (64 lines)  
**Usage:** Detail page sidebars

### Props

```typescript
interface RelatedSection {
	label: string;
	items: Array<{ uuid: string; title: string }>;
	basePath: string;  // '/classifieds' or '/services'
}

interface Props {
	sections: RelatedSection[];
}
```

### Features

- **Multiple sections**: Group related items by category
- **Conditional rendering**: Only shows sections with items
- **Flexible paths**: Each section defines its own base path
- **Truncated titles**: Ellipsis for long titles
- **Hover effects**: Underline on hover

### Example Usage

```svelte
<script>
	import RelatedListings from '$lib/components/RelatedListings.svelte';
	
	const relatedSections = $derived([
		{
			label: `More from @${listing.seller_handle_cache}`,
			items: otherClassifieds,
			basePath: '/classifieds',
		},
		{
			label: 'Services offered',
			items: sellerServices,
			basePath: '/services',
		},
	]);
</script>

<RelatedListings sections={relatedSections} />
```

### Visual Design

```
MORE FROM @SELLER
─────────────────
Vintage tools set
Garden supplies
Old books collecti...

SERVICES OFFERED
─────────────────
Carpentry services
Furniture repair
```

### Section Structure

Each section renders only if it has items:

```svelte
{#each sections as section}
	{#if section.items.length > 0}
		<div class="sidebar-section">
			<div class="sidebar-label">{section.label}</div>
			{#each section.items as item}
				<a href="{section.basePath}/{item.uuid}">
					{item.title}
				</a>
			{/each}
		</div>
	{/if}
{/each}
```

---

## Common Patterns

### Type Guards

All listing components use type narrowing:

```typescript
const priceDisplay = $derived(() => {
	if (type === 'classified') {
		const l = listing as ClassifiedListing;
		return formatPrice(l.price, l.price_negotiable);
	} else {
		const l = listing as ServiceListing;
		return formatRate(l.rate, l.rate_unit);
	}
});
```

### Conditional Metadata

```svelte
{#if type === 'classified'}
	{@const classifiedListing = listing as ClassifiedListing}
	{#if classifiedListing.expires_at}
		<span>Expires {formatDate(classifiedListing.expires_at)}</span>
	{/if}
{:else}
	{@const serviceListing = listing as ServiceListing}
	{#if serviceListing.service_area}
		<span>Area: {serviceListing.service_area}</span>
	{/if}
{/if}
```

---

## Styling Conventions

All listing components follow these conventions:

### Card/Container

```css
.listing-detail, .card {
	display: flex;
	flex-direction: column;
	gap: var(--space-4);
}
```

### Category Tags

```css
.listing-category {
	font-size: var(--text-xs);
	color: var(--color-text-muted);
	text-transform: uppercase;
	letter-spacing: 0.06em;
}
```

### Title

```css
h1 {
	margin: 0;
	font-size: var(--text-2xl);
	font-weight: var(--weight-bold);
	font-family: var(--font-serif);
}
```

### Price/Rate

```css
.listing-price {
	font-size: var(--text-xl);
	font-weight: var(--weight-bold);
	color: var(--color-accent);
	font-family: var(--font-display);
}
```

### Description Box

```css
.listing-description {
	padding: var(--space-4);
	background: var(--color-surface-alt);
	border: 1px solid var(--color-border-faint);
	border-radius: var(--radius-md);
}

.listing-description pre {
	margin: 0;
	white-space: pre-wrap;
	font-family: inherit;
	font-size: var(--text-sm);
	line-height: 1.7;
}
```

---

## Testing Examples

### ListingCard

```typescript
import { render, screen } from '@testing-library/svelte';
import ListingCard from './ListingCard.svelte';

describe('ListingCard', () => {
	it('displays classified with price', () => {
		const classified = {
			uuid: '123',
			title: 'Test Item',
			category: 'Tools',
			price: 50,
			price_negotiable: 0,
			seller_handle_cache: 'alice',
			// ... other fields
		};
		
		render(ListingCard, {
			props: {
				type: 'classified',
				listing: classified,
				href: '/classifieds/123',
			},
		});
		
		expect(screen.getByText('Test Item')).toBeInTheDocument();
		expect(screen.getByText('$50.00')).toBeInTheDocument();
		expect(screen.getByText('@alice')).toBeInTheDocument();
	});
	
	it('displays service with rate', () => {
		const service = {
			uuid: '456',
			title: 'Plumbing',
			category: 'Services',
			rate: 75,
			rate_unit: 'per_hour',
			provider_handle_cache: 'bob',
			// ... other fields
		};
		
		render(ListingCard, {
			props: {
				type: 'service',
				listing: service,
				href: '/services/456',
			},
		});
		
		expect(screen.getByText('Plumbing')).toBeInTheDocument();
		expect(screen.getByText('$75.00/hr')).toBeInTheDocument();
	});
});
```

---

## Related Documentation

- [Component Library Overview](README.md)
- [Filter & Navigation Components](components_filters.md)
- [Design System](../design_system.md)
