# Component Usage Examples

Common patterns and recipes for using mail app components.

**Last Updated:** May 21, 2026

---

## Table of Contents

1. [Thread Display](#thread-display)
2. [Message Composition](#message-composition)
3. [Search Interface](#search-interface)
4. [Management Pages](#management-pages)
5. [Form Handling](#form-handling)
6. [State Management](#state-management)
7. [Error Handling](#error-handling)
8. [Loading States](#loading-states)

---

## Thread Display

### Basic Thread View

```svelte
<script lang="ts">
  import { MessageCard, ThreadLabels, ReplyForm } from '$lib/components/thread';
  import { formatDateTime } from '@bfs/ui';
  
  let { data, form } = $props();
  let reportOpenFor = $state<string | null>(null);
</script>

<div class="thread-view">
  <!-- Thread header -->
  <header class="thread-header">
    <h1>{data.thread.subject}</h1>
    <ThreadLabels
      availableLabels={data.labels}
      threadLabels={data.thread.labels}
    />
  </header>
  
  <!-- Message list -->
  <div class="message-list">
    {#each data.messages as message}
      <MessageCard
        {message}
        actingAs={data.session.principal_uuid}
        attachments={message.attachments}
        {formatDateTime}
        bind:reportOpenFor
      />
    {/each}
  </div>
  
  <!-- Reply form -->
  <ReplyForm
    lastMessage={data.messages[data.messages.length - 1]}
    signature={data.signature}
    formData={form}
  />
</div>
```

### Thread with Error Handling

```svelte
<script lang="ts">
  import { Alert } from '@bfs/ui';
  
  let { data, form } = $props();
</script>

{#if form?.error}
  <Alert variant="danger">{form.error}</Alert>
{/if}

{#if data.messages.length === 0}
  <EmptyState
    title="No messages"
    description="This thread has no messages yet"
  />
{:else}
  <!-- Thread content -->
{/if}
```

---

## Message Composition

### Full Compose Form

```svelte
<script lang="ts">
  import { Input, Textarea, Button, Card } from '@bfs/ui';
  import {
    RecipientFields,
    AttachmentsSection,
    TemplateSelector,
    AutosaveIndicator
  } from '$lib/components/compose';
  
  let { data } = $props();
  
  // Form state
  let toValue = $state('');
  let ccValue = $state('');
  let bccValue = $state('');
  let subjectValue = $state('');
  let bodyValue = $state('');
  let selectedTemplate = $state('');
  
  // Auto-save state
  let isSaving = $state(false);
  let lastSaved = $state<string | null>(null);
  let hasUnsavedChanges = $state(false);
  
  function handleTemplateSelect(template: Template | null) {
    if (template) {
      subjectValue = template.subject;
      bodyValue = template.body;
    }
  }
</script>

<PageHeader title="Compose Message" />

<Card>
  <form method="POST" action="?/send">
    <!-- Template selector -->
    <TemplateSelector
      templates={data.templates}
      bind:selectedTemplate
      onTemplateSelect={handleTemplateSelect}
    />
    
    <!-- Recipients -->
    <RecipientFields
      bind:toValue
      bind:ccValue
      bind:bccValue
      contactGroups={data.contact_groups}
    />
    
    <!-- Subject -->
    <Input
      id="subject"
      name="subject"
      label="Subject"
      placeholder="Message subject"
      bind:value={subjectValue}
      required
    />
    
    <!-- Body -->
    <Textarea
      id="body"
      name="body"
      label="Message"
      placeholder="Type your message here (Markdown supported)"
      bind:value={bodyValue}
      rows={12}
      required
    />
    
    <!-- Attachments -->
    <AttachmentsSection
      attachments={data.draft?.attachments ?? []}
      draftUuid={data.draft?.uuid}
    />
    
    <!-- Auto-save indicator -->
    <AutosaveIndicator
      {isSaving}
      {lastSaved}
      {hasUnsavedChanges}
    />
    
    <!-- Actions -->
    <div class="form-actions">
      <Button type="submit">Send Message</Button>
      <Button type="button" variant="secondary">Save Draft</Button>
      <Button type="button" variant="ghost" href="/">Cancel</Button>
    </div>
  </form>
</Card>
```

### Draft Auto-save Logic

```svelte
<script lang="ts">
  let autosaveTimer: number | null = null;
  
  // Watch for field changes
  $effect(() => {
    // Any change marks as unsaved
    if (toValue || subjectValue || bodyValue) {
      hasUnsavedChanges = true;
      
      // Debounce auto-save
      if (autosaveTimer) clearTimeout(autosaveTimer);
      autosaveTimer = setTimeout(autosaveDraft, 3000);
    }
  });
  
  async function autosaveDraft() {
    if (!hasUnsavedChanges) return;
    
    isSaving = true;
    
    try {
      const formData = new FormData();
      formData.append('to', toValue);
      formData.append('cc', ccValue);
      formData.append('bcc', bccValue);
      formData.append('subject', subjectValue);
      formData.append('body', bodyValue);
      
      const response = await fetch('?/save_draft', {
        method: 'POST',
        body: formData
      });
      
      if (response.ok) {
        lastSaved = new Date().toISOString();
        hasUnsavedChanges = false;
      }
    } finally {
      isSaving = false;
    }
  }
</script>
```

---

## Search Interface

### Complete Search Page

```svelte
<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import {
    SearchBar,
    SearchFilters,
    SearchResults
  } from '$lib/components/search';
  
  let { data } = $props();
  
  // Search state
  let query = $state($page.url.searchParams.get('q') ?? '');
  let labelFilter = $state($page.url.searchParams.get('label') ?? '');
  let dateFrom = $state($page.url.searchParams.get('from') ?? '');
  let dateTo = $state($page.url.searchParams.get('to') ?? '');
  let fromFilter = $state($page.url.searchParams.get('sender') ?? '');
  let currentPage = $state(Number($page.url.searchParams.get('page') ?? '1'));
  
  async function performSearch() {
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    if (labelFilter) params.set('label', labelFilter);
    if (dateFrom) params.set('from', dateFrom);
    if (dateTo) params.set('to', dateTo);
    if (fromFilter) params.set('sender', fromFilter);
    if (currentPage > 1) params.set('page', currentPage.toString());
    
    goto(`/search?${params.toString()}`);
  }
  
  function handlePageChange(page: number) {
    currentPage = page;
    performSearch();
  }
</script>

<PageHeader title="Search Messages" />

<!-- Search bar -->
<SearchBar
  bind:query
  onSubmit={performSearch}
/>

<!-- Filters -->
<SearchFilters
  bind:labelFilter
  bind:dateFrom
  bind:dateTo
  bind:fromFilter
  labels={data.labels}
  onApplyFilters={performSearch}
/>

<!-- Results -->
<SearchResults
  results={data.results}
  {query}
  totalCount={data.total}
  {currentPage}
  pageSize={20}
  onPageChange={handlePageChange}
/>
```

---

## Management Pages

### Labels Management

```svelte
<script lang="ts">
  import { LabelCard, LabelForm, LabelList } from '$lib/components/labels';
  import { invalidate } from '$app/navigation';
  
  let { data } = $props();
  
  let creating = $state(false);
  let editingLabel = $state<Label | null>(null);
</script>

<PageHeader title="Labels">
  <Button onclick={() => creating = true}>New Label</Button>
</PageHeader>

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
  
  <div class="label-grid">
    {#each data.labels as label}
      <LabelCard
        {label}
        onEdit={() => editingLabel = label}
        onDelete={() => deleteLabel(label)}
      />
    {/each}
  </div>
{/if}
```

### Contacts Management

```svelte
<script lang="ts">
  import {
    ContactGroupCard,
    ContactGroupForm,
    ContactGroupList
  } from '$lib/components/contacts';
  
  let { data } = $props();
  
  let creating = $state(false);
  let editingGroup = $state<ContactGroup | null>(null);
  
  async function deleteGroup(group: ContactGroup) {
    if (!confirm(`Delete group "${group.name}"?`)) return;
    
    const formData = new FormData();
    formData.append('uuid', group.uuid);
    
    await fetch('?/delete_group', {
      method: 'POST',
      body: formData
    });
    
    invalidate('app:contact-groups');
  }
</script>

<PageHeader title="Contact Groups">
  <Button onclick={() => creating = true}>New Group</Button>
</PageHeader>

{#if creating}
  <ContactGroupForm
    onCancel={() => creating = false}
    onSave={() => {
      creating = false;
      invalidate('app:contact-groups');
    }}
  />
{:else if editingGroup}
  <ContactGroupForm
    group={editingGroup}
    onCancel={() => editingGroup = null}
    onSave={() => {
      editingGroup = null;
      invalidate('app:contact-groups');
    }}
  />
{:else}
  <ContactGroupList
    groups={data.contact_groups}
    onCreateNew={() => creating = true}
  />
  
  <div class="group-grid">
    {#each data.contact_groups as group}
      <ContactGroupCard
        {group}
        onEdit={() => editingGroup = group}
        onDelete={() => deleteGroup(group)}
      />
    {/each}
  </div>
{/if}
```

---

## Form Handling

### Progressive Enhancement

```svelte
<script lang="ts">
  import { enhance } from '$app/forms';
  
  let isSubmitting = $state(false);
</script>

<form
  method="POST"
  action="?/send"
  use:enhance={() => {
    isSubmitting = true;
    
    return async ({ result, update }) => {
      isSubmitting = false;
      
      if (result.type === 'success') {
        // Clear form
        resetForm();
      }
      
      // Update page data
      await update();
    };
  }}
>
  <!-- Form fields -->
  
  <Button type="submit" disabled={isSubmitting}>
    {isSubmitting ? 'Sending...' : 'Send Message'}
  </Button>
</form>
```

### Validation

```svelte
<script lang="ts">
  let errors = $state<Record<string, string>>({});
  
  function validateForm() {
    errors = {};
    
    if (!toValue.trim()) {
      errors.to = 'At least one recipient required';
    }
    
    if (!subjectValue.trim()) {
      errors.subject = 'Subject is required';
    }
    
    if (!bodyValue.trim()) {
      errors.body = 'Message body is required';
    }
    
    return Object.keys(errors).length === 0;
  }
</script>

<form onsubmit={(e) => {
  if (!validateForm()) {
    e.preventDefault();
  }
}}>
  <Input
    name="to"
    bind:value={toValue}
    error={errors.to}
  />
  
  <Input
    name="subject"
    bind:value={subjectValue}
    error={errors.subject}
  />
</form>
```

---

## State Management

### Component State

```svelte
<script lang="ts">
  // Local state
  let query = $state('');
  let isOpen = $state(false);
  let selectedItems = $state<string[]>([]);
  
  // Derived state
  let hasSelection = $derived(selectedItems.length > 0);
  let queryLowerCase = $derived(query.toLowerCase());
</script>
```

### Bindable Props

```svelte
<script lang="ts">
  // In component
  let { value = $bindable('') } = $props();
</script>

<input bind:value />

<!-- Usage -->
<MyComponent bind:value={myValue} />
```

### Effect Side Effects

```svelte
<script lang="ts">
  let query = $state('');
  
  $effect(() => {
    // Runs when query changes
    console.log('Search query:', query);
    
    // Perform side effect
    performSearch();
  });
</script>
```

---

## Error Handling

### Display Errors

```svelte
<script lang="ts">
  import { Alert } from '@bfs/ui';
  
  let { form } = $props();
</script>

{#if form?.error}
  <Alert variant="danger">
    {form.error}
  </Alert>
{/if}

{#if form?.success}
  <Alert variant="success">
    {form.success}
  </Alert>
{/if}
```

### Try-Catch

```svelte
<script lang="ts">
  let error = $state<string | null>(null);
  let isLoading = $state(false);
  
  async function performAction() {
    error = null;
    isLoading = true;
    
    try {
      await apiCall();
    } catch (err) {
      error = err instanceof Error ? err.message : 'Unknown error';
    } finally {
      isLoading = false;
    }
  }
</script>

{#if error}
  <Alert variant="danger">{error}</Alert>
{/if}
```

---

## Loading States

### Component Loading

```svelte
<script lang="ts">
  let isLoading = $state(true);
  let data = $state(null);
  
  onMount(async () => {
    const response = await fetch('/api/data');
    data = await response.json();
    isLoading = false;
  });
</script>

{#if isLoading}
  <Spinner />
{:else if data}
  <!-- Content -->
{:else}
  <EmptyState title="No data" />
{/if}
```

### Button Loading

```svelte
<Button
  onclick={handleAction}
  disabled={isProcessing}
>
  {#if isProcessing}
    <Spinner size="sm" />
    Processing...
  {:else}
    Submit
  {/if}
</Button>
```

---

## Best Practices

### Component Composition

✅ **Good:** Small, focused components
```svelte
<RecipientFields bind:toValue bind:ccValue />
<AttachmentsSection {attachments} />
```

❌ **Bad:** Monolithic components
```svelte
<GiantComposeForm everything={here} />
```

### Props vs State

✅ **Good:** Receive data via props
```svelte
let { message, formatDateTime } = $props();
```

❌ **Bad:** Fetch data in component
```svelte
let message = $state(null);
onMount(() => fetch(...));
```

### Event Handling

✅ **Good:** Callback props
```svelte
let { onSubmit } = $props();
<button onclick={onSubmit}>Submit</button>
```

❌ **Bad:** Navigate in component
```svelte
<button onclick={() => goto('/somewhere')}>Submit</button>
```

---

**Last Updated:** May 21, 2026  
**Maintained By:** BFS Mail Team
