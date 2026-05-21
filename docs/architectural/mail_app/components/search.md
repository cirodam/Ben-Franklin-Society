# Search Components

Search components provide message search functionality with filters and result display.

**Location:** `lib/components/search/`  
**Components:** 4  
**Total Lines:** ~370

---

## SearchBar

Main search input with query handling and clear functionality.

### Props

```typescript
interface Props {
  query?: string;  // Search query (bindable)
  onSubmit?: () => void; // Submit callback
}
```

### Features

- **Text Input:** Real-time query binding
- **Clear Button:** Reset search
- **Enter to Submit:** Keyboard-friendly
- **Placeholder:** Helpful search hints

### Usage

```svelte
<script>
  import { SearchBar } from '$lib/components/search/SearchBar.svelte';
  
  let query = $state('');
  
  function handleSearch() {
    // Perform search
  }
</script>

<SearchBar
  bind:query
  onSubmit={handleSearch}
/>
```

**Size:** 68 lines

---

## SearchFilters

Advanced filter controls for refining search results.

### Props

```typescript
interface Props {
  labelFilter?: string;     // Selected label UUID (bindable)
  dateFrom?: string;        // Start date (bindable)
  dateTo?: string;          // End date (bindable)
  fromFilter?: string;      // Sender handle (bindable)
  labels?: Label[];         // Available labels
  onApplyFilters?: () => void; // Apply callback
}

interface Label {
  uuid: string;
  name: string;
  color: string | null;
}
```

### Features

- **Label Filter:** Dropdown to filter by label
- **Date Range:** From/to date inputs
- **Sender Filter:** Search by sender handle
- **Apply Button:** Trigger filtered search
- **Clear Filters:** Reset all filters

### Usage

```svelte
<script>
  import { SearchFilters } from '$lib/components/search/SearchFilters.svelte';
  
  let labelFilter = $state('');
  let dateFrom = $state('');
  let dateTo = $state('');
  let fromFilter = $state('');
</script>

<SearchFilters
  bind:labelFilter
  bind:dateFrom
  bind:dateTo
  bind:fromFilter
  labels={data.labels}
  onApplyFilters={performSearch}
/>
```

**Size:** 120 lines

---

## SearchResultCard

Single search result display with message preview.

### Props

```typescript
interface Props {
  message: SearchMessage;
  query: string;  // Highlight query terms
  formatRelativeDate: (date: string) => string;
}

interface SearchMessage {
  uuid: string;
  subject: string;
  from_handle_cache: string;
  sent_at: string;
  body_preview: string;
  thread_uuid: string;
}
```

### Features

- **Message Preview:** Truncated body content
- **Sender Info:** From handle display
- **Timestamp:** Relative date (e.g., "2 days ago")
- **Highlight:** Query term emphasis
- **Click to View:** Links to thread

### Usage

```svelte
<script>
  import { SearchResultCard } from '$lib/components/search/SearchResultCard.svelte';
  import { formatRelativeDate } from '@bfs/ui';
</script>

{#each results as message}
  <SearchResultCard
    {message}
    {query}
    {formatRelativeDate}
  />
{/each}
```

**Size:** 75 lines

---

## SearchResults

Results list container with pagination and empty states.

### Props

```typescript
interface Props {
  results: SearchMessage[];
  query: string;
  totalCount: number;
  currentPage: number;
  pageSize: number;
  onPageChange?: (page: number) => void;
}
```

### Features

- **Result List:** Renders SearchResultCard for each
- **Empty State:** Shows when no results
- **Pagination:** Page controls
- **Result Count:** Shows X of Y results
- **Loading State:** Spinner during search

### Usage

```svelte
<script>
  import { SearchResults } from '$lib/components/search/SearchResults.svelte';
  
  let currentPage = $state(1);
  
  function handlePageChange(page: number) {
    currentPage = page;
    performSearch();
  }
</script>

<SearchResults
  {results}
  {query}
  totalCount={data.total}
  {currentPage}
  pageSize={20}
  onPageChange={handlePageChange}
/>
```

**Size:** 106 lines

---

## Common Patterns

### Full Search Page

```svelte
<script>
  import {
    SearchBar,
    SearchFilters,
    SearchResults
  } from '$lib/components/search';
  
  let query = $state('');
  let labelFilter = $state('');
  let dateFrom = $state('');
  let dateTo = $state('');
  let results = $state([]);
  let currentPage = $state(1);
  
  async function performSearch() {
    const params = new URLSearchParams({
      query,
      label: labelFilter,
      from: dateFrom,
      to: dateTo,
      page: currentPage.toString()
    });
    
    const response = await fetch(`/api/search?${params}`);
    const data = await response.json();
    
    results = data.results;
  }
</script>

<SearchBar
  bind:query
  onSubmit={performSearch}
/>

<SearchFilters
  bind:labelFilter
  bind:dateFrom
  bind:dateTo
  labels={data.labels}
  onApplyFilters={performSearch}
/>

<SearchResults
  {results}
  {query}
  totalCount={data.total}
  {currentPage}
  pageSize={20}
  onPageChange={(page) => {
    currentPage = page;
    performSearch();
  }}
/>
```

---

## Testing

### Integration Tests

```typescript
test('user can search messages', async ({ page }) => {
  await page.goto('/search');
  
  await page.fill('[name="query"]', 'project update');
  await page.press('[name="query"]', 'Enter');
  
  await expect(page.locator('.search-result-card'))
    .toHaveCount(5);
});

test('filters narrow search results', async ({ page }) => {
  await page.goto('/search?q=meeting');
  
  await page.selectOption('[name="label"]', 'Work');
  await page.click('button:has-text("Apply Filters")');
  
  await expect(page.locator('.search-result-card'))
    .toHaveCountLessThan(10);
});
```

---

**Last Updated:** May 21, 2026
