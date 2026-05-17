# Checkbox Component Usage Guide

## Component Overview

The Checkbox component provides a styled checkbox with label, error states, and accessibility built in.

---

## Basic Usage

```svelte
<script>
  import { Checkbox } from '@bfs/ui';
  
  let agreed = $state(false);
</script>

<Checkbox bind:checked={agreed} name="terms">
  I agree to the terms and conditions
</Checkbox>
```

---

## With Error State

```svelte
<script>
  import { Checkbox } from '@bfs/ui';
  import type { ActionData } from './$types.js';
  
  let { form }: { form: ActionData } = $props();
  let confirmed = $state(false);
</script>

<Checkbox 
  bind:checked={confirmed}
  name="confirm"
  error={form?.errors?.confirm}
  required
>
  I understand this action cannot be undone
</Checkbox>
```

---

## With Hint

```svelte
<Checkbox 
  bind:checked={enableFeature}
  name="enable_feature"
  hint="This can be changed later in settings"
>
  Enable advanced features
</Checkbox>
```

---

## Disabled State

```svelte
<Checkbox 
  bind:checked={readOnly}
  name="readonly"
  disabled
>
  This option is currently unavailable
</Checkbox>
```

---

## In Forms

```svelte
<form method="POST" use:enhance>
  <FormField label="Committee Name">
    <Input name="name" required />
  </FormField>

  <Checkbox 
    bind:checked={enableSortition}
    name="enable_sortition"
    hint="If disabled, members must be manually added"
  >
    Enable sortition for this committee
  </Checkbox>

  {#if enableSortition}
    <FormField label="Number of Seats">
      <Input name="seat_count" type="number" />
    </FormField>
  {/if}

  <Button type="submit">Create Committee</Button>
</form>
```

---

## Multiple Checkboxes (Group)

```svelte
<script>
  import { Checkbox } from '@bfs/ui';
  
  let permissions = $state({
    read: false,
    write: false,
    admin: false
  });
</script>

<div class="checkbox-group">
  <h3>Permissions</h3>
  
  <Checkbox bind:checked={permissions.read} name="perm_read">
    Read access
  </Checkbox>
  
  <Checkbox bind:checked={permissions.write} name="perm_write">
    Write access
  </Checkbox>
  
  <Checkbox bind:checked={permissions.admin} name="perm_admin">
    Administrator access
  </Checkbox>
</div>

<style>
  .checkbox-group {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
  }
</style>
```

---

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `name` | string | undefined | Form field name |
| `checked` | boolean | false | Bindable - checkbox state |
| `disabled` | boolean | false | Disable the checkbox |
| `required` | boolean | false | Mark as required |
| `error` | string | undefined | Error message to display |
| `hint` | string | undefined | Helper text to display |
| `value` | string | undefined | Value sent with form (useful for groups) |
| `children` | Snippet | required | Label text/content |

---

## Migration Examples

### Before: Custom Checkbox

```svelte
<div class="field-check">
  <label>
    <input 
      type="checkbox" 
      name="enable_sortition" 
      checked={enableSortition}
      onchange={(e) => enableSortition = e.currentTarget.checked}
    />
    Enable sortition for this committee
  </label>
  <p class="field-hint">If disabled, members must be manually added</p>
</div>

<style>
  .field-check {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }
  
  .field-check label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    cursor: pointer;
  }
  
  .field-hint {
    margin-left: 1.5rem;
    font-size: 0.875rem;
    color: var(--color-text-muted);
  }
</style>
```

### After: Using Checkbox Component

```svelte
<script>
  import { Checkbox } from '@bfs/ui';
</script>

<Checkbox 
  bind:checked={enableSortition}
  name="enable_sortition"
  hint="If disabled, members must be manually added"
>
  Enable sortition for this committee
</Checkbox>
```

**Removed:** 
- ~25 lines of CSS
- Manual onchange handler
- Custom wrapper markup

---

## Features

✅ **Custom styled** - No browser default checkbox appearance  
✅ **Accessible** - Proper ARIA attributes and keyboard support  
✅ **Visual feedback** - Hover states, focus rings, checkmark animation  
✅ **Error states** - Red border and error message display  
✅ **Hint support** - Helper text below checkbox  
✅ **Disabled state** - Grayed out with reduced opacity  
✅ **Bindable** - Two-way binding with `bind:checked`  

---

## Design Details

- **Size:** 18x18px checkbox box
- **Checkmark:** Custom SVG checkmark icon
- **Colors:** Uses design tokens (--color-accent, --color-border, etc.)
- **Focus:** Outline on focus-visible (keyboard navigation)
- **Hover:** Border changes to accent color
- **Checked:** Background fills with accent color, white checkmark

---

## Accessibility

- ✅ Native `<input type="checkbox">` for keyboard support
- ✅ Associated `<label>` for click target
- ✅ `aria-invalid` when error present
- ✅ `aria-describedby` links to error/hint
- ✅ `role="alert"` on error messages
- ✅ Focus-visible outline for keyboard users

---

## Where to Use

**Committee creation/edit forms** - Enable sortition checkbox  
**Settings pages** - Feature toggles and preferences  
**Permissions** - Read/write/admin access checkboxes  
**Confirmations** - "I understand" acknowledgments  
**Filters** - Multi-select filter options  
**Agreements** - Terms acceptance, age verification  

---

## Component Exports

```typescript
// packages/ui/src/index.ts
export { default as Checkbox } from './Checkbox.svelte';
```

Import:
```svelte
<script>
  import { Checkbox } from '@bfs/ui';
</script>
```
