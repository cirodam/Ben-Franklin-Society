# Template Components

Template components manage reusable message templates.

**Location:** `lib/components/templates/`  
**Components:** 3  
**Total Lines:** ~295

---

## TemplateCard

Display and editing interface for a single template.

### Props

```typescript
interface Props {
  template: Template;
  onEdit?: () => void;
  onDelete?: () => void;
  onUse?: () => void;
}

interface Template {
  uuid: string;
  name: string;
  subject: string;
  body: string;
  created_at: string;
  usage_count?: number;
}
```

### Features

- **Template Name:** Prominent display
- **Subject Preview:** Shows template subject
- **Body Preview:** Truncated body content
- **Usage Count:** How many times used
- **Use Button:** Apply template to compose
- **Edit Button:** Modify template
- **Delete Button:** Remove template
- **Created Date:** Timestamp display

### Usage

```svelte
<script>
  import { TemplateCard } from '$lib/components/templates/TemplateCard.svelte';
  import { goto } from '$app/navigation';
</script>

<TemplateCard
  {template}
  onEdit={() => editingTemplate = template}
  onDelete={() => confirmDelete(template)}
  onUse={() => goto(`/compose?template=${template.uuid}`)}
/>
```

**Size:** 114 lines

---

## TemplateForm

Form for creating or editing templates.

### Props

```typescript
interface Props {
  template?: Template;  // Existing template (for editing)
  onCancel?: () => void;
  onSave?: () => void;
}
```

### Features

- **Name Input:** Template name field
- **Subject Input:** Email subject
- **Body Textarea:** Message content
- **Markdown Support:** Body uses markdown
- **Preview Mode:** Toggle preview
- **Validation:** Required fields
- **Cancel/Save:** Form actions

### Usage

```svelte
<script>
  import { TemplateForm } from '$lib/components/templates/TemplateForm.svelte';
</script>

{#if creating}
  <TemplateForm
    onCancel={() => creating = false}
    onSave={() => {
      creating = false;
      reload();
    }}
  />
{/if}
```

### Form Fields

- `name` (required): Template identifier
- `subject` (required): Email subject line
- `body` (required): Message content in markdown

**Size:** 121 lines

---

## TemplateList

List container for all templates.

### Props

```typescript
interface Props {
  templates: Template[];
  onCreateNew?: () => void;
}
```

### Features

- **Template Grid:** Responsive layout
- **Empty State:** Shows when no templates
- **Create Button:** Add new template
- **Sorting:** Alphabetical by name
- **Usage Stats:** Shows most/least used

### Usage

```svelte
<script>
  import { TemplateList } from '$lib/components/templates/TemplateList.svelte';
  
  let creating = $state(false);
</script>

<TemplateList
  templates={data.templates}
  onCreateNew={() => creating = true}
/>
```

**Size:** 58 lines

---

## Common Patterns

### Templates Page

```svelte
<script>
  import {
    TemplateCard,
    TemplateForm,
    TemplateList
  } from '$lib/components/templates';
  import { goto } from '$app/navigation';
  
  let creating = $state(false);
  let editingTemplate = $state(null);
</script>

<PageHeader title="Templates" />

{#if creating}
  <TemplateForm
    onCancel={() => creating = false}
    onSave={() => {
      creating = false;
      invalidate('app:templates');
    }}
  />
{:else if editingTemplate}
  <TemplateForm
    template={editingTemplate}
    onCancel={() => editingTemplate = null}
    onSave={() => {
      editingTemplate = null;
      invalidate('app:templates');
    }}
  />
{:else}
  <TemplateList
    templates={data.templates}
    onCreateNew={() => creating = true}
  />
  
  {#each data.templates as template}
    <TemplateCard
      {template}
      onEdit={() => editingTemplate = template}
      onDelete={() => deleteTemplate(template)}
      onUse={() => goto(`/compose?template=${template.uuid}`)}
    />
  {/each}
{/if}
```

### Using Template in Compose

```svelte
<!-- /compose/+page.svelte -->
<script>
  import { page } from '$app/stores';
  
  let templateUuid = $page.url.searchParams.get('template');
  let template = data.templates.find(t => t.uuid === templateUuid);
  
  let subjectValue = $state(template?.subject ?? '');
  let bodyValue = $state(template?.body ?? '');
</script>

<form method="POST">
  <Input
    name="subject"
    label="Subject"
    bind:value={subjectValue}
  />
  
  <Textarea
    name="body"
    label="Message"
    bind:value={bodyValue}
  />
  
  <Button type="submit">Send</Button>
</form>
```

---

## Testing

```typescript
test('user can create template', async ({ page }) => {
  await page.goto('/templates');
  await page.click('button:has-text("New Template")');
  
  await page.fill('[name="name"]', 'Weekly Update');
  await page.fill('[name="subject"]', 'Weekly Team Update');
  await page.fill('[name="body"]', 'This week we...');
  await page.click('button:has-text("Save")');
  
  await expect(page.locator('.template-card'))
    .toContainText('Weekly Update');
});

test('user can use template in compose', async ({ page }) => {
  await page.goto('/templates');
  await page.click('.template-card button:has-text("Use")');
  
  await expect(page).toHaveURL(/\/compose\?template=/);
  await expect(page.locator('[name="subject"]'))
    .toHaveValue('Weekly Team Update');
});
```

---

**Last Updated:** May 21, 2026
