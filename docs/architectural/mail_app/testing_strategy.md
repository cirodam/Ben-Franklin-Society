# Testing Strategy

Comprehensive testing approach for the mail app.

**Last Updated:** May 21, 2026  
**Status:** Documentation Complete

---

## Testing Pyramid

```
           /\
          /  \         E2E Tests (Few)
         /____\        - Critical user flows
        /      \       - Full system integration
       /________\      Integration Tests (Some)
      /          \     - API endpoints
     /____________\    - Component interactions
    /              \   Unit Tests (Many)
   /________________\  - Server functions
                       - Component logic
                       - Utilities
```

---

## Testing Tools

### Vitest
- **Purpose:** Unit and integration tests
- **Usage:** Server functions, utilities, component logic
- **Location:** `*.test.ts` files alongside source

### Playwright
- **Purpose:** End-to-end tests
- **Usage:** User flows, browser automation
- **Location:** `tests/` directory

### Testing Library (Svelte)
- **Purpose:** Component testing
- **Usage:** Svelte component rendering and interaction
- **Integration:** Works with Vitest

---

## Unit Tests

### Server Functions

Test business logic in isolation.

#### Message Queries

```typescript
// lib/server/messages/queries.test.ts
import { describe, test, expect, beforeEach } from 'vitest';
import { getMessagesByThread, searchMessages } from './queries';
import { setupTestDb, cleanupTestDb } from '$lib/test-utils';

describe('Message Queries', () => {
  beforeEach(async () => {
    await setupTestDb();
  });
  
  afterEach(async () => {
    await cleanupTestDb();
  });
  
  test('getMessagesByThread returns messages in chronological order', async () => {
    const messages = await getMessagesByThread('thread-uuid');
    
    expect(messages).toHaveLength(3);
    expect(messages[0].sent_at).toBeLessThan(messages[1].sent_at);
  });
  
  test('searchMessages filters by query term', async () => {
    const results = await searchMessages('project update', 'user-uuid');
    
    expect(results.every(m => 
      m.subject.includes('project') || 
      m.body.includes('project')
    )).toBe(true);
  });
  
  test('searchMessages respects label filter', async () => {
    const results = await searchMessages('', 'user-uuid', {
      labelUuid: 'label-uuid'
    });
    
    expect(results.every(m => 
      m.labels.some(l => l.uuid === 'label-uuid')
    )).toBe(true);
  });
});
```

#### Message Mutations

```typescript
// lib/server/messages/mutations.test.ts
import { describe, test, expect } from 'vitest';
import { trashMessage, restoreMessage, permanentlyDelete } from './mutations';

describe('Message Mutations', () => {
  test('trashMessage sets trashed_at timestamp', async () => {
    await trashMessage('message-uuid', 'user-uuid');
    
    const message = await getMessageById('message-uuid');
    expect(message.trashed_at).not.toBeNull();
  });
  
  test('restoreMessage clears trashed_at', async () => {
    await trashMessage('message-uuid', 'user-uuid');
    await restoreMessage('message-uuid', 'user-uuid');
    
    const message = await getMessageById('message-uuid');
    expect(message.trashed_at).toBeNull();
  });
  
  test('permanentlyDelete removes message from database', async () => {
    await permanentlyDelete('message-uuid', 'user-uuid');
    
    const message = await getMessageById('message-uuid');
    expect(message).toBeNull();
  });
});
```

#### Compose Functions

```typescript
// lib/server/messages/compose.test.ts
import { describe, test, expect } from 'vitest';
import { sendMessage, saveDraft, parseDraftRecipients } from './compose';

describe('Compose Functions', () => {
  test('parseDraftRecipients handles multiple formats', () => {
    const input = '@alice, @bob, TeamGroup';
    const result = parseDraftRecipients(input, contactGroups);
    
    expect(result).toEqual([
      '@alice',
      '@bob',
      '@charlie',  // From TeamGroup
      '@dana'      // From TeamGroup
    ]);
  });
  
  test('sendMessage creates thread for new conversation', async () => {
    const result = await sendMessage({
      to: '@alice',
      subject: 'Test',
      body: 'Hello',
      from: 'user-uuid'
    });
    
    expect(result.thread_uuid).toBeDefined();
    expect(result.message_uuid).toBeDefined();
  });
  
  test('saveDraft creates or updates draft', async () => {
    const draft1 = await saveDraft({
      to: '@alice',
      subject: 'Draft',
      body: 'Content',
      from: 'user-uuid'
    });
    
    const draft2 = await saveDraft({
      uuid: draft1.uuid,
      subject: 'Updated Draft',
      body: 'New content',
      from: 'user-uuid'
    });
    
    expect(draft2.uuid).toBe(draft1.uuid);
    expect(draft2.subject).toBe('Updated Draft');
  });
});
```

### Component Logic

Test component behavior without full rendering.

```typescript
// lib/components/thread/MessageCard.test.ts
import { render, fireEvent } from '@testing-library/svelte';
import MessageCard from './MessageCard.svelte';

describe('MessageCard', () => {
  const mockMessage = {
    uuid: 'msg-1',
    from_handle_cache: 'alice',
    from_principal_uuid: 'user-1',
    sent_at: '2026-05-21T10:00:00Z',
    subject: 'Test',
    body: 'Message content',
    content_type: 'text/markdown',
    recipient_type: 'to',
    recipients: [
      { uuid: 'r-1', recipient_handle_cache: 'bob', type: 'to' }
    ]
  };
  
  test('displays sender and timestamp', () => {
    const { getByText } = render(MessageCard, {
      props: {
        message: mockMessage,
        actingAs: 'user-2',
        formatDateTime: (d) => d
      }
    });
    
    expect(getByText('@alice')).toBeInTheDocument();
    expect(getByText('2026-05-21T10:00:00Z')).toBeInTheDocument();
  });
  
  test('shows BCC recipients only to sender', () => {
    const messageWithBcc = {
      ...mockMessage,
      from_principal_uuid: 'user-1',
      recipients: [
        ...mockMessage.recipients,
        { uuid: 'r-2', recipient_handle_cache: 'charlie', type: 'bcc' }
      ]
    };
    
    // As sender
    const { getByText } = render(MessageCard, {
      props: {
        message: messageWithBcc,
        actingAs: 'user-1',
        formatDateTime: (d) => d
      }
    });
    
    expect(getByText('BCC:')).toBeInTheDocument();
    expect(getByText('@charlie')).toBeInTheDocument();
  });
  
  test('hides BCC from recipients', () => {
    const messageWithBcc = {
      ...mockMessage,
      from_principal_uuid: 'user-1',
      recipients: [
        ...mockMessage.recipients,
        { uuid: 'r-2', recipient_handle_cache: 'charlie', type: 'bcc' }
      ]
    };
    
    // As recipient (not sender)
    const { queryByText } = render(MessageCard, {
      props: {
        message: messageWithBcc,
        actingAs: 'user-2',
        formatDateTime: (d) => d
      }
    });
    
    expect(queryByText('BCC:')).not.toBeInTheDocument();
    expect(queryByText('@charlie')).not.toBeInTheDocument();
  });
  
  test('reply button scrolls to form', async () => {
    const { getByText } = render(MessageCard, {
      props: {
        message: mockMessage,
        actingAs: 'user-2',
        formatDateTime: (d) => d
      }
    });
    
    const scrollIntoView = vi.fn();
    global.document.getElementById = vi.fn(() => ({
      scrollIntoView
    }));
    
    await fireEvent.click(getByText('Reply'));
    
    expect(scrollIntoView).toHaveBeenCalled();
  });
});
```

### Utilities

```typescript
// lib/utils/format.test.ts
import { describe, test, expect } from 'vitest';
import { formatFileSize, truncateText, highlightQuery } from './format';

describe('Format Utilities', () => {
  test('formatFileSize handles various sizes', () => {
    expect(formatFileSize(500)).toBe('500 B');
    expect(formatFileSize(1024)).toBe('1.0 KB');
    expect(formatFileSize(1048576)).toBe('1.0 MB');
    expect(formatFileSize(1073741824)).toBe('1.0 GB');
  });
  
  test('truncateText preserves short strings', () => {
    expect(truncateText('Short', 20)).toBe('Short');
  });
  
  test('truncateText adds ellipsis to long strings', () => {
    const long = 'This is a very long string that should be truncated';
    expect(truncateText(long, 20)).toBe('This is a very long...');
  });
  
  test('highlightQuery marks query terms', () => {
    const text = 'The quick brown fox';
    const result = highlightQuery(text, 'quick');
    
    expect(result).toContain('<mark>quick</mark>');
  });
});
```

---

## Integration Tests

### API Routes

Test route handlers and form actions.

```typescript
// routes/(mail)/thread/[uuid]/+page.server.test.ts
import { describe, test, expect } from 'vitest';
import { load, actions } from './+page.server';

describe('Thread Page', () => {
  test('load returns thread data', async () => {
    const result = await load({
      params: { uuid: 'thread-uuid' },
      locals: { session: mockSession }
    });
    
    expect(result.thread).toBeDefined();
    expect(result.messages).toHaveLength(3);
    expect(result.labels).toBeDefined();
  });
  
  test('reply action creates new message', async () => {
    const formData = new FormData();
    formData.append('reply_to_id', 'msg-uuid');
    formData.append('body', 'Reply content');
    formData.append('content_type', 'text/markdown');
    
    const result = await actions.reply({
      request: { formData: () => formData },
      params: { uuid: 'thread-uuid' },
      locals: { session: mockSession }
    });
    
    expect(result.type).toBe('success');
  });
  
  test('add_label action assigns label to thread', async () => {
    const formData = new FormData();
    formData.append('label_uuid', 'label-uuid');
    
    const result = await actions.add_label({
      request: { formData: () => formData },
      params: { uuid: 'thread-uuid' },
      locals: { session: mockSession }
    });
    
    expect(result.type).toBe('success');
    
    // Verify label was added
    const thread = await getThreadById('thread-uuid');
    expect(thread.labels.some(l => l.uuid === 'label-uuid')).toBe(true);
  });
});
```

---

## End-to-End Tests

### Critical User Flows

Test complete user journeys with browser automation.

#### Compose and Send Message

```typescript
// tests/compose.spec.ts
import { test, expect } from '@playwright/test';

test('user can compose and send message', async ({ page }) => {
  // Login
  await page.goto('/');
  await page.fill('[name="handle"]', '@testuser');
  await page.fill('[name="password"]', 'password123');
  await page.click('button:has-text("Sign In")');
  
  // Navigate to compose
  await page.click('a:has-text("Compose")');
  await expect(page).toHaveURL('/compose');
  
  // Fill form
  await page.fill('[name="to"]', '@recipient');
  await page.fill('[name="subject"]', 'Test Message');
  await page.fill('[name="body"]', 'This is a test message');
  
  // Send
  await page.click('button:has-text("Send Message")');
  
  // Verify success
  await expect(page).toHaveURL('/sent');
  await expect(page.locator('.alert-success'))
    .toContainText('Message sent');
});

test('user can save draft', async ({ page }) => {
  await page.goto('/compose');
  
  await page.fill('[name="to"]', '@recipient');
  await page.fill('[name="subject"]', 'Draft Message');
  await page.fill('[name="body"]', 'Draft content');
  
  await page.click('button:has-text("Save Draft")');
  
  await expect(page.locator('.autosave-indicator'))
    .toContainText('Draft saved');
});

test('user can use template in compose', async ({ page }) => {
  await page.goto('/compose');
  
  // Select template
  await page.selectOption('#template-select', { label: 'Weekly Update' });
  
  // Verify fields populated
  await expect(page.locator('[name="subject"]'))
    .toHaveValue('Weekly Team Update');
  await expect(page.locator('[name="body"]'))
    .toContainText('This week');
});
```

#### Reply to Thread

```typescript
// tests/thread.spec.ts
import { test, expect } from '@playwright/test';

test('user can reply to thread', async ({ page }) => {
  await page.goto('/thread/thread-uuid');
  
  // Scroll to reply form
  await page.locator('#reply-box').scrollIntoViewIfNeeded();
  
  // Fill reply
  await page.fill('[name="body"]', 'This is my reply');
  
  // Send reply
  await page.click('button:has-text("Send Reply")');
  
  // Verify reply appears
  await expect(page.locator('.message-card').last())
    .toContainText('This is my reply');
});

test('user can add label to thread', async ({ page }) => {
  await page.goto('/thread/thread-uuid');
  
  // Open label menu
  await page.click('.add-label-btn');
  
  // Select label
  await page.click('button:has-text("Important")');
  
  // Verify label applied
  await expect(page.locator('.label-tag'))
    .toContainText('Important');
});

test('user can report message', async ({ page }) => {
  await page.goto('/thread/thread-uuid');
  
  // Open report panel
  await page.click('button[title="Report"]');
  
  // Fill reason
  await page.fill('[name="reason"]', 'Inappropriate content');
  
  // Submit report
  await page.click('button:has-text("Submit Report")');
  
  // Verify success
  await expect(page.locator('.alert-success'))
    .toContainText('Report submitted');
});
```

#### Search Messages

```typescript
// tests/search.spec.ts
import { test, expect } from '@playwright/test';

test('user can search messages', async ({ page }) => {
  await page.goto('/search');
  
  // Enter query
  await page.fill('[name="query"]', 'project update');
  await page.press('[name="query"]', 'Enter');
  
  // Verify results
  await expect(page.locator('.search-result-card'))
    .toHaveCountGreaterThan(0);
  await expect(page.locator('.search-result-card').first())
    .toContainText('project');
});

test('user can filter search by label', async ({ page }) => {
  await page.goto('/search?q=meeting');
  
  // Apply label filter
  await page.selectOption('[name="label"]', 'Work');
  await page.click('button:has-text("Apply Filters")');
  
  // Verify filtered results
  await expect(page).toHaveURL(/label=Work/);
  await expect(page.locator('.search-result-card'))
    .toHaveCountGreaterThan(0);
});

test('user can filter by date range', async ({ page }) => {
  await page.goto('/search');
  
  // Set date range
  await page.fill('[name="date_from"]', '2026-05-01');
  await page.fill('[name="date_to"]', '2026-05-21');
  await page.click('button:has-text("Apply Filters")');
  
  // Verify results within range
  const cards = await page.locator('.search-result-card').all();
  for (const card of cards) {
    const timestamp = await card.locator('.timestamp').textContent();
    // Verify timestamp in range
  }
});
```

#### Manage Labels

```typescript
// tests/labels.spec.ts
import { test, expect } from '@playwright/test';

test('user can create label', async ({ page }) => {
  await page.goto('/labels');
  
  // Open form
  await page.click('button:has-text("New Label")');
  
  // Fill form
  await page.fill('[name="name"]', 'Urgent');
  await page.click('[data-color="#e74c3c"]');
  
  // Save
  await page.click('button:has-text("Save")');
  
  // Verify created
  await expect(page.locator('.label-card'))
    .toContainText('Urgent');
});

test('user can edit label', async ({ page }) => {
  await page.goto('/labels');
  
  // Edit existing label
  await page.click('.label-card button:has-text("Edit")');
  
  // Update name
  await page.fill('[name="name"]', 'Very Urgent');
  await page.click('button:has-text("Save")');
  
  // Verify updated
  await expect(page.locator('.label-card'))
    .toContainText('Very Urgent');
});

test('user can delete label', async ({ page }) => {
  await page.goto('/labels');
  
  // Delete label
  await page.click('.label-card button:has-text("Delete")');
  
  // Confirm
  await page.click('button:has-text("Confirm")');
  
  // Verify removed
  await expect(page.locator('.label-card').first())
    .not.toContainText('Urgent');
});
```

---

## Test Configuration

### Vitest Config

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import { sveltekit } from '@sveltejs/kit/vite';

export default defineConfig({
  plugins: [sveltekit()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      include: ['src/lib/**/*.{ts,svelte}'],
      exclude: ['**/*.test.ts', '**/*.spec.ts']
    }
  }
});
```

### Playwright Config

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
  ],
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
  },
});
```

---

## Coverage Goals

### Target Coverage

- **Unit Tests:** 80% code coverage
- **Integration Tests:** All API routes
- **E2E Tests:** All critical flows

### Priority Areas

1. **Server Functions:** 90%+ coverage
   - Message operations
   - Search functionality
   - Label/contact management

2. **Component Logic:** 70%+ coverage
   - Form handling
   - State management
   - Event callbacks

3. **User Flows:** 100% critical paths
   - Compose and send
   - Reply to thread
   - Search messages
   - Manage labels/contacts

---

## Running Tests

### Unit Tests

```bash
# Run all tests
pnpm test

# Watch mode
pnpm test:watch

# Coverage report
pnpm test:coverage

# Specific file
pnpm test queries.test.ts
```

### E2E Tests

```bash
# Run all E2E tests
pnpm test:e2e

# Run specific test
pnpm test:e2e compose.spec.ts

# Debug mode
pnpm test:e2e --debug

# UI mode
pnpm test:e2e --ui
```

---

## Continuous Integration

### GitHub Actions

```yaml
# .github/workflows/test.yml
name: Test

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - uses: pnpm/action-setup@v2
        with:
          version: 8
      
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'pnpm'
      
      - run: pnpm install
      
      - run: pnpm test
      
      - run: pnpm test:e2e
      
      - uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info
```

---

## Next Steps

### Phase 6 Implementation

1. **Setup Testing Infrastructure**
   - Configure Vitest
   - Configure Playwright
   - Create test utilities

2. **Write Unit Tests**
   - Server function tests (Priority)
   - Component logic tests
   - Utility function tests

3. **Write Integration Tests**
   - API route tests
   - Form action tests
   - Database integration

4. **Write E2E Tests**
   - Critical user flows
   - Cross-browser testing
   - Accessibility testing

5. **CI/CD Integration**
   - GitHub Actions workflow
   - Automated test runs
   - Coverage reporting

---

**Last Updated:** May 21, 2026  
**Status:** Ready for implementation  
**Estimated Effort:** 2-3 weeks
