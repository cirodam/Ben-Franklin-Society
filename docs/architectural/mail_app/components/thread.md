# Thread Components

Thread components handle the display and interaction with message threads.

**Location:** `lib/components/thread/`  
**Components:** 5  
**Total Lines:** ~850

---

## MessageCard

Displays an individual message within a thread with full sender/recipient information, content rendering, and action buttons.

### Props

```typescript
interface Props {
  message: Message;              // Message data
  actingAs: string;              // Current user UUID
  attachments?: Attachment[];    // File attachments (default: [])
  formData?: any;                // Form submission data (default: null)
  reportOpenFor?: string | null; // UUID of message being reported
  formatDateTime: (date: string) => string; // Date formatter
}

interface Message {
  uuid: string;
  from_handle_cache: string;
  from_principal_uuid: string;
  sent_at: string;
  recipient_type: 'to' | 'cc' | 'bcc' | null;
  subject: string;
  body: string;
  content_type: string;
  trashed_at: string | null;
  recipients: Recipient[];
}

interface Recipient {
  uuid: string;
  recipient_handle_cache: string;
  type: 'to' | 'cc' | 'bcc';
}

interface Attachment {
  uuid: string;
  filename: string;
  size_bytes: number;
}
```

### Features

- **Sender Display:** Shows sender handle and timestamp
- **Recipients:** Displays To/CC/BCC recipients
  - BCC only visible to sender
- **Content Rendering:** Markdown support via MarkdownRenderer
- **Attachments:** File list with MessageAttachments component
- **Actions:** Reply, Forward, Trash buttons
- **Reporting:** Report panel for moderation
- **Visual States:** Different styling for sent vs received messages

### Usage

```svelte
<script>
  import { MessageCard } from '$lib/components/thread/MessageCard.svelte';
  import { formatDateTime } from '@bfs/ui';
  
  let reportOpenFor = $state(null);
</script>

<MessageCard
  {message}
  actingAs={data.session.principal_uuid}
  attachments={message.attachments}
  {formatDateTime}
  bind:reportOpenFor
/>
```

### Computed Values

- `isSent` - Whether message was sent by current user
- `toRecipients` - Filtered 'to' recipients
- `ccRecipients` - Filtered 'cc' recipients
- `bccRecipients` - Filtered 'bcc' recipients
- `showBcc` - Whether to display BCC (sender only)

### Actions

- **Reply:** Scrolls to reply form
- **Forward:** Navigates to `/forward/{uuid}`
- **Trash:** Moves message to trash
- **Report:** Opens reporting panel

### Styling

Uses postal design tokens:
- Background: `var(--letter-paper)` / `var(--envelope-cream)`
- Text: `var(--ink-base)`
- Borders: `var(--border-default)`
- Shadows: `var(--shadow-sm)`

**Size:** 276 lines  
**Dependencies:** MarkdownRenderer, MessageAttachments, ReportPanel, @bfs/ui components

---

## ThreadLabels

Manages label assignment for a thread with add/remove functionality.

### Props

```typescript
interface Props {
  availableLabels: Label[];  // All labels user can assign
  threadLabels: Label[];     // Currently assigned labels
}

interface Label {
  uuid: string;
  name: string;
  color: string | null;
}
```

### Features

- **Current Labels:** Display assigned labels with color indicators
- **Remove Labels:** Quick remove with × button
- **Add Labels:** Dropdown to assign new labels
- **Color Coding:** Visual label colors
- **Empty State:** Shows "None" when no labels assigned

### Usage

```svelte
<script>
  import { ThreadLabels } from '$lib/components/thread/ThreadLabels.svelte';
</script>

<ThreadLabels
  availableLabels={data.labels}
  threadLabels={data.thread.labels}
/>
```

### Computed Values

- `unassignedLabels` - Labels not yet applied to thread

### Form Actions

- `?/add_label` - POST to assign label
- `?/remove_label` - POST to unassign label

### Styling

- Label tags with colored dots
- Dropdown menu for selection
- Hover states for interactivity

**Size:** 220 lines  
**Dependencies:** SvelteKit forms

---

## ReplyForm

Quick reply form with optional parent message quoting.

### Props

```typescript
interface Props {
  lastMessage: Message | undefined;  // Most recent message in thread
  signature: string;                 // User's signature
  formData?: any;                    // Form submission data
}

interface Message {
  uuid: string;
  from_handle_cache: string;
  sent_at: string;
  body: string;
}
```

### Features

- **Quick Reply:** Simple textarea for fast responses
- **Quote Parent:** Checkbox to include previous message
- **Signature:** Automatically includes user signature
- **Auto-reset:** Clears form on successful submission
- **Error Handling:** Displays form errors

### Usage

```svelte
<script>
  import { ReplyForm } from '$lib/components/thread/ReplyForm.svelte';
</script>

<ReplyForm
  lastMessage={messages[messages.length - 1]}
  signature={data.signature}
  formData={form}
/>
```

### State Management

- `replyBody` - Reply textarea content
- `quoteParent` - Whether to include quoted text

### Computed Values

- `quotedText` - Formatted quote with "On [date], @[user] wrote:" prefix
- `replyBodyWithQuote` - Final body content (with or without quote)

### Form Action

- `?/reply` - POST to send reply
- Hidden fields: `reply_to_id`, `content_type`

### Behavior

- Resets form on successful submission
- Maintains signature in textarea
- Formats quoted text with `>` prefix

**Size:** 118 lines  
**Dependencies:** @bfs/ui (Alert, Button, Card, Textarea)

---

## MessageAttachments

Displays list of file attachments with download links.

### Props

```typescript
interface Props {
  attachments: Attachment[];  // List of attached files
  messageId: string;          // Message UUID for download URLs
}

interface Attachment {
  uuid: string;
  filename: string;
  size_bytes: number;
}
```

### Features

- **File List:** Shows all attachments
- **File Info:** Filename and formatted size
- **Download Links:** Direct download URLs
- **Size Formatting:** Human-readable file sizes (KB, MB, GB)
- **Empty State:** Nothing shown if no attachments

### Usage

```svelte
<script>
  import { MessageAttachments } from '$lib/components/thread/MessageAttachments.svelte';
</script>

{#if attachments.length > 0}
  <MessageAttachments {attachments} messageId={message.uuid} />
{/if}
```

### Utilities

**formatFileSize(bytes):**
- Returns human-readable size
- Formats as KB, MB, or GB
- Shows 1 decimal place

### Download URLs

Format: `/attachment/{message_uuid}/{attachment_uuid}/{filename}`

### Styling

- Uses postal paper color
- Paperclip icon indicator
- List with hover states

**Size:** 81 lines  
**Dependencies:** None (vanilla Svelte)

---

## ReportPanel

Form for reporting inappropriate messages to moderators.

### Props

```typescript
interface Props {
  messageId: string;  // UUID of message being reported
  formData?: any;     // Form submission data
}
```

### Features

- **Reason Input:** Textarea for report details
- **Validation:** Required field
- **Success Message:** Confirmation on submission
- **Cancel Action:** Close without submitting
- **Error Handling:** Shows submission errors

### Usage

```svelte
<script>
  import { ReportPanel } from '$lib/components/thread/ReportPanel.svelte';
  
  let reportOpenFor = $state(null);
</script>

{#if reportOpenFor === message.uuid}
  <ReportPanel
    messageId={message.uuid}
    formData={form}
  />
{/if}
```

### Form Action

- `?/report` - POST to submit report
- Hidden field: `message_uuid`
- Required field: `reason`

### States

- **Initial:** Empty form
- **Success:** Shows confirmation message
- **Error:** Displays error alert

### Callback Props

- `onCancel` - Called when user cancels

**Size:** 59 lines  
**Dependencies:** @bfs/ui (Alert, Button, Textarea)

---

## Common Patterns

### Thread Page Layout

```svelte
<script>
  import { 
    MessageCard, 
    ThreadLabels, 
    ReplyForm 
  } from '$lib/components/thread';
  
  let reportOpenFor = $state(null);
</script>

<!-- Thread metadata -->
<div class="thread-header">
  <h1>{thread.subject}</h1>
  <ThreadLabels {availableLabels} {threadLabels} />
</div>

<!-- Message list -->
{#each messages as message}
  <MessageCard
    {message}
    actingAs={session.principal_uuid}
    attachments={message.attachments}
    {formatDateTime}
    bind:reportOpenFor
  />
{/each}

<!-- Reply form -->
<ReplyForm
  lastMessage={messages[messages.length - 1]}
  {signature}
  {formData}
/>
```

### Message Actions

All actions use SvelteKit form actions:

```typescript
// +page.server.ts
export const actions = {
  reply: async ({ request, locals }) => {
    const data = await request.formData();
    // Handle reply
  },
  
  trash: async ({ request, locals }) => {
    const data = await request.formData();
    // Trash message
  },
  
  report: async ({ request, locals }) => {
    const data = await request.formData();
    // Report to moderators
  },
  
  add_label: async ({ request, locals }) => {
    const data = await request.formData();
    // Add label to thread
  },
  
  remove_label: async ({ request, locals }) => {
    const data = await request.formData();
    // Remove label from thread
  }
};
```

---

## Design System Integration

### Colors

Thread components use postal theme tokens:

```css
/* Message cards */
--letter-paper: #fdfcf8     /* Received messages */
--envelope-cream: #fef9ee    /* Sent messages */
--ink-base: #2c2416          /* Text color */
--border-default: #e4d5b7    /* Borders */

/* Labels */
--label-bg: var(--color-surface)
--label-hover: var(--color-bg-hover)
```

### Typography

```css
.handle { 
  font-family: var(--font-sans);
  font-weight: 600;
}

.timestamp {
  font-size: var(--text-sm);
  color: var(--ink-light);
}

.recipient-label {
  font-size: var(--text-xs);
  font-weight: 500;
  text-transform: uppercase;
}
```

### Spacing

```css
.message-card {
  padding: var(--space-6);
  margin-bottom: var(--space-4);
}

.labels-section {
  gap: var(--space-3);
}

.reply-box {
  padding: var(--space-5);
}
```

---

## Testing

### Unit Tests

```typescript
// MessageCard.test.ts
import { render } from '@testing-library/svelte';
import MessageCard from './MessageCard.svelte';

test('displays sender and timestamp', () => {
  const { getByText } = render(MessageCard, {
    props: {
      message: mockMessage,
      actingAs: 'user-uuid',
      formatDateTime: (d) => d
    }
  });
  
  expect(getByText(`@${mockMessage.from_handle_cache}`))
    .toBeInTheDocument();
});

test('shows BCC only to sender', () => {
  const { queryByText } = render(MessageCard, {
    props: {
      message: { ...mockMessage, from_principal_uuid: 'user-uuid' },
      actingAs: 'user-uuid',
      formatDateTime: (d) => d
    }
  });
  
  expect(queryByText('BCC:')).toBeInTheDocument();
});
```

### Integration Tests

```typescript
// thread.spec.ts
test('user can reply to thread', async ({ page }) => {
  await page.goto('/thread/123');
  
  // Fill reply
  await page.fill('[name="body"]', 'My reply');
  await page.click('button:has-text("Send Reply")');
  
  // Verify reply appears
  await expect(page.locator('.message-card').last())
    .toContainText('My reply');
});

test('user can add label to thread', async ({ page }) => {
  await page.goto('/thread/123');
  
  // Open label menu
  await page.click('.add-label-btn');
  
  // Select label
  await page.click('button:has-text("Important")');
  
  // Verify label applied
  await expect(page.locator('.label-tag'))
    .toContainText('Important');
});
```

---

## Performance

### Component Sizes

| Component          | Lines | Complexity |
|--------------------|-------|------------|
| MessageCard        | 276   | High       |
| ThreadLabels       | 220   | Medium     |
| ReplyForm          | 118   | Medium     |
| MessageAttachments | 81    | Low        |
| ReportPanel        | 59    | Low        |

### Optimization Notes

- MessageCard is largest but unavoidable (handles many features)
- Use $derived for computed values (reactive but not re-created)
- Forms use progressive enhancement (work without JS)
- Minimal component state (most data from props)

---

## Accessibility

### Keyboard Navigation

- All forms keyboard accessible
- Buttons have proper focus states
- Labels can be added/removed with keyboard

### Screen Readers

- Semantic HTML structure
- ARIA labels on icon buttons
- Descriptive button text
- Form validation messages announced

### Color Contrast

- Text meets WCAG AA standards
- Label colors tested for readability
- Focus indicators clearly visible

---

## Migration Notes

### Before (Monolithic thread page)

```svelte
<!-- 732 lines of inline code -->
<div class="thread">
  <!-- Message display logic inline -->
  <!-- Label management inline -->
  <!-- Reply form inline -->
  <!-- All styles embedded -->
</div>
```

### After (Component-based)

```svelte
<!-- 128 lines with imported components -->
<MessageCard {message} ... />
<ThreadLabels {availableLabels} {threadLabels} />
<ReplyForm {lastMessage} {signature} />
```

**Benefits:**
- 82% size reduction
- Components reusable
- Easier to test
- Clearer responsibilities

---

## Future Enhancements

- [ ] Rich text editor for replies
- [ ] Inline attachment previews (images)
- [ ] Threaded reply visualization
- [ ] Keyboard shortcuts for actions
- [ ] Draft auto-save for replies
- [ ] Message reactions/emoji
- [ ] Read receipts
- [ ] Thread archiving

---

**Last Updated:** May 21, 2026  
**Maintained By:** BFS Mail Team
