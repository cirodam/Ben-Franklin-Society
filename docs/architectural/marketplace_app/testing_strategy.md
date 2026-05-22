# Testing Strategy

**Target:** Marketplace application testing approach  
**Last Updated:** May 21, 2026

---

## Overview

The Marketplace app testing strategy focuses on **component reliability**, **server function correctness**, and **end-to-end workflow validation**. Testing ensures the market/craft fair experience remains consistent and bug-free as the codebase evolves.

### Testing Pyramid

```
      /\
     /E2E\        ← 5-10 critical flows
    /------\
   /Integr.\     ← 20-30 component interactions
  /----------\
 /   Unit     \   ← 50+ function/component tests
/--------------\
```

**Philosophy:** Heavy unit testing for utilities and components, targeted integration tests for complex interactions, minimal E2E for critical user journeys.

---

## Test Environment

### Tools & Frameworks

```json
{
	"vitest": "Latest",
	"@testing-library/svelte": "Latest",
	"@testing-library/user-event": "Latest",
	"playwright": "Latest (E2E)"
}
```

### Configuration

**vitest.config.ts:**
```typescript
import { defineConfig } from 'vitest/config';
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineConfig({
	plugins: [svelte({ hot: !process.env.VITEST })],
	test: {
		include: ['src/**/*.{test,spec}.{js,ts}'],
		globals: true,
		environment: 'jsdom',
		setupFiles: ['src/tests/setup.ts'],
	},
});
```

---

## Unit Testing

### Utility Functions

**Location:** `src/lib/utils/*.test.ts`

#### Format Utilities

Test all formatting functions with edge cases:

```typescript
// src/lib/utils/format.test.ts
import { describe, it, expect } from 'vitest';
import { formatPrice, formatRate, formatDate } from './format.js';

describe('formatPrice', () => {
	it('formats standard price', () => {
		expect(formatPrice(50, 0)).toBe('$50.00');
		expect(formatPrice(123.45, 0)).toBe('$123.45');
	});
	
	it('adds negotiable indicator', () => {
		expect(formatPrice(50, 1)).toBe('$50.00 (or best offer)');
	});
	
	it('handles zero', () => {
		expect(formatPrice(0, 0)).toBe('$0.00');
	});
	
	it('formats large numbers with commas', () => {
		expect(formatPrice(1234.56, 0)).toBe('$1,234.56');
	});
});

describe('formatRate', () => {
	it('formats per-hour rate', () => {
		expect(formatRate(75, 'per_hour')).toBe('$75.00/hr');
	});
	
	it('formats per-job rate', () => {
		expect(formatRate(100, 'per_job')).toBe('$100.00/job');
	});
	
	it('formats negotiable', () => {
		expect(formatRate(0, 'negotiable')).toBe('Negotiable');
	});
});
```

#### URL Builders

Test URL construction with various filter combinations:

```typescript
// src/lib/utils/url.test.ts
import { describe, it, expect } from 'vitest';
import { buildClassifiedUrl, buildServiceUrl } from './url.js';

describe('buildClassifiedUrl', () => {
	it('builds URL with single filter', () => {
		const url = buildClassifiedUrl('/classifieds', {}, { category: 'Tools' });
		expect(url).toBe('/classifieds?category=Tools');
	});
	
	it('builds URL with multiple filters', () => {
		const url = buildClassifiedUrl('/classifieds', {}, {
			category: 'Tools',
			minPrice: 10,
			maxPrice: 100,
			negotiable: true,
		});
		expect(url).toContain('category=Tools');
		expect(url).toContain('minPrice=10');
		expect(url).toContain('maxPrice=100');
		expect(url).toContain('negotiable=1');
	});
	
	it('preserves existing filters when overriding', () => {
		const url = buildClassifiedUrl('/classifieds', {
			category: 'Tools',
			keyword: 'hammer',
		}, { page: 2 });
		
		expect(url).toContain('category=Tools');
		expect(url).toContain('keyword=hammer');
		expect(url).toContain('page=2');
	});
	
	it('returns base path when no filters', () => {
		const url = buildClassifiedUrl('/classifieds', {}, {});
		expect(url).toBe('/classifieds');
	});
});
```

---

### Server Functions

**Location:** `src/lib/server/**/*.test.ts`

#### Query Functions

```typescript
// src/lib/server/classifieds/queries.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getClassifieds, getClassified } from './queries.js';
import { db } from '../db.js';

describe('getClassifieds', () => {
	beforeEach(() => {
		// Setup test database with fixtures
	});
	
	afterEach(() => {
		// Clean up test data
	});
	
	it('returns active listings only', () => {
		const { listings } = getClassifieds({});
		expect(listings.every(l => l.status === 'active')).toBe(true);
	});
	
	it('filters by category', () => {
		const { listings } = getClassifieds({ category: 'Tools' });
		expect(listings.every(l => l.category === 'Tools')).toBe(true);
	});
	
	it('filters by price range', () => {
		const { listings } = getClassifieds({ minPrice: 20, maxPrice: 50 });
		expect(listings.every(l => l.price >= 20 && l.price <= 50)).toBe(true);
	});
	
	it('paginates results', () => {
		const page1 = getClassifieds({ page: 1 });
		const page2 = getClassifieds({ page: 2 });
		
		expect(page1.listings).toHaveLength(20); // PAGE_SIZE
		expect(page1.listings[0].uuid).not.toBe(page2.listings[0].uuid);
	});
	
	it('returns total count', () => {
		const { total } = getClassifieds({});
		expect(typeof total).toBe('number');
		expect(total).toBeGreaterThan(0);
	});
});
```

#### Mutation Functions

```typescript
// src/lib/server/classifieds/mutations.test.ts
import { describe, it, expect } from 'vitest';
import { createClassified, updateClassified, withdrawClassified } from './mutations.js';

describe('createClassified', () => {
	it('creates new listing with UUID', () => {
		const uuid = createClassified({
			seller_uuid: 'user-123',
			seller_handle_cache: 'alice',
			seller_society_handle: 'society',
			title: 'Test Item',
			description: 'A test item',
			category: 'Tools',
			price: 50,
			price_negotiable: false,
			scope: 'local',
			expires_at: null,
		});
		
		expect(uuid).toMatch(/^[0-9a-f-]{36}$/); // UUID format
	});
	
	it('throws when seller suspended', () => {
		// Setup: Suspend seller
		
		expect(() => {
			createClassified({ /* seller with suspension */ });
		}).toThrow('suspended');
	});
});

describe('withdrawClassified', () => {
	it('sets status to withdrawn', () => {
		const uuid = createClassified({ /* ... */ });
		withdrawClassified(uuid, 'user-123');
		
		const listing = getClassified(uuid);
		expect(listing?.status).toBe('withdrawn');
	});
	
	it('throws when not owner', () => {
		const uuid = createClassified({ seller_uuid: 'user-123', /* ... */ });
		
		expect(() => {
			withdrawClassified(uuid, 'user-456');
		}).toThrow('not_found');
	});
});
```

---

## Component Testing

**Location:** `src/lib/components/*.test.ts`

### Listing Components

```typescript
// src/lib/components/ListingCard.test.ts
import { render, screen } from '@testing-library/svelte';
import { describe, it, expect } from 'vitest';
import ListingCard from './ListingCard.svelte';

describe('ListingCard', () => {
	const mockClassified = {
		uuid: '123',
		title: 'Vintage Hammer',
		category: 'Tools',
		price: 25,
		price_negotiable: 0,
		seller_uuid: 'seller-123',
		seller_handle_cache: 'alice',
		seller_society_handle: 'society',
		scope: 'local',
		status: 'active',
		expires_at: null,
		created_at: '2026-05-21T10:00:00Z',
	};
	
	it('renders classified listing', () => {
		render(ListingCard, {
			props: {
				type: 'classified',
				listing: mockClassified,
				href: '/classifieds/123',
			},
		});
		
		expect(screen.getByText('Vintage Hammer')).toBeInTheDocument();
		expect(screen.getByText('$25.00')).toBeInTheDocument();
		expect(screen.getByText('@alice')).toBeInTheDocument();
		expect(screen.getByText('Tools')).toBeInTheDocument();
	});
	
	it('shows negotiable indicator', () => {
		render(ListingCard, {
			props: {
				type: 'classified',
				listing: { ...mockClassified, price_negotiable: 1 },
				href: '/classifieds/123',
			},
		});
		
		expect(screen.getByText(/or best offer/i)).toBeInTheDocument();
	});
	
	it('links to listing detail', () => {
		render(ListingCard, {
			props: {
				type: 'classified',
				listing: mockClassified,
				href: '/classifieds/123',
			},
		});
		
		const link = screen.getByRole('link');
		expect(link).toHaveAttribute('href', '/classifieds/123');
	});
});
```

### Filter Components

```typescript
// src/lib/components/FilterPanel.test.ts
import { render, screen, fireEvent } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import FilterPanel from './FilterPanel.svelte';

describe('FilterPanel', () => {
	it('renders common filters', () => {
		render(FilterPanel, {
			props: {
				type: 'classified',
				categories: ['Tools', 'Electronics'],
				filters: {},
				clearUrl: '/classifieds',
			},
		});
		
		expect(screen.getByPlaceholderText(/search/i)).toBeInTheDocument();
		expect(screen.getByLabelText(/category/i)).toBeInTheDocument();
		expect(screen.getByLabelText(/scope/i)).toBeInTheDocument();
	});
	
	it('shows classified-specific filters', () => {
		render(FilterPanel, {
			props: {
				type: 'classified',
				categories: [],
				filters: {},
				clearUrl: '/classifieds',
			},
		});
		
		expect(screen.getByLabelText(/min price/i)).toBeInTheDocument();
		expect(screen.getByLabelText(/max price/i)).toBeInTheDocument();
		expect(screen.getByLabelText(/negotiable/i)).toBeInTheDocument();
	});
	
	it('hides classified filters for services', () => {
		render(FilterPanel, {
			props: {
				type: 'service',
				categories: [],
				filters: {},
				clearUrl: '/services',
			},
		});
		
		expect(screen.queryByLabelText(/min price/i)).not.toBeInTheDocument();
	});
	
	it('shows clear link when filters active', () => {
		render(FilterPanel, {
			props: {
				type: 'classified',
				categories: [],
				filters: { category: 'Tools' },
				clearUrl: '/classifieds',
			},
		});
		
		expect(screen.getByText(/clear filters/i)).toBeInTheDocument();
	});
});
```

---

## Integration Testing

**Purpose:** Test component interactions and page-level behavior

### Page Flow Tests

```typescript
// src/routes/classifieds/+page.test.ts
import { render, screen, within } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import ClassifiedsPage from './+page.svelte';

describe('Classifieds browse page', () => {
	it('displays listings in list format', () => {
		const mockData = {
			listings: [
				{ uuid: '1', title: 'Hammer', /* ... */ },
				{ uuid: '2', title: 'Drill', /* ... */ },
			],
			total: 2,
			categories: ['Tools'],
			filters: {},
			page: 1,
		};
		
		render(ClassifiedsPage, { props: { data: mockData } });
		
		expect(screen.getByText('Hammer')).toBeInTheDocument();
		expect(screen.getByText('Drill')).toBeInTheDocument();
	});
	
	it('applies filter and updates URL', async () => {
		// Test filter interaction
	});
	
	it('navigates pages', async () => {
		// Test pagination interaction
	});
});
```

### Form Submission Tests

```typescript
// src/routes/sell/+page.test.ts
import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import SellPage from './+page.svelte';

describe('Sell page', () => {
	it('submits classified listing form', async () => {
		render(SellPage, { props: { data: { /* ... */ } } });
		
		await userEvent.type(screen.getByLabelText(/title/i), 'Vintage Hammer');
		await userEvent.type(screen.getByLabelText(/description/i), 'Well-maintained');
		await userEvent.selectOptions(screen.getByLabelText(/category/i), 'Tools');
		await userEvent.type(screen.getByLabelText(/price/i), '25');
		
		await userEvent.click(screen.getByRole('button', { name: /post listing/i }));
		
		// Assert form submission
	});
	
	it('validates required fields', async () => {
		render(SellPage);
		
		await userEvent.click(screen.getByRole('button', { name: /post listing/i }));
		
		expect(screen.getByText(/title is required/i)).toBeInTheDocument();
	});
});
```

---

## End-to-End Testing

**Tool:** Playwright  
**Location:** `e2e/*.spec.ts`

### Critical User Journeys

#### 1. Browse → View → Contact Flow

```typescript
// e2e/browse-listing.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Listing browsing', () => {
	test('user can browse and view classified', async ({ page }) => {
		// Navigate to browse page
		await page.goto('/classifieds');
		
		// Verify listings displayed
		await expect(page.locator('.listing-row').first()).toBeVisible();
		
		// Click first listing
		await page.locator('.listing-row').first().click();
		
		// Verify detail page
		await expect(page.locator('h1')).toBeVisible();
		await expect(page.locator('.listing-price')).toBeVisible();
		await expect(page.locator('.listing-description')).toBeVisible();
		
		// Click contact button
		await page.getByRole('link', { name: /contact.*via mail/i }).click();
		
		// Verify navigated to mail app
		await expect(page).toHaveURL(/mail.*compose/);
	});
});
```

#### 2. Create Listing Flow

```typescript
// e2e/create-listing.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Create listing', () => {
	test.use({ storageState: 'auth/user.json' }); // Authenticated user
	
	test('user can create classified listing', async ({ page }) => {
		await page.goto('/sell');
		
		// Select classified
		await page.getByRole('button', { name: /classified/i }).click();
		
		// Fill form
		await page.getByLabel(/title/i).fill('Vintage Typewriter');
		await page.getByLabel(/description/i).fill('Working condition, beautiful patina');
		await page.getByLabel(/category/i).selectOption('Antiques');
		await page.getByLabel(/price/i).fill('150');
		
		// Submit
		await page.getByRole('button', { name: /post listing/i }).click();
		
		// Verify success
		await expect(page).toHaveURL(/classifieds\/[0-9a-f-]{36}/);
		await expect(page.getByText('Vintage Typewriter')).toBeVisible();
		await expect(page.getByText('$150.00')).toBeVisible();
	});
});
```

#### 3. Filter & Paginate Flow

```typescript
// e2e/filter-listings.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Listing filters', () => {
	test('user can filter classifieds', async ({ page }) => {
		await page.goto('/classifieds');
		
		// Apply filters
		await page.getByLabel(/category/i).selectOption('Tools');
		await page.getByLabel(/min price/i).fill('10');
		await page.getByLabel(/max price/i).fill('100');
		await page.getByRole('button', { name: /apply/i }).click();
		
		// Verify URL updated
		await expect(page).toHaveURL(/category=Tools/);
		await expect(page).toHaveURL(/minPrice=10/);
		await expect(page).toHaveURL(/maxPrice=100/);
		
		// Verify listings match filter
		const listings = page.locator('.listing-row');
		await expect(listings.first()).toContainText('Tools');
		
		// Clear filters
		await page.getByRole('link', { name: /clear filters/i }).click();
		await expect(page).toHaveURL('/classifieds');
	});
});
```

#### 4. Report Listing Flow

```typescript
// e2e/report-listing.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Report listing', () => {
	test.use({ storageState: 'auth/user.json' });
	
	test('user can report inappropriate listing', async ({ page }) => {
		// Navigate to a listing (not own)
		await page.goto('/classifieds/test-listing-uuid');
		
		// Click report button
		await page.getByRole('button', { name: /report/i }).click();
		
		// Fill report form
		await page.getByPlaceholder(/describe the issue/i).fill('Spam listing');
		
		// Submit
		await page.getByRole('button', { name: /submit report/i }).click();
		
		// Verify success message
		await expect(page.getByText(/report.*submitted/i)).toBeVisible();
	});
});
```

---

## Mock Data Strategy

### Fixture Files

**Location:** `src/tests/fixtures/`

```typescript
// src/tests/fixtures/classifieds.ts
import type { ClassifiedListing } from '$lib/server/listings.js';

export const mockClassifieds: ClassifiedListing[] = [
	{
		uuid: 'classified-1',
		seller_uuid: 'user-alice',
		seller_handle_cache: 'alice',
		seller_society_handle: 'community',
		title: 'Vintage Hammer',
		description: 'Well-maintained claw hammer',
		category: 'Tools',
		price: 25,
		price_negotiable: 0,
		scope: 'local',
		status: 'active',
		expires_at: null,
		created_at: '2026-05-01T10:00:00Z',
	},
	{
		uuid: 'classified-2',
		seller_uuid: 'user-bob',
		seller_handle_cache: 'bob',
		seller_society_handle: 'community',
		title: 'Laptop Computer',
		description: 'Gaming laptop, 16GB RAM',
		category: 'Electronics',
		price: 500,
		price_negotiable: 1,
		scope: 'local',
		status: 'active',
		expires_at: '2026-06-01T00:00:00Z',
		created_at: '2026-05-15T14:30:00Z',
	},
];

export const mockServices: ServiceListing[] = [
	// ...
];
```

### Factory Functions

```typescript
// src/tests/factories/listing.ts
import type { ClassifiedListing } from '$lib/server/listings.js';

export function createMockClassified(
	overrides: Partial<ClassifiedListing> = {}
): ClassifiedListing {
	return {
		uuid: `classified-${Math.random()}`,
		seller_uuid: 'user-test',
		seller_handle_cache: 'testuser',
		seller_society_handle: 'test-society',
		title: 'Test Item',
		description: 'A test listing',
		category: 'Test Category',
		price: 50,
		price_negotiable: 0,
		scope: 'local',
		status: 'active',
		expires_at: null,
		created_at: new Date().toISOString(),
		...overrides,
	};
}
```

---

## Test Coverage Goals

### Target Metrics

- **Utilities**: 90%+ coverage
- **Server functions**: 85%+ coverage
- **Components**: 75%+ coverage
- **E2E critical paths**: 100% coverage

### Running Coverage

```bash
# Unit + integration tests
pnpm test:coverage

# E2E tests
pnpm test:e2e

# All tests
pnpm test:all
```

---

## CI/CD Integration

### GitHub Actions Workflow

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v3
        with:
          node-version: 20
          cache: 'pnpm'
      
      - run: pnpm install
      - run: pnpm test:unit
      - run: pnpm test:integration
      - run: pnpm test:e2e
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

---

## Related Documentation

- [Component Library](components/README.md)
- [Server Architecture](server_architecture.md)
- [Design System](design_system.md)
