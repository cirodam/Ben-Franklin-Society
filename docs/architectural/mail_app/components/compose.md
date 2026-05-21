# Compose Components

Compose components handle message composition with recipient management, attachments, and templates.

**Location:** `lib/components/compose/`  
**Components:** 4  
**Total Lines:** ~380

---

## AttachmentsSection

File upload and attachment management for compose/draft messages.

### Props

```typescript
interface Props {
  attachments?: Attachment[];  // Current attachments (default: [])
  draftUuid?: string | null;   // Draft UUID if editing (default: null)
}

interface Attachment {
  uuid: string;
  filename: string;
  size_bytes: number;
}
```

### Features

- **File Upload:** Multi-file selection with type restrictions
- **Attachment List:** Shows uploaded files with sizes
- **Remove Files:** Delete individual attachments
- **Size Display:** Formatted KB/MB display
- **Limits:** Max 10MB per file, 25MB total
- **Accepted Types:** PDF, images, documents, spreadsheets

### Usage

```svelte
<script>
  import { AttachmentsSection } from '$lib/components/compose/AttachmentsSection.svelte';
</script>

<AttachmentsSection
  attachments={draft?.attachments ?? []}
  draftUuid={draft?.uuid}
/>
```

### File Types Accepted

```
Documents: .pdf, .txt, .md, .doc, .docx
Spreadsheets: .csv, .xls, .xlsx
Presentations: .ppt, .pptx
Images: .png, .jpg, .jpeg, .gif, .webp
```

### Form Actions

- `?/delete_attachment` - POST to remove attachment
- File input name: `attachments` (multiple files)

### Size Formatting

- Displays as "X.X KB"
- Automatic conversion from bytes
- Shows 1 decimal place

**Size:** 163 lines  
**Dependencies:** SvelteKit forms

---

## RecipientFields

To/CC/BCC input fields with contact group integration.

### Props

```typescript
interface Props {
  toValue?: string;              // To field (bindable)
  ccValue?: string;              // CC field (bindable)
  bccValue?: string;             // BCC field (bindable)
  contactGroups?: ContactGroup[]; // Available groups (default: [])
}

interface ContactGroup {
  name: string;
  members: any[];
}
```

### Features

- **Three Fields:** To (required), CC (optional), BCC (optional)
- **Group Integration:** Quick-add buttons for contact groups
- **Member Count:** Shows group size
- **Format Hint:** Placeholder shows expected format
- **Auto-append:** Clicking group adds to To field

### Usage

```svelte
<script>
  import { RecipientFields } from '$lib/components/compose/RecipientFields.svelte';
  
  let toValue = $state('');
  let ccValue = $state('');
  let bccValue = $state('');
</script>

<RecipientFields
  bind:toValue
  bind:ccValue
  bind:bccValue
  contactGroups={data.contact_groups}
/>
```

### Input Format

Handles multiple formats:
- Single: `@username`
- Multiple: `@user1, @user2, @user3`
- Groups: `MyGroup` (expands on server)

### Group Pills

- Shows available contact groups
- Click to add to To field
- Displays member count
- Smart comma handling

### Validation

- To field is required
- Server validates handle format
- Groups expanded to member handles

**Size:** 91 lines  
**Dependencies:** @bfs/ui (Input)

---

## TemplateSelector

Dropdown to select and apply message templates.

### Props

```typescript
interface Props {
  templates: Template[];              // Available templates
  selectedTemplate?: string;          // Selected UUID (bindable)
  onTemplateSelect?: (template: Template | null) => void; // Callback
}

interface Template {
  uuid: string;
  name: string;
  subject: string;
  body: string;
}
```

### Features

- **Template List:** Shows all user templates
- **Select Dropdown:** Choose template by name
- **Auto-apply:** Fires callback on selection
- **Clear Option:** "-- No template --" option
- **Reactive:** Updates when selection changes

### Usage

```svelte
<script>
  import { TemplateSelector } from '$lib/components/compose/TemplateSelector.svelte';
  
  let selectedTemplate = $state('');
  let subjectValue = $state('');
  let bodyValue = $state('');
  
  function handleTemplateSelect(template: Template | null) {
    if (template) {
      subjectValue = template.subject;
      bodyValue = template.body;
    }
  }
</script>

<TemplateSelector
  {templates}
  bind:selectedTemplate
  onTemplateSelect={handleTemplateSelect}
/>
```

### Behavior

- `$effect` watches `selectedTemplate` changes
- Finds template by UUID
- Calls `onTemplateSelect` with template data
- Parent updates subject/body fields

### Empty State

- Component hidden if no templates
- Uses `{#if templates.length > 0}` guard

**Size:** 73 lines  
**Dependencies:** None (vanilla Svelte)

---

## AutosaveIndicator

Visual indicator for draft auto-save status.

### Props

```typescript
interface Props {
  isSaving: boolean;      // Currently saving
  lastSaved: string | null; // Last save timestamp
  hasUnsavedChanges: boolean; // Pending changes
}
```

### Features

- **Three States:** Saving, Saved, Unsaved changes
- **Timestamp:** Shows when last saved
- **Visual Feedback:** Color-coded status
- **Auto-update:** Reactive to save operations

### Usage

```svelte
<script>
  import { AutosaveIndicator } from '$lib/components/compose/AutosaveIndicator.svelte';
  
  let isSaving = $state(false);
  let lastSaved = $state<string | null>(null);
  let hasUnsavedChanges = $state(false);
  
  // In autosave logic
  async function autosave() {
    isSaving = true;
    await saveDraft();
    isSaving = false;
    lastSaved = new Date().toISOString();
    hasUnsavedChanges = false;
  }
</script>

<AutosaveIndicator
  {isSaving}
  {lastSaved}
  {hasUnsavedChanges}
/>
```

### Status Display

**Saving:**
```
⏳ Saving draft...
```

**Saved:**
```
✓ Draft saved at 3:45 PM
```

**Unsaved:**
```
• Unsaved changes
```

### Styling

- Saving: Blue/info color
- Saved: Green/success color
- Unsaved: Orange/warning color
- Icons for visual distinction

**Size:** 53 lines  
**Dependencies:** @bfs/ui (formatDateTime)

---

## Common Patterns

### Full Compose Form

```svelte
<script>
  import {
    AttachmentsSection,
    RecipientFields,
    TemplateSelector,
    AutosaveIndicator
  } from '$lib/components/compose';
  
  let toValue = $state('');
  let ccValue = $state('');
  let bccValue = $state('');
  let selectedTemplate = $state('');
  let subjectValue = $state('');
  let bodyValue = $state('');
  
  function handleTemplateSelect(template) {
    if (template) {
      subjectValue = template.subject;
      bodyValue = template.body;
    }
  }
</script>

<form method="POST" action="?/send">
  <!-- Template selection -->
  <TemplateSelector
    {templates}
    bind:selectedTemplate
    onTemplateSelect={handleTemplateSelect}
  />
  
  <!-- Recipients -->
  <RecipientFields
    bind:toValue
    bind:ccValue
    bind:bccValue
    {contactGroups}
  />
  
  <!-- Subject -->
  <Input
    name="subject"
    label="Subject"
    bind:value={subjectValue}
    required
  />
  
  <!-- Body -->
  <Textarea
    name="body"
    label="Message"
    bind:value={bodyValue}
    rows={12}
    required
  />
  
  <!-- Attachments -->
  <AttachmentsSection
    attachments={draft?.attachments ?? []}
    draftUuid={draft?.uuid}
  />
  
  <!-- Auto-save status -->
  <AutosaveIndicator
    {isSaving}
    {lastSaved}
    {hasUnsavedChanges}
  />
  
  <!-- Actions -->
  <Button type="submit">Send</Button>
  <Button type="button" variant="secondary">Save Draft</Button>
</form>
```

### Draft Auto-save

```svelte
<script>
  let isSaving = $state(false);
  let lastSaved = $state<string | null>(null);
  let hasUnsavedChanges = $state(false);
  let autosaveTimer: number | null = null;
  
  // Watch for changes
  $effect(() => {
    // Mark as unsaved when any field changes
    hasUnsavedChanges = true;
    
    // Debounce auto-save
    if (autosaveTimer) clearTimeout(autosaveTimer);
    autosaveTimer = setTimeout(autosave, 3000);
  });
  
  async function autosave() {
    if (!hasUnsavedChanges) return;
    
    isSaving = true;
    
    const formData = new FormData();
    formData.append('to', toValue);
    formData.append('subject', subjectValue);
    formData.append('body', bodyValue);
    
    const response = await fetch('?/save_draft', {
      method: 'POST',
      body: formData
    });
    
    if (response.ok) {
      isSaving = false;
      lastSaved = new Date().toISOString();
      hasUnsavedChanges = false;
    }
  }
</script>
```

---

## Design System Integration

### Colors

```css
/* Attachments section */
--background-secondary: #f9f9f9
--border-base: #ddd
--paper-light-blue: #f0f4f8

/* Template selector */
--paper-light-blue: #f0f4f8
--border-base: #ddd

/* Auto-save indicator */
--color-info: blue (saving)
--color-success: green (saved)
--color-warning: orange (unsaved)
```

### Spacing

```css
.attachments-section {
  padding: var(--space-4);
  border-radius: var(--radius-md);
}

.template-selector {
  padding: var(--space-4);
  margin-bottom: var(--space-4);
}
```

### Typography

```css
.label {
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  font-weight: 600;
}

.attachment-name {
  font-size: var(--text-sm);
}
```

---

## Testing

### Unit Tests

```typescript
// RecipientFields.test.ts
test('adds contact group to To field', async () => {
  const { getByText } = render(RecipientFields, {
    props: {
      contactGroups: [{ name: 'Team', members: [{}, {}] }]
    }
  });
  
  await fireEvent.click(getByText('Team (2)'));
  
  expect(component.toValue).toBe('Team');
});

// TemplateSelector.test.ts
test('calls onTemplateSelect when template chosen', async () => {
  const mockCallback = vi.fn();
  const { getByRole } = render(TemplateSelector, {
    props: {
      templates: [mockTemplate],
      onTemplateSelect: mockCallback
    }
  });
  
  const select = getByRole('combobox');
  await fireEvent.change(select, { target: { value: mockTemplate.uuid } });
  
  expect(mockCallback).toHaveBeenCalledWith(mockTemplate);
});
```

### Integration Tests

```typescript
// compose.spec.ts
test('user can compose and send message', async ({ page }) => {
  await page.goto('/compose');
  
  await page.fill('[name="to"]', '@recipient');
  await page.fill('[name="subject"]', 'Test message');
  await page.fill('[name="body"]', 'Message content');
  
  await page.click('button:has-text("Send")');
  
  await expect(page).toHaveURL('/sent');
});

test('template auto-fills subject and body', async ({ page }) => {
  await page.goto('/compose');
  
  await page.selectOption('[id="template-select"]', { label: 'Weekly Update' });
  
  await expect(page.locator('[name="subject"]'))
    .toHaveValue('Weekly Update');
  await expect(page.locator('[name="body"]'))
    .toContainText('This week');
});

test('user can upload attachment', async ({ page }) => {
  await page.goto('/compose');
  
  await page.setInputFiles('[name="attachments"]', 'test.pdf');
  
  await expect(page.locator('.attachment-item'))
    .toContainText('test.pdf');
});
```

---

## Performance

### Component Sizes

| Component           | Lines | Complexity |
|---------------------|-------|------------|
| AttachmentsSection  | 163   | Medium     |
| RecipientFields     | 91    | Low        |
| TemplateSelector    | 73    | Low        |
| AutosaveIndicator   | 53    | Low        |

### Optimization Notes

- Minimal component state
- Parent controls most data
- Auto-save debounced (3 seconds)
- File uploads use native input
- No heavy rendering

---

## Accessibility

### Keyboard Navigation

- All inputs keyboard accessible
- File input activates with Enter/Space
- Template dropdown keyboard navigable
- Tab order logical

### Screen Readers

- Labels properly associated
- File input has descriptive label
- Group pills have title attributes
- Status messages announced

### Forms

- Required fields marked
- Error messages clear
- Validation feedback immediate
- Submit prevented if invalid

---

## Migration Notes

### Before (Monolithic compose page)

```svelte
<!-- 497 lines with inline components -->
<form>
  <!-- All recipient logic inline -->
  <!-- All attachment handling inline -->
  <!-- All template selection inline -->
</form>
```

### After (Component-based)

```svelte
<!-- 221 lines with imported components -->
<RecipientFields ... />
<AttachmentsSection ... />
<TemplateSelector ... />
<AutosaveIndicator ... />
```

**Benefits:**
- 55% size reduction
- Reusable components
- Testable in isolation
- Clear responsibilities

---

## Future Enhancements

- [ ] Rich text editor for body
- [ ] Inline image uploads
- [ ] Drag-and-drop file uploads
- [ ] Recipient autocomplete
- [ ] Template preview modal
- [ ] Schedule send time
- [ ] Read receipt request
- [ ] Priority/importance flag

---

**Last Updated:** May 21, 2026  
**Maintained By:** BFS Mail Team
