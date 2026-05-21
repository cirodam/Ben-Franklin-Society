# Label Components

Label components manage thread labels for organization and filtering.

**Location:** `lib/components/labels/`  
**Components:** 3  
**Total Lines:** ~290

---

## LabelCard

Display and editing interface for a single label.

### Props

```typescript
interface Props {
  label: Label;
  onEdit?: () => void;
  onDelete?: () => void;
}

interface Label {
  uuid: string;
  name: string;
  color: string | null;
  thread_count?: number;
}
```

### Features

- **Color Indicator:** Visual color dot
- **Label Name:** Prominent display
- **Thread Count:** Usage statistics
- **Edit Button:** Toggle edit mode
- **Delete Button:** Remove label
- **Color Preview:** Large color swatch

### Usage

```svelte
<script>
  import { LabelCard } from '$lib/components/labels/LabelCard.svelte';
  
  let editingLabel = $state(null);
</script>

<LabelCard
  {label}
  onEdit={() => editingLabel = label}
  onDelete={() => confirmDelete(label)}
/>
```

**Size:** 97 lines

---

## LabelForm

Form for creating or editing labels.

### Props

```typescript
interface Props {
  label?: Label;  // Existing label (for editing)
  onCancel?: () => void;
  onSave?: () => void;
}
```

### Features

- **Name Input:** Label name field
- **Color Picker:** Choose label color
- **Preset Colors:** Quick color selection
- **Custom Color:** Hex input
- **Validation:** Required name, valid color
- **Cancel/Save:** Form actions

### Usage

```svelte
<script>
  import { LabelForm } from '$lib/components/labels/LabelForm.svelte';
</script>

{#if creating}
  <LabelForm
    onCancel={() => creating = false}
    onSave={() => {
      creating = false;
      reload();
    }}
  />
{/if}
```

### Preset Colors

```typescript
const presets = [
  '#e74c3c', // Red
  '#3498db', // Blue
  '#2ecc71', // Green
  '#f39c12', // Orange
  '#9b59b6', // Purple
  '#1abc9c', // Teal
  '#e67e22', // Orange
  '#95a5a6'  // Gray
];
```

**Size:** 152 lines

---

## LabelList

List container for all labels.

### Props

```typescript
interface Props {
  labels: Label[];
  onCreateNew?: () => void;
}
```

### Features

- **Label Grid:** Responsive layout
- **Empty State:** Shows when no labels
- **Create Button:** Add new label
- **Sorting:** Alphabetical by name

### Usage

```svelte
<script>
  import { LabelList } from '$lib/components/labels/LabelList.svelte';
  
  let creating = $state(false);
</script>

<LabelList
  labels={data.labels}
  onCreateNew={() => creating = true}
/>
```

**Size:** 37 lines

---

## Common Patterns

### Labels Page

```svelte
<script>
  import {
    LabelCard,
    LabelForm,
    LabelList
  } from '$lib/components/labels';
  
  let creating = $state(false);
  let editingLabel = $state(null);
</script>

<PageHeader title="Labels" />

{#if creating}
  <LabelForm
    onCancel={() => creating = false}
    onSave={() => {
      creating = false;
      invalidate('app:labels');
    }}
  />
{:else if editingLabel}
  <LabelForm
    label={editingLabel}
    onCancel={() => editingLabel = null}
    onSave={() => {
      editingLabel = null;
      invalidate('app:labels');
    }}
  />
{:else}
  <LabelList
    labels={data.labels}
    onCreateNew={() => creating = true}
  />
  
  {#each data.labels as label}
    <LabelCard
      {label}
      onEdit={() => editingLabel = label}
      onDelete={() => deleteLabel(label)}
    />
  {/each}
{/if}
```

---

## Testing

```typescript
test('user can create label', async ({ page }) => {
  await page.goto('/labels');
  await page.click('button:has-text("New Label")');
  
  await page.fill('[name="name"]', 'Important');
  await page.click('[data-color="#e74c3c"]');
  await page.click('button:has-text("Save")');
  
  await expect(page.locator('.label-card'))
    .toContainText('Important');
});
```

---

**Last Updated:** May 21, 2026
