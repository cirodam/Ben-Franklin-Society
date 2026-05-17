# Radio & RadioGroup Component Usage Guide

## Components Overview

Two components for radio button groups:
1. **Radio** - Individual radio button with label
2. **RadioGroup** - Wrapper for grouping radio buttons with shared label/error

---

## Basic Usage

### Individual Radio Buttons

```svelte
<script>
  import { Radio } from '@bfs/ui';
  
  let transferMode = $state('flat');
</script>

<Radio name="transfer_mode" value="flat" bind:groupValue={transferMode}>
  Flat amount from specific account
</Radio>

<Radio name="transfer_mode" value="percentage" bind:groupValue={transferMode}>
  Percentage from multiple accounts
</Radio>
```

### With RadioGroup Wrapper

```svelte
<script>
  import { Radio, RadioGroup } from '@bfs/ui';
  
  let accountType = $state('');
</script>

<RadioGroup label="Account Type" required>
  <Radio name="account_type" value="savings" bind:groupValue={accountType}>
    Savings Account
  </Radio>
  <Radio name="account_type" value="checking" bind:groupValue={accountType}>
    Checking Account
  </Radio>
  <Radio name="account_type" value="business" bind:groupValue={accountType}>
    Business Account
  </Radio>
</RadioGroup>
```

---

## With Error State

```svelte
<script>
  import { Radio, RadioGroup } from '@bfs/ui';
  import type { ActionData } from './$types.js';
  
  let { form }: { form: ActionData } = $props();
  let priority = $state('');
</script>

<RadioGroup 
  label="Priority Level" 
  error={form?.errors?.priority}
  required
>
  <Radio name="priority" value="urgent" bind:groupValue={priority}>
    Urgent - Needs immediate attention
  </Radio>
  <Radio name="priority" value="normal" bind:groupValue={priority}>
    Normal - Standard processing
  </Radio>
  <Radio name="priority" value="low" bind:groupValue={priority}>
    Low - When convenient
  </Radio>
</RadioGroup>
```

---

## With Hint

```svelte
<RadioGroup 
  label="Notification Preference" 
  hint="Choose how you'd like to receive updates"
>
  <Radio name="notifications" value="email" bind:groupValue={notifyMethod}>
    Email notifications
  </Radio>
  <Radio name="notifications" value="sms" bind:groupValue={notifyMethod}>
    SMS text messages
  </Radio>
  <Radio name="notifications" value="none" bind:groupValue={notifyMethod}>
    No notifications
  </Radio>
</RadioGroup>
```

---

## Disabled Options

```svelte
<script>
  import { Radio, RadioGroup } from '@bfs/ui';
  
  let plan = $state('free');
</script>

<RadioGroup label="Subscription Plan">
  <Radio name="plan" value="free" bind:groupValue={plan}>
    Free Plan - Basic features
  </Radio>
  <Radio name="plan" value="pro" bind:groupValue={plan}>
    Pro Plan - $10/month
  </Radio>
  <Radio name="plan" value="enterprise" bind:groupValue={plan} disabled>
    Enterprise - Contact sales (Coming soon)
  </Radio>
</RadioGroup>
```

---

## In Forms

```svelte
<script>
  import { enhance } from '$app/forms';
  import { Input, RadioGroup, Radio, Button } from '@bfs/ui';
  
  let transferMode = $state('flat');
  let targetFilter = $state('specific');
</script>

<form method="POST" use:enhance>
  <RadioGroup label="Transfer Mode" required>
    <Radio 
      name="transfer_mode" 
      value="flat" 
      bind:groupValue={transferMode}
    >
      Flat amount from specific account
    </Radio>
    <Radio 
      name="transfer_mode" 
      value="percentage" 
      bind:groupValue={transferMode}
    >
      Percentage from multiple accounts
    </Radio>
  </RadioGroup>

  {#if transferMode === 'flat'}
    <Input name="amount" type="number" placeholder="Amount..." />
  {/if}

  <Button type="submit">Create Transfer</Button>
</form>
```

---

## Horizontal Layout

```svelte
<RadioGroup label="Gender">
  <div style="display: flex; gap: var(--space-4);">
    <Radio name="gender" value="male" bind:groupValue={gender}>
      Male
    </Radio>
    <Radio name="gender" value="female" bind:groupValue={gender}>
      Female
    </Radio>
    <Radio name="gender" value="other" bind:groupValue={gender}>
      Other
    </Radio>
  </div>
</RadioGroup>
```

---

## Radio Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `name` | string | required | Radio group name (must match for all radios in group) |
| `value` | string \| number | required | Value for this radio option |
| `groupValue` | string \| number | undefined | Bindable - current selected value of the group |
| `disabled` | boolean | false | Disable this radio option |
| `required` | boolean | false | Mark as required (for accessibility) |
| `error` | string | undefined | Error message (usually set on RadioGroup instead) |
| `hint` | string | undefined | Helper text for this specific option |
| `children` | Snippet | required | Label text/content |

---

## RadioGroup Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `label` | string | undefined | Group label (legend) |
| `error` | string | undefined | Error message for entire group |
| `hint` | string | undefined | Helper text for entire group |
| `required` | boolean | false | Shows asterisk next to label |
| `children` | Snippet | required | Radio button components |

---

## Migration Examples

### Before: Custom Radio Buttons

```svelte
<div class="form-field">
  <label>Transfer Mode*</label>
  <div class="radio-group">
    <label class="radio-label">
      <input
        type="radio"
        name="transfer_mode"
        value="flat"
        checked={transferMode === 'flat'}
        onchange={() => { transferMode = 'flat'; }}
      />
      Flat amount from specific account
    </label>
    <label class="radio-label">
      <input
        type="radio"
        name="transfer_mode"
        value="percentage"
        checked={transferMode === 'percentage'}
        onchange={() => { transferMode = 'percentage'; }}
      />
      Percentage from multiple accounts
    </label>
  </div>
</div>

<style>
  .form-field {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .form-field > label {
    font-weight: 500;
    font-size: 0.875rem;
  }
  
  .radio-group {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }
  
  .radio-label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    cursor: pointer;
  }
  
  .radio-label input {
    margin: 0;
    cursor: pointer;
  }
</style>
```

### After: Using Radio Components

```svelte
<script>
  import { Radio, RadioGroup } from '@bfs/ui';
  
  let transferMode = $state('flat');
</script>

<RadioGroup label="Transfer Mode" required>
  <Radio name="transfer_mode" value="flat" bind:groupValue={transferMode}>
    Flat amount from specific account
  </Radio>
  <Radio name="transfer_mode" value="percentage" bind:groupValue={transferMode}>
    Percentage from multiple accounts
  </Radio>
</RadioGroup>
```

**Removed:** 
- ~40 lines of CSS
- Manual checked state management
- Custom onchange handlers
- Wrapper markup

---

## Features

### Radio Component
✅ **Custom styled** - No browser default radio appearance  
✅ **Accessible** - Proper ARIA attributes and keyboard support  
✅ **Visual feedback** - Hover states, focus rings, dot animation  
✅ **Error states** - Red border when error present  
✅ **Disabled state** - Grayed out with reduced opacity  
✅ **Bindable** - Two-way binding with `bind:groupValue`  
✅ **Animated** - Smooth "pop" animation when selected  

### RadioGroup Component
✅ **Semantic HTML** - Uses `<fieldset>` and `<legend>`  
✅ **Error display** - Shows error for entire group  
✅ **Hint support** - Helper text for group  
✅ **Required indicator** - Asterisk on label  
✅ **Consistent spacing** - Automatic gap between options  

---

## Design Details

- **Size:** 18x18px radio circle
- **Dot:** 8px inner dot with pop animation
- **Colors:** Uses design tokens (--color-accent, --color-border, etc.)
- **Focus:** Outline on focus-visible (keyboard navigation)
- **Hover:** Border changes to accent color
- **Selected:** Accent color border with inner dot
- **Animation:** Scale animation when dot appears

---

## Accessibility

- ✅ Native `<input type="radio">` for keyboard support
- ✅ Associated `<label>` for click target
- ✅ `<fieldset>` and `<legend>` for proper grouping
- ✅ `aria-invalid` when error present
- ✅ `aria-describedby` links to error/hint
- ✅ `role="alert"` on error messages
- ✅ Focus-visible outline for keyboard users
- ✅ `required` attribute for screen readers

---

## Where to Use

**Forms with exclusive choices:**
- Account type selection
- Payment method
- Delivery options
- Privacy settings
- Priority levels
- Transfer modes

**Settings pages:**
- Theme preference (light/dark/auto)
- Language selection
- Notification preferences
- Display options

**Filters:**
- Sort order (newest/oldest/popular)
- View mode (grid/list/compact)
- Time range (today/week/month)

---

## Best Practices

1. **Use RadioGroup** - Wrap related radios in RadioGroup for proper semantics
2. **Unique name** - All radios in a group must have the same `name`
3. **Unique values** - Each radio must have a unique `value`
4. **Default selection** - Initialize `groupValue` with a default to avoid empty state
5. **Clear labels** - Make option labels descriptive and concise
6. **Limit options** - For 5+ options, consider using Select instead
7. **Error placement** - Set error on RadioGroup, not individual radios

---

## Component Exports

```typescript
// packages/ui/src/index.ts
export { default as Radio } from './Radio.svelte';
export { default as RadioGroup } from './RadioGroup.svelte';
```

Import:
```svelte
<script>
  import { Radio, RadioGroup } from '@bfs/ui';
</script>
```
