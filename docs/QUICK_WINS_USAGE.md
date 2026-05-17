# Quick Wins Components - Usage Guide

## ✅ Completed Components

All five Quick Win components have been created and are ready to use:

1. **Alert** - Success/error/warning/info messages
2. **Card** - Content containers with optional hover effects
3. **Input** - Text inputs with validation and error states
4. **Textarea** - Multi-line text input
5. **PageHeader** - Page titles with optional descriptions and action buttons
6. **EmptyState** - "No results" placeholder states

Plus bonus: **Button** component updated with `fullWidth` prop.

---

## Import Statement

```svelte
<script>
  import { 
    Alert, 
    Button, 
    Card, 
    EmptyState, 
    Input, 
    PageHeader, 
    Textarea 
  } from '@bfs/ui';
</script>
```

---

## Component Usage Examples

### Alert

```svelte
{#if form?.error}
  <Alert variant="danger">{form.error}</Alert>
{/if}

{#if form?.success}
  <Alert variant="success">Settings saved successfully!</Alert>
{/if}

<Alert variant="warning">
  This action cannot be undone.
</Alert>

<Alert variant="info">
  You have 3 pending notifications.
</Alert>
```

**Props:**
- `variant`: `'info' | 'success' | 'warning' | 'danger'` (default: `'info'`)

---

### Card

```svelte
<!-- Simple card -->
<Card>
  <h2>Card Title</h2>
  <p>Card content goes here.</p>
</Card>

<!-- Card with custom padding -->
<Card padding="lg">
  <h2>Spacious Card</h2>
</Card>

<!-- Clickable card with hover effect -->
<Card href="/bulletin/post-123" hover>
  <h2>Bulletin Post</h2>
  <p>Click to read more...</p>
</Card>
```

**Props:**
- `href`: Optional URL (makes card a link)
- `padding`: `'sm' | 'md' | 'lg'` (default: `'md'`)
- `hover`: `boolean` - Enable hover animation (default: `false`)

---

### Input

```svelte
<script>
  let email = $state('');
  let password = $state('');
</script>

<!-- Basic input -->
<Input
  type="email"
  name="email"
  bind:value={email}
  placeholder="your@email.com"
  required
/>

<!-- Input with hint -->
<Input
  type="text"
  name="handle"
  bind:value={handle}
  placeholder="@username"
  hint="Lowercase letters, numbers, and underscores only"
/>

<!-- Input with error -->
<Input
  type="password"
  name="password"
  bind:value={password}
  error={form?.errors?.password}
/>
```

**Props:**
- `type`: `'text' | 'email' | 'password' | 'url' | 'tel' | 'number' | 'search'` (default: `'text'`)
- `name`: Input name attribute
- `value`: Bindable value
- `placeholder`: Placeholder text
- `disabled`: Disable the input
- `required`: Mark as required
- `error`: Error message to display
- `hint`: Help text to display

---

### Textarea

```svelte
<script>
  let message = $state('');
</script>

<Textarea
  name="message"
  bind:value={message}
  placeholder="Write your message..."
  rows={6}
  hint="Maximum 500 characters"
/>

<Textarea
  name="description"
  bind:value={description}
  error={form?.errors?.description}
/>
```

**Props:**
- `name`: Input name attribute
- `value`: Bindable value
- `placeholder`: Placeholder text
- `disabled`: Disable the textarea
- `required`: Mark as required
- `rows`: Number of visible rows (default: `4`)
- `error`: Error message to display
- `hint`: Help text to display

---

### PageHeader

```svelte
<!-- Simple header -->
<PageHeader title="Motion Archive" />

<!-- Header with description -->
<PageHeader
  title="Motion Archive"
  description="Search and browse all motions across all deliberative bodies"
/>

<!-- Header with action button -->
<PageHeader title="Community Bulletin Board">
  {#snippet actions()}
    <Button href="/bulletin/new">+ New Notice</Button>
  {/snippet}
</PageHeader>

<!-- Header with multiple actions -->
<PageHeader title="Committee Management">
  {#snippet actions()}
    <Button variant="secondary" href="/committees/archive">Archive</Button>
    <Button href="/committees/new">+ New Committee</Button>
  {/snippet}
</PageHeader>
```

**Props:**
- `title`: Page title (required)
- `description`: Optional description text
- `actions`: Optional snippet for action buttons

---

### EmptyState

```svelte
<!-- Simple empty state -->
<EmptyState 
  title="No notices yet"
  description="Be the first to post!"
/>

<!-- Empty state with icon -->
<EmptyState
  icon="📭"
  title="No messages"
  description="Your inbox is empty. Check back later for new messages."
/>

<!-- Empty state with action -->
<EmptyState
  icon="📝"
  title="No motions found"
  description="Get started by creating your first motion."
>
  {#snippet actions()}
    <Button href="/motions/new">Create Motion</Button>
  {/snippet}
</EmptyState>
```

**Props:**
- `icon`: Optional emoji or icon character
- `title`: Empty state title (required)
- `description`: Optional description text
- `actions`: Optional snippet for action buttons

---

### Button (Enhanced)

```svelte
<!-- Full width button (great for forms) -->
<Button type="submit" fullWidth>Sign In</Button>

<!-- Different variants -->
<Button variant="primary">Primary Action</Button>
<Button variant="secondary">Secondary Action</Button>
<Button variant="danger">Delete</Button>
<Button variant="ghost">Cancel</Button>

<!-- Sizes -->
<Button size="sm">Small</Button>
<Button size="md">Medium (default)</Button>
```

**Props:**
- `variant`: `'primary' | 'secondary' | 'danger' | 'ghost'` (default: `'primary'`)
- `size`: `'sm' | 'md'` (default: `'md'`)
- `type`: `'button' | 'submit' | 'reset'` (default: `'button'`)
- `disabled`: Disable the button
- `fullWidth`: Make button full width (default: `false`)

---

## Migration Example

### Before (Login Page)

```svelte
{#if form?.error}
  <p class="login-error">{form.error}</p>
{/if}

<input
  id="email"
  name="email"
  type="email"
  required
  placeholder="Email"
  value={form?.email ?? ''}
/>

<input
  id="password"
  name="password"
  type="password"
  required
  placeholder="Password"
/>

<button type="submit" class="login-btn">Sign in</button>

<style>
  .login-error {
    padding: var(--space-3);
    background: var(--color-danger-subtle);
    border: 1px solid var(--color-danger);
    border-radius: var(--radius);
    color: var(--color-danger);
    font-size: var(--text-sm);
  }

  input {
    width: 100%;
    font-family: var(--font-sans);
    font-size: var(--text-sm);
    color: var(--color-text);
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius);
    padding: var(--space-2) var(--space-3);
    outline: none;
    transition: border-color 120ms, box-shadow 120ms;
  }

  input:focus {
    border-color: var(--color-accent);
    box-shadow: 0 0 0 3px var(--color-accent-subtle);
  }

  .login-btn {
    width: 100%;
    font-family: var(--font-sans);
    font-size: var(--text-sm);
    font-weight: var(--weight-medium);
    color: #fff;
    background: var(--color-accent);
    border: none;
    border-radius: var(--radius);
    padding: var(--space-2) var(--space-4);
    cursor: pointer;
    transition: background 120ms;
  }

  .login-btn:hover {
    background: var(--color-accent-hover);
  }
</style>
```

### After (Login Page)

```svelte
<script>
  import { Alert, Input, Button } from '@bfs/ui';
</script>

{#if form?.error}
  <Alert variant="danger">{form.error}</Alert>
{/if}

<Input
  id="email"
  name="email"
  type="email"
  required
  placeholder="Email"
  value={form?.email ?? ''}
/>

<Input
  id="password"
  name="password"
  type="password"
  required
  placeholder="Password"
/>

<Button type="submit" fullWidth>Sign in</Button>
```

**Result:** Reduced from ~50 lines to ~20 lines, with 100% consistent styling! 🎉

---

## Next Steps

1. **Start migrating** - Pick a page with forms (like login or committee creation)
2. **Replace components** one at a time - No need to migrate entire pages at once
3. **Remove duplicate styles** - Delete `<style>` blocks as you migrate
4. **Test thoroughly** - Ensure form submissions still work
5. **Expand coverage** - Move to lists, cards, and empty states

---

## Component Catalog

For a complete list of all available components, see [packages/ui/src/index.ts](../packages/ui/src/index.ts).
