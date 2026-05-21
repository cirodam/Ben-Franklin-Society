# Contact Components

Contact components manage contact groups for simplified recipient addressing.

**Location:** `lib/components/contacts/`  
**Components:** 3  
**Total Lines:** ~410

---

## ContactGroupCard

Display and editing interface for a single contact group.

### Props

```typescript
interface Props {
  group: ContactGroup;
  onEdit?: () => void;
  onDelete?: () => void;
}

interface ContactGroup {
  uuid: string;
  name: string;
  members: ContactMember[];
}

interface ContactMember {
  handle: string;
  display_name: string | null;
}
```

### Features

- **Group Name:** Prominent display
- **Member List:** All contacts in group
- **Member Count:** Quick summary
- **Edit Button:** Toggle edit mode
- **Delete Button:** Remove group
- **Expandable:** Show/hide member list

### Usage

```svelte
<script>
  import { ContactGroupCard } from '$lib/components/contacts/ContactGroupCard.svelte';
  
  let editingGroup = $state(null);
</script>

<ContactGroupCard
  {group}
  onEdit={() => editingGroup = group}
  onDelete={() => confirmDelete(group)}
/>
```

**Size:** 234 lines

---

## ContactGroupForm

Form for creating or editing contact groups.

### Props

```typescript
interface Props {
  group?: ContactGroup;  // Existing group (for editing)
  onCancel?: () => void;
  onSave?: () => void;
}
```

### Features

- **Name Input:** Group name field
- **Member Management:** Add/remove members
- **Handle Input:** Add new member by handle
- **Validation:** Required fields
- **Cancel/Save:** Form actions

### Usage

```svelte
<script>
  import { ContactGroupForm } from '$lib/components/contacts/ContactGroupForm.svelte';
</script>

{#if creating}
  <ContactGroupForm
    onCancel={() => creating = false}
    onSave={() => {
      creating = false;
      reload();
    }}
  />
{/if}
```

**Size:** 119 lines

---

## ContactGroupList

List container for all contact groups.

### Props

```typescript
interface Props {
  groups: ContactGroup[];
  onCreateNew?: () => void;
}
```

### Features

- **Group Grid:** Responsive layout
- **Empty State:** Shows when no groups
- **Create Button:** Add new group
- **Sorting:** Alphabetical by name

### Usage

```svelte
<script>
  import { ContactGroupList } from '$lib/components/contacts/ContactGroupList.svelte';
  
  let creating = $state(false);
</script>

<ContactGroupList
  groups={data.contact_groups}
  onCreateNew={() => creating = true}
/>
```

**Size:** 56 lines

---

## Common Patterns

### Contacts Page

```svelte
<script>
  import {
    ContactGroupCard,
    ContactGroupForm,
    ContactGroupList
  } from '$lib/components/contacts';
  
  let creating = $state(false);
  let editingGroup = $state(null);
</script>

<PageHeader title="Contacts" />

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
  
  {#each data.contact_groups as group}
    <ContactGroupCard
      {group}
      onEdit={() => editingGroup = group}
      onDelete={() => deleteGroup(group)}
    />
  {/each}
{/if}
```

---

## Testing

```typescript
test('user can create contact group', async ({ page }) => {
  await page.goto('/contacts');
  await page.click('button:has-text("New Group")');
  
  await page.fill('[name="name"]', 'Team');
  await page.fill('[name="members"]', '@alice, @bob');
  await page.click('button:has-text("Save")');
  
  await expect(page.locator('.contact-group-card'))
    .toContainText('Team');
});
```

---

**Last Updated:** May 21, 2026
