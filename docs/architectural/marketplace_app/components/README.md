# Marketplace Component Library

**Location:** `/apps/marketplace/src/lib/components/`  
**Version:** 1.0  
**Last Updated:** May 21, 2026

---

## Overview

The Marketplace component library provides **reusable, type-safe UI components** specifically designed for displaying, browsing, and managing marketplace listings (classifieds and services). All components follow the [market/craft fair aesthetic](../design_system.md) and integrate seamlessly with the shared `@bfs/ui` library.

### Library Organization

Components are organized by function:

```
src/lib/components/
├── ListingCard.svelte       # Grid card display for browse/landing
├── ListingRow.svelte        # Compact row display for lists
├── ListingDetail.svelte     # Full detail view with actions
├── RelatedListings.svelte   # Sidebar for related items
├── FilterPanel.svelte       # Filter sidebar with search
├── Pagination.svelte        # Page navigation controls
├── BrowseCard.svelte        # Category browse cards
├── ContextSwitcher.svelte   # Multi-society context switching
└── ContextBadge.svelte      # Society badge display
```

---

## Component Categories

### Listing Display Components

**Purpose:** Display classified and service listings in various formats

- **ListingCard** (103 lines): Card-style display for grids
- **ListingRow** (72 lines): Horizontal row for lists
- **ListingDetail** (204 lines): Full detail view with report form
- **RelatedListings** (64 lines): Sidebar component for related items

**Design Pattern:** All listing components accept `type: 'classified' | 'service'` and intelligently render type-specific fields (price vs rate, seller vs provider, etc.).

### Filter & Navigation Components

**Purpose:** Browse, search, and paginate listing collections

- **FilterPanel** (115 lines): Unified filter sidebar for both listing types
- **Pagination** (39 lines): Page navigation with prev/next
- **BrowseCard** (50 lines): Category navigation cards

### Utility Components

**Purpose:** App-specific UI elements

- **ContextSwitcher** (~230 lines): Society/principal switching
- **ContextBadge** (~40 lines): Display current context

---

## Component Metrics

| Component | Lines | Complexity | Reusability |
|-----------|-------|------------|-------------|
| ListingCard | 103 | Medium | High |
| ListingRow | 72 | Low | High |
| ListingDetail | 204 | High | High |
| RelatedListings | 64 | Low | High |
| FilterPanel | 115 | Medium | Medium |
| Pagination | 39 | Low | High |
| BrowseCard | 50 | Low | High |
| ContextSwitcher | ~230 | High | Medium |
| ContextBadge | ~40 | Low | Medium |

**Total:** 9 components, ~1,003 lines

---

## Design Principles

### 1. Type Safety

All components use TypeScript interfaces for props:

```typescript
interface Props {
	type: 'classified' | 'service';
	listing: ClassifiedListing | ServiceListing;
	href: string;
}
```

### 2. Svelte 5 Runes

Components use modern Svelte 5 syntax:

```svelte
<script lang="ts">
	let { type, listing, href }: Props = $props();
	
	const priceDisplay = $derived(
		type === 'classified' 
			? formatPrice(listing.price) 
			: formatRate(listing.rate)
	);
</script>
```

### 3. Shared UI Library Integration

Components import and compose `@bfs/ui` components:

```svelte
import { Button, Badge, Alert, Input } from '@bfs/ui';
```

### 4. Market Aesthetic

All components use marketplace design tokens:

```css
.card {
	background: var(--stall-surface);
	border: 2px solid var(--border);
	color: var(--charcoal);
}

.card:hover {
	border-color: var(--market-green);
}
```

### 5. Snippet Support

Components use Svelte 5 snippets for flexible content injection:

```svelte
interface Props {
	additionalNote?: Snippet;
}

{#if additionalNote}
	{@render additionalNote()}
{/if}
```

---

## Usage Patterns

### Pattern 1: Listing Display Progression

**Browse → List → Detail**

1. **Landing page**: `ListingCard` in grid layout
2. **Category page**: `ListingRow` in list layout
3. **Detail page**: `ListingDetail` with full information

### Pattern 2: Type-Aware Rendering

All listing components handle both classifieds and services:

```svelte
<ListingCard 
	type="classified"
	listing={classified}
	href="/classifieds/{classified.uuid}"
/>

<ListingCard 
	type="service"
	listing={service}
	href="/services/{service.uuid}"
/>
```

The component internally renders:
- **Classifieds**: price, negotiable indicator, seller_handle, expires_at
- **Services**: rate, rate_unit, provider_handle, service_area

### Pattern 3: Filter + Pagination

Standard list page pattern:

```svelte
<FilterPanel 
	type="classified"
	categories={categories}
	filters={currentFilters}
	clearUrl="/classifieds"
/>

<List>
	{#each listings as listing}
		<ListItem>
			<ListingRow {type} {listing} href="/classifieds/{listing.uuid}" />
		</ListItem>
	{/each}
</List>

<Pagination 
	currentPage={page}
	totalPages={Math.ceil(total / PAGE_SIZE)}
	buildUrl={(p) => buildClassifiedUrl('/classifieds', filters, { page: p })}
/>
```

### Pattern 4: Related Listings Sidebar

Detail page sidebar pattern:

```svelte
<RelatedListings sections={[
	{
		label: 'More from @seller',
		items: otherClassifieds,
		basePath: '/classifieds',
	},
	{
		label: 'Services offered',
		items: sellerServices,
		basePath: '/services',
	},
]} />
```

---

## Common Props

### Listing Components

All listing display components share common props:

```typescript
type: 'classified' | 'service'  // Determines display logic
listing: ClassifiedListing | ServiceListing  // Data to display
href?: string  // Link destination (optional for some)
```

### Filter Components

```typescript
type: 'classified' | 'service'  // Determines available filters
categories: string[]  // Available categories
filters: FilterState  // Current filter values
clearUrl: string  // URL for "Clear filters" action
```

### Navigation Components

```typescript
currentPage: number  // Current page (1-indexed)
totalPages: number  // Total page count
buildUrl: (page: number) => string  // URL builder function
```

---

## Styling Guidelines

### Component-Scoped Styles

All components use scoped `<style>` blocks:

```svelte
<style>
	.card {
		/* Component-specific styles */
	}
</style>
```

### Global Class Targeting

Use `:global()` for styling child @bfs/ui components:

```svelte
<style>
	:global(.contact-btn) {
		align-self: flex-start;
	}
</style>
```

### Design Token Usage

Always use CSS variables, never hardcoded values:

```css
/* ✅ Good */
color: var(--market-green);
font-family: var(--font-serif);
padding: var(--space-4);

/* ❌ Bad */
color: #4a7c59;
font-family: 'Crimson Pro';
padding: 1rem;
```

---

## Testing Patterns

### Unit Testing

Components should be testable with Vitest + Testing Library:

```typescript
import { render, screen } from '@testing-library/svelte';
import ListingCard from './ListingCard.svelte';

test('displays classified price', () => {
	render(ListingCard, {
		props: {
			type: 'classified',
			listing: mockClassified,
			href: '/classifieds/123',
		},
	});
	
	expect(screen.getByText('$50.00')).toBeInTheDocument();
});
```

### Integration Testing

Test component interactions:

```typescript
test('FilterPanel submits filters', async () => {
	const { component } = render(FilterPanel, {
		props: { type: 'classified', categories: ['Tools'], filters: {} },
	});
	
	await userEvent.type(screen.getByPlaceholderText('Search…'), 'hammer');
	await userEvent.click(screen.getByText('Apply'));
	
	// Assert URL navigation
});
```

---

## Component Documentation

Detailed documentation for each component:

- **[Listing Components](components_listings.md)** - ListingCard, ListingRow, ListingDetail, RelatedListings
- **[Filter & Navigation](components_filters.md)** - FilterPanel, Pagination, BrowseCard
- **[Utility Components](components_utility.md)** - ContextSwitcher, ContextBadge

---

## Adding New Components

### Checklist

When creating a new component:

1. ✅ Use TypeScript for all props
2. ✅ Follow Svelte 5 runes syntax ($props, $derived, $state)
3. ✅ Use design tokens (no hardcoded colors/spacing)
4. ✅ Compose with @bfs/ui components where possible
5. ✅ Add TypeScript interface for props
6. ✅ Document props and usage
7. ✅ Add to component library docs
8. ✅ Write unit tests

### Template

```svelte
<script lang="ts">
	import { Button } from '@bfs/ui';
	
	interface Props {
		title: string;
		description?: string;
	}
	
	let { title, description }: Props = $props();
</script>

<div class="component">
	<h2>{title}</h2>
	{#if description}
		<p>{description}</p>
	{/if}
</div>

<style>
	.component {
		padding: var(--space-4);
		background: var(--canvas);
		border: 1px solid var(--border);
		border-radius: var(--radius-lg);
	}
	
	h2 {
		margin: 0;
		font-size: var(--text-lg);
		color: var(--charcoal);
	}
	
	p {
		margin: var(--space-2) 0 0;
		color: var(--slate);
		font-size: var(--text-sm);
	}
</style>
```

---

## Migration Notes

### From Inline Markup to Components

Before refactoring, listing markup was duplicated across 6+ pages. The refactoring extracted:

- **~180 lines** from detail pages → `ListingDetail` component
- **~150 lines** from list pages → `ListingRow` component
- **~100 lines** from browse page → `ListingCard` component
- **~140 lines** from filter forms → `FilterPanel` component

**Total**: ~570 lines of duplicated markup eliminated

### Benefits Realized

1. **Single source of truth**: Change listing display once, applies everywhere
2. **Type safety**: TypeScript catches prop errors at compile time
3. **Consistency**: All pages show listings identically
4. **Maintainability**: Small, focused components easier to understand
5. **Reusability**: Components used 2-6 times each across app

---

## Future Enhancements

### Potential Additions

- **ListingForm.svelte**: Unified form for creating/editing listings
- **ImageUploader.svelte**: Image attachment for listings
- **MarketCard.svelte**: Physical market display component
- **SessionScheduler.svelte**: Market session scheduling UI
- **StallManager.svelte**: Stall assignment interface

### Performance Optimizations

- Lazy load ListingDetail components
- Virtual scrolling for large listing lists
- Image optimization and lazy loading

---

## Related Documentation

- **[Design System](../design_system.md)** - Colors, typography, spacing
- **[Testing Strategy](testing_strategy.md)** - Testing patterns and coverage
- **[Refactoring Plan](refactoring_plan.md)** - Original extraction plan

---

## Component API Quick Reference

| Component | Key Props | Returns |
|-----------|-----------|---------|
| ListingCard | `type`, `listing`, `href` | Card with image, title, price |
| ListingRow | `type`, `listing`, `href` | Horizontal row with data |
| ListingDetail | `type`, `listing`, `isOwn`, `mailUrl`, `form` | Full detail view |
| RelatedListings | `sections[]` | Sidebar with grouped links |
| FilterPanel | `type`, `categories`, `filters`, `clearUrl` | Filter form |
| Pagination | `currentPage`, `totalPages`, `buildUrl` | Prev/Next + page indicator |
| BrowseCard | `title`, `description`, `href` | Category nav card |

---

**Maintained by:** Marketplace Development Team  
**Questions?** See individual component docs or design system reference
