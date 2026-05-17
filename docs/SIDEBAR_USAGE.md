# Sidebar & AppShell Usage Guide

## Components Overview

A complete layout system for building consistent application shells with sidebar navigation:

1. **AppShell** - Top-level layout wrapper
2. **Sidebar** - Vertical navigation sidebar container
3. **SidebarLink** - Navigation link with automatic active state detection
4. **SidebarDivider** - Horizontal divider for sections

---

## Basic Usage

### Complete Sidebar Layout

```svelte
<script lang="ts">
  import { AppShell, Sidebar, SidebarLink } from '@bfs/ui';
  import type { LayoutData } from './$types.js';
  
  let { data, children } = $props();
</script>

<AppShell>
  {#snippet sidebar()}
    <Sidebar>
      {#snippet brand()}
        BFS Governance
      {/snippet}
      
      {#snippet nav()}
        <SidebarLink href="/">🏛️ Home</SidebarLink>
        <SidebarLink href="/documents">📄 Documents</SidebarLink>
        <SidebarLink href="/committees">📋 Committees</SidebarLink>
        <SidebarLink href="/settings">⚙️ Settings</SidebarLink>
      {/snippet}
      
      {#snippet footer()}
        <div class="user-info">
          <div>{data.person.given_name} {data.person.family_name}</div>
          <div class="handle">@{data.person.handle}</div>
        </div>
        <form method="POST" action="/logout">
          <button type="submit">Sign out</button>
        </form>
      {/snippet}
    </Sidebar>
  {/snippet}
  
  {@render children()}
</AppShell>
```

---

## AppShell

Container for the entire application layout with sidebar and main content area.

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `sidebar` | Snippet | undefined | Optional sidebar content |
| `children` | Snippet | required | Main page content |
| `maxWidth` | 'sm' \| 'md' \| 'lg' \| 'xl' \| 'none' | 'none' | Max width for main content |

### Max Width Options

- `sm`: 640px
- `md`: 860px
- `lg`: 1000px
- `xl`: 1280px
- `none`: No max width

### Example with Max Width

```svelte
<AppShell maxWidth="lg">
  {#snippet sidebar()}
    <Sidebar>
      <!-- sidebar content -->
    </Sidebar>
  {/snippet}
  
  <PageHeader title="Dashboard" />
  <!-- page content -->
</AppShell>
```

### Without Sidebar

```svelte
<AppShell maxWidth="md">
  <PageHeader title="Login" />
  <!-- login form -->
</AppShell>
```

---

## Sidebar

Vertical navigation sidebar with brand, navigation, and footer areas.

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `brand` | Snippet | undefined | Brand/logo area at top |
| `nav` | Snippet | required | Navigation links area |
| `footer` | Snippet | undefined | Footer area at bottom |

### Features

✅ **Fixed positioning** - Sticky sidebar stays visible while scrolling  
✅ **Scrollable nav** - Navigation area scrolls if content overflows  
✅ **Design tokens** - Uses --color-surface, --color-border from theme  
✅ **Flexible sections** - Optional brand and footer snippets  

### Example: Minimal Sidebar

```svelte
<Sidebar>
  {#snippet nav()}
    <SidebarLink href="/">Home</SidebarLink>
    <SidebarLink href="/about">About</SidebarLink>
  {/snippet}
</Sidebar>
```

### Example: Full Sidebar

```svelte
<Sidebar>
  {#snippet brand()}
    <strong>My App</strong>
  {/snippet}
  
  {#snippet nav()}
    <SidebarLink href="/">Dashboard</SidebarLink>
    <SidebarLink href="/projects">Projects</SidebarLink>
    <SidebarDivider />
    <SidebarLink href="/settings">Settings</SidebarLink>
  {/snippet}
  
  {#snippet footer()}
    <div>User: {userName}</div>
  {/snippet}
</Sidebar>
```

---

## SidebarLink

Navigation link with automatic active state detection based on current URL.

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `href` | string | required | Link destination |
| `active` | boolean | auto-detected | Override active state |
| `badge` | string \| number | undefined | Show badge (e.g., unread count) |
| `variant` | 'default' \| 'accent' \| 'danger' | 'default' | Visual variant |
| `children` | Snippet | required | Link text/content |

### Active State Detection

The component automatically detects if the link is active by comparing `href` with the current `$page.url.pathname`:
- Exact match for home (`href="/"`)
- Starts-with match for other routes

You can override this by providing an explicit `active` prop.

### Example: Basic Links

```svelte
<SidebarLink href="/">Home</SidebarLink>
<SidebarLink href="/about">About</SidebarLink>
<SidebarLink href="/contact">Contact</SidebarLink>
```

### Example: With Badges

```svelte
<SidebarLink href="/inbox" badge={unreadCount}>
  Inbox
</SidebarLink>

<SidebarLink href="/notifications" badge="5">
  Notifications
</SidebarLink>
```

### Example: Variants

```svelte
<!-- Default (standard link) -->
<SidebarLink href="/dashboard">
  Dashboard
</SidebarLink>

<!-- Accent (special section like admin) -->
<SidebarLink href="/admin" variant="accent">
  Administration
</SidebarLink>

<!-- Danger (logout, delete) -->
<SidebarLink href="/logout" variant="danger">
  Sign Out
</SidebarLink>
```

### Example: Explicit Active State

```svelte
<SidebarLink href="/products" active={category === 'products'}>
  Products
</SidebarLink>

<SidebarLink href="/services" active={category === 'services'}>
  Services
</SidebarLink>
```

---

## SidebarDivider

Simple horizontal rule for separating navigation sections.

### Example

```svelte
<SidebarLink href="/">Home</SidebarLink>
<SidebarLink href="/documents">Documents</SidebarLink>

<SidebarDivider />

<SidebarLink href="/settings">Settings</SidebarLink>
<SidebarLink href="/help">Help</SidebarLink>
```

---

## Complete Examples

### Governance App Migration

**Before** (`apps/governance/src/routes/(app)/+layout.svelte`):

```svelte
<script lang="ts">
  let { data, children } = $props();
  
  const nav = [
    { href: '/', label: '🏛️ Home' },
    { href: '/my/documents', label: '📝 My Documents' },
    // ... more items
  ];
</script>

<div class="shell">
  <aside class="sidebar">
    <div class="sidebar__brand">BFS Governance</div>
    <nav class="sidebar__nav">
      {#each nav as item}
        <a href={item.href} class="sidebar__link">{item.label}</a>
      {/each}
    </nav>
    <div class="sidebar__footer">
      <div class="sidebar__identity">
        <span class="sidebar__name">{data.person.given_name} {data.person.family_name}</span>
        <span class="sidebar__handle">@{data.person.handle}</span>
      </div>
      <form method="POST" action="/logout">
        <button type="submit" class="sidebar__signout">Sign out</button>
      </form>
    </div>
  </aside>
  <main class="main">{@render children()}</main>
</div>

<style>
  .shell { display: flex; min-height: 100vh; }
  .sidebar { width: 220px; /* ... 80+ lines of CSS */ }
  /* ... rest of styles */
</style>
```

**After** (using shared components):

```svelte
<script lang="ts">
  import { AppShell, Sidebar, SidebarLink, SidebarDivider } from '@bfs/ui';
  import type { LayoutData } from './$types.js';
  
  let { data, children }: { data: LayoutData; children: Snippet } = $props();
</script>

<AppShell>
  {#snippet sidebar()}
    <Sidebar>
      {#snippet brand()}
        BFS Governance
      {/snippet}
      
      {#snippet nav()}
        <SidebarLink href="/">🏛️ Home</SidebarLink>
        <SidebarLink href="/my/documents">📝 My Documents</SidebarLink>
        <SidebarLink href="/my/motions">📋 My Motions</SidebarLink>
        <SidebarLink href="/referenda">📢 Community Referenda</SidebarLink>
        <SidebarLink href="/general-assembly">🏛️ General Assembly</SidebarLink>
        <SidebarLink href="/committees">📋 Committees</SidebarLink>
        <SidebarLink href="/directory">📇 Directory</SidebarLink>
        <SidebarLink href="/services">🏢 Services</SidebarLink>
        <SidebarLink href="/colleges">🎓 Colleges</SidebarLink>
        <SidebarLink href="/documents">📄 Documents</SidebarLink>
        <SidebarLink href="/record">📝 The Record</SidebarLink>
        <SidebarLink href="/federation/lineage">🔗 Federation</SidebarLink>
        
        <SidebarDivider />
        
        <SidebarLink href="/settings/oidc-clients">🔑 OIDC Clients</SidebarLink>
        <SidebarLink href="/config">⚙️ Settings</SidebarLink>
      {/snippet}
      
      {#snippet footer()}
        <div style="display: flex; flex-direction: column; gap: 2px;">
          <span style="font-size: var(--text-sm); font-weight: var(--weight-medium);">
            {data.person.given_name} {data.person.family_name}
          </span>
          <span style="font-size: var(--text-xs); color: var(--color-text-muted); font-family: var(--font-mono);">
            @{data.person.handle}
          </span>
        </div>
        <form method="POST" action="/logout">
          <button 
            type="submit" 
            style="font-size: var(--text-xs); color: var(--color-text-muted); background: none; border: none; cursor: pointer; padding: 0; margin-top: var(--space-2);"
          >
            Sign out
          </button>
        </form>
      {/snippet}
    </Sidebar>
  {/snippet}
  
  {@render children()}
</AppShell>
```

**Removed:** ~100 lines of CSS  
**Benefit:** Automatic active state highlighting on links

---

### Mail App Migration

**After** (using shared components):

```svelte
<script lang="ts">
  import { AppShell, Sidebar, SidebarLink, SidebarDivider, Button } from '@bfs/ui';
  import type { LayoutData } from './$types.js';
  
  let { data, children }: { data: LayoutData; children: Snippet } = $props();
  
  const { isModerator, unreadCount } = $derived(data);
</script>

<AppShell maxWidth="md">
  {#snippet sidebar()}
    <Sidebar>
      {#snippet brand()}
        BFS Mail
      {/snippet}
      
      {#snippet nav()}
        <div style="padding: var(--space-3);">
          <Button href="/compose" fullWidth>+ Compose</Button>
        </div>
        
        <SidebarLink href="/" badge={unreadCount > 0 ? unreadCount : undefined}>
          Inbox
        </SidebarLink>
        <SidebarLink href="/sent">Sent</SidebarLink>
        <SidebarLink href="/drafts">Drafts</SidebarLink>
        <SidebarLink href="/trash">Trash</SidebarLink>
        
        {#if isModerator}
          <SidebarDivider />
          <SidebarLink href="/moderator" variant="accent">
            Moderation
          </SidebarLink>
        {/if}
      {/snippet}
      
      {#snippet footer()}
        {#if data.session}
          <span style="font-size: var(--text-xs); color: var(--color-text-muted); font-family: var(--font-mono);">
            @{data.session.handle}
          </span>
        {/if}
      {/snippet}
    </Sidebar>
  {/snippet}
  
  {@render children()}
</AppShell>
```

**Removed:** ~100 lines of CSS  
**Features Used:**
- Badge on Inbox link for unread count
- Conditional moderation link
- Button for compose action
- User handle in footer

---

## Styling Tips

### Custom Footer Content

```svelte
{#snippet footer()}
  <div class="user-card">
    <img src={avatar} alt={userName} class="avatar" />
    <div class="user-details">
      <div class="user-name">{userName}</div>
      <div class="user-email">{email}</div>
    </div>
  </div>
  
  <button class="logout-btn" onclick={logout}>
    Sign out
  </button>
{/snippet}

<style>
  .user-card {
    display: flex;
    gap: var(--space-3);
    align-items: center;
  }
  .avatar {
    width: 32px;
    height: 32px;
    border-radius: 50%;
  }
  .user-details {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .user-name {
    font-size: var(--text-sm);
    font-weight: var(--weight-medium);
  }
  .user-email {
    font-size: var(--text-xs);
    color: var(--color-text-muted);
  }
  .logout-btn {
    width: 100%;
    margin-top: var(--space-2);
    padding: var(--space-2);
    font-size: var(--text-xs);
    color: var(--color-text-muted);
    background: none;
    border: 1px solid var(--color-border);
    border-radius: var(--radius);
    cursor: pointer;
  }
  .logout-btn:hover {
    background: var(--color-danger-subtle);
    color: var(--color-danger);
    border-color: var(--color-danger);
  }
</style>
```

### Grouped Links

```svelte
{#snippet nav()}
  <div class="nav-section">
    <div class="nav-section-title">Main</div>
    <SidebarLink href="/">Dashboard</SidebarLink>
    <SidebarLink href="/projects">Projects</SidebarLink>
  </div>
  
  <SidebarDivider />
  
  <div class="nav-section">
    <div class="nav-section-title">Settings</div>
    <SidebarLink href="/profile">Profile</SidebarLink>
    <SidebarLink href="/preferences">Preferences</SidebarLink>
  </div>
{/snippet}

<style>
  .nav-section {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .nav-section-title {
    font-size: var(--text-xs);
    font-weight: var(--weight-bold);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--color-text-muted);
    padding: var(--space-2) var(--space-4);
    margin-top: var(--space-2);
  }
</style>
```

---

## Advanced Patterns

### Role-Based Navigation

```svelte
<script lang="ts">
  import { AppShell, Sidebar, SidebarLink, SidebarDivider } from '@bfs/ui';
  
  let { data } = $props();
  const { person, roles } = $derived(data);
</script>

<AppShell>
  {#snippet sidebar()}
    <Sidebar>
      {#snippet nav()}
        <SidebarLink href="/">Dashboard</SidebarLink>
        <SidebarLink href="/documents">Documents</SidebarLink>
        
        {#if roles.includes('admin')}
          <SidebarDivider />
          <SidebarLink href="/admin" variant="accent">
            Administration
          </SidebarLink>
          <SidebarLink href="/admin/users" variant="accent">
            Manage Users
          </SidebarLink>
        {/if}
        
        {#if roles.includes('moderator')}
          <SidebarDivider />
          <SidebarLink href="/moderate" variant="accent">
            Moderation Queue
          </SidebarLink>
        {/if}
      {/snippet}
    </Sidebar>
  {/snippet}
  
  {@render children()}
</AppShell>
```

### Nested Active States

```svelte
<script>
  import { page } from '$app/stores';
  
  const isSettingsActive = $derived($page.url.pathname.startsWith('/settings'));
</script>

<SidebarLink href="/settings" active={isSettingsActive}>
  ⚙️ Settings
</SidebarLink>
```

### Dynamic Badge Updates

```svelte
<script>
  import { onMount } from 'svelte';
  
  let notificationCount = $state(0);
  
  onMount(() => {
    const interval = setInterval(async () => {
      const res = await fetch('/api/notifications/count');
      const data = await res.json();
      notificationCount = data.count;
    }, 30000); // Poll every 30 seconds
    
    return () => clearInterval(interval);
  });
</script>

<SidebarLink href="/notifications" badge={notificationCount > 0 ? notificationCount : undefined}>
  Notifications
</SidebarLink>
```

---

## Migration Benefits

### Before (Custom Implementation)

- **100+ lines** of CSS per layout
- **No active state** - manually track active page
- **Inconsistent** - different styles across apps
- **Hard to maintain** - changes need to be replicated

### After (Shared Components)

- **~0 lines** of custom CSS (can add styling inline or in <style>)
- **Automatic active state** - works out of the box
- **Consistent** - same look and behavior everywhere
- **Easy to maintain** - update component once, affects all apps

### Code Reduction Per Layout

Typical layout file goes from **130 lines → 50 lines** (~60% reduction)

---

## Component Exports

```typescript
// packages/ui/src/index.ts
export { default as AppShell } from './AppShell.svelte';
export { default as Sidebar } from './Sidebar.svelte';
export { default as SidebarDivider } from './SidebarDivider.svelte';
export { default as SidebarLink } from './SidebarLink.svelte';
```

Import:
```svelte
<script>
  import { 
    AppShell, 
    Sidebar, 
    SidebarLink, 
    SidebarDivider 
  } from '@bfs/ui';
</script>
```

---

## Best Practices

1. **Use AppShell** - Wrap your layout in AppShell for consistent structure
2. **Active detection** - Let SidebarLink auto-detect active state
3. **Badges for counts** - Use badge prop for unread/notification counts
4. **Dividers for sections** - Use SidebarDivider to separate link groups
5. **Variants for special links** - Use `variant="accent"` for admin/special sections
6. **Keep it simple** - Don't over-complicate the footer, keep user info minimal
7. **Max width** - Set appropriate maxWidth on AppShell for content readability

---

## Accessibility

✅ **Semantic HTML** - Uses `<aside>`, `<nav>`, `<a>` elements  
✅ **Keyboard navigation** - All links fully keyboard accessible  
✅ **Focus states** - Clear focus indicators on links  
✅ **Screen readers** - Proper structure and landmarks  
✅ **Active indication** - Bold weight and color for active link  

---

## Features Summary

### Sidebar
- Fixed 220px width
- Sticky positioning (stays visible on scroll)
- Scrollable navigation area
- Optional brand header
- Optional footer section
- Design token integration

### SidebarLink
- Automatic active state detection
- Badge support for counts
- 3 variants (default, accent, danger)
- Hover states
- Smooth transitions
- Flexible content via snippets

### AppShell
- Flexible layout container
- Optional sidebar
- Configurable max-width for content
- Responsive flexbox layout
- Minimal styling (lets content shine)

### SidebarDivider
- Simple horizontal rule
- Consistent spacing
- Design token colors
