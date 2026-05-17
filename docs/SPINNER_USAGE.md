# Spinner Component Usage Guide

## Component Overview

The Spinner component provides a smooth, animated loading indicator with multiple sizes and variants.

---

## Basic Usage

```svelte
<script>
  import { Spinner } from '@bfs/ui';
</script>

<Spinner />
```

---

## With Label

```svelte
<Spinner label="Loading..." />
```

---

## Sizes

```svelte
<!-- Small - 16px -->
<Spinner size="sm" />

<!-- Medium (default) - 24px -->
<Spinner size="md" />

<!-- Large - 40px -->
<Spinner size="lg" />
```

---

## Variants

```svelte
<!-- Primary (accent color) - default -->
<Spinner variant="primary" />

<!-- Secondary (muted) -->
<Spinner variant="secondary" />

<!-- White (for dark backgrounds) -->
<Spinner variant="white" />
```

---

## In Buttons

### Loading Button

```svelte
<script>
  import { Button, Spinner } from '@bfs/ui';
  
  let loading = $state(false);
  
  async function handleSubmit() {
    loading = true;
    try {
      await someAsyncOperation();
    } finally {
      loading = false;
    }
  }
</script>

<Button onclick={handleSubmit} disabled={loading}>
  {#if loading}
    <Spinner size="sm" variant="white" />
    Processing...
  {:else}
    Submit
  {/if}
</Button>
```

---

## Page Loading States

### Full Page Loader

```svelte
<script>
  import { Spinner } from '@bfs/ui';
  
  let { data } = $props();
</script>

{#if data.loading}
  <div class="page-loader">
    <Spinner size="lg" label="Loading data..." />
  </div>
{:else}
  <!-- Page content -->
{/if}

<style>
  .page-loader {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 400px;
  }
</style>
```

### Centered Section Loader

```svelte
<div class="section">
  <h2>Recent Activity</h2>
  {#if loadingActivity}
    <div class="loader-container">
      <Spinner label="Loading activity..." />
    </div>
  {:else}
    <DataTable {columns} {rows} />
  {/if}
</div>

<style>
  .loader-container {
    display: flex;
    justify-content: center;
    padding: var(--space-8);
  }
</style>
```

---

## With EmptyState (Skeleton Pattern)

```svelte
<script>
  import { Spinner, EmptyState } from '@bfs/ui';
  
  let { data } = $props();
</script>

{#if data.loading}
  <EmptyState icon="">
    <Spinner size="lg" label="Loading motions..." />
  </EmptyState>
{:else if data.motions.length === 0}
  <EmptyState 
    icon="📋" 
    title="No motions yet"
  />
{:else}
  <!-- Content -->
{/if}
```

---

## Inline Loading

```svelte
<script>
  import { Spinner } from '@bfs/ui';
  
  let savingChanges = $state(false);
</script>

<div class="settings-row">
  <span>Auto-save</span>
  {#if savingChanges}
    <Spinner size="sm" label="Saving..." />
  {:else}
    <span class="success">✓ Saved</span>
  {/if}
</div>
```

---

## Form Submission States

```svelte
<script>
  import { enhance } from '$app/forms';
  import { Button, Spinner, Alert } from '@bfs/ui';
  
  let submitting = $state(false);
</script>

<form 
  method="POST" 
  use:enhance={() => {
    submitting = true;
    return async ({ result, update }) => {
      await update();
      submitting = false;
    };
  }}
>
  <Input name="email" type="email" required />
  
  <Button type="submit" disabled={submitting} fullWidth>
    {#if submitting}
      <Spinner size="sm" variant="white" />
      Sending...
    {:else}
      Send Invitation
    {/if}
  </Button>
</form>
```

---

## Data Fetching Pattern

```svelte
<script>
  import { Spinner } from '@bfs/ui';
  
  let loading = $state(true);
  let data = $state([]);
  
  async function loadData() {
    loading = true;
    try {
      const response = await fetch('/api/data');
      data = await response.json();
    } finally {
      loading = false;
    }
  }
  
  $effect(() => {
    loadData();
  });
</script>

{#if loading}
  <div class="centered">
    <Spinner size="lg" label="Loading data..." />
  </div>
{:else}
  <div class="results">
    {#each data as item}
      <div class="item">{item.name}</div>
    {/each}
  </div>
{/if}
```

---

## Modal Loading Content

```svelte
<script>
  import { Modal, Spinner, Button } from '@bfs/ui';
  
  let showModal = $state(false);
  let loadingDetails = $state(false);
  
  async function openModal(id: string) {
    showModal = true;
    loadingDetails = true;
    
    try {
      // Fetch details
      await fetchDetails(id);
    } finally {
      loadingDetails = false;
    }
  }
</script>

<Modal bind:open={showModal} title="Item Details">
  {#if loadingDetails}
    <div class="modal-loader">
      <Spinner label="Loading details..." />
    </div>
  {:else}
    <p>Details loaded!</p>
  {/if}
  
  {#snippet footer()}
    <Button onclick={() => showModal = false}>Close</Button>
  {/snippet}
</Modal>

<style>
  .modal-loader {
    display: flex;
    justify-content: center;
    padding: var(--space-8);
  }
</style>
```

---

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `size` | 'sm' \| 'md' \| 'lg' | 'md' | Spinner size (16px / 24px / 40px) |
| `variant` | 'primary' \| 'secondary' \| 'white' | 'primary' | Color variant |
| `label` | string | undefined | Optional loading text |

---

## Sizes Reference

| Size | Dimensions | Best For |
|------|------------|----------|
| `sm` | 16×16px | Inline text, small buttons, badges |
| `md` | 24×24px | Standard buttons, cards, small sections |
| `lg` | 40×40px | Page loaders, modals, large sections |

---

## Variants Reference

| Variant | Color | Best For |
|---------|-------|----------|
| `primary` | Accent color | Default usage, light backgrounds |
| `secondary` | Muted gray | Subtle loading states |
| `white` | White | Dark backgrounds, primary buttons |

---

## Styling Tips

### Center in Container

```svelte
<div class="container">
  <Spinner />
</div>

<style>
  .container {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 200px;
  }
</style>
```

### With Custom Spacing

```svelte
<Spinner label="Loading..." style="margin: var(--space-8) auto;" />
```

### Overlay Pattern

```svelte
{#if loading}
  <div class="overlay">
    <Spinner size="lg" variant="white" label="Processing..." />
  </div>
{/if}

<style>
  .overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }
</style>
```

---

## Features

✅ **Smooth animation** - SVG-based circular progress animation  
✅ **Multiple sizes** - sm (16px), md (24px), lg (40px)  
✅ **Color variants** - Primary, secondary, white  
✅ **Optional label** - Show loading text  
✅ **Accessible** - Proper ARIA attributes and role  
✅ **Lightweight** - Pure CSS animations, no JavaScript  
✅ **Responsive** - Scales with size prop  

---

## Animation Details

The spinner uses two CSS animations:
1. **Rotation** - Full 360° rotation (1s linear infinite)
2. **Dash** - Stroke dash offset animation (1.5s ease-in-out infinite)

This creates the smooth "chasing" effect where the circle appears to grow and shrink as it rotates.

---

## Accessibility

- ✅ `role="status"` for screen readers
- ✅ `aria-label` with loading message
- ✅ Label text visible and associated with spinner
- ✅ Respects `prefers-reduced-motion` (can be added if needed)

---

## Best Practices

1. **Always provide context** - Use `label` prop or surrounding text to explain what's loading
2. **Use appropriate size** - Match spinner size to the UI element
3. **Don't nest spinners** - One spinner per loading state
4. **Disable actions** - Disable buttons/forms while loading to prevent duplicate submissions
5. **Consider skeleton screens** - For complex layouts, skeleton screens may be better than spinners
6. **Timeout handling** - Show error state if loading takes too long
7. **Optimistic UI** - Consider showing content immediately and updating in background

---

## Common Patterns

### Button with Loading State

```svelte
<Button disabled={loading}>
  {#if loading}
    <Spinner size="sm" variant="white" />
  {/if}
  {loading ? 'Saving...' : 'Save Changes'}
</Button>
```

### Card Loading Placeholder

```svelte
<Card>
  {#if loading}
    <div class="card-loader">
      <Spinner />
    </div>
  {:else}
    <h3>{title}</h3>
    <p>{content}</p>
  {/if}
</Card>
```

### Table Loading Overlay

```svelte
<div class="table-container">
  {#if loading}
    <div class="table-loader">
      <Spinner label="Loading records..." />
    </div>
  {/if}
  <DataTable {columns} {rows} />
</div>

<style>
  .table-container {
    position: relative;
  }
  .table-loader {
    position: absolute;
    inset: 0;
    background: rgba(255, 255, 255, 0.9);
    display: flex;
    align-items: center;
    justify-content: center;
  }
</style>
```

---

## Component Exports

```typescript
// packages/ui/src/index.ts
export { default as Spinner } from './Spinner.svelte';
```

Import:
```svelte
<script>
  import { Spinner } from '@bfs/ui';
</script>
```
