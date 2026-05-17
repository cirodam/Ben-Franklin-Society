# BFS UI Component Inventory & Priorities

## Current Shared Components (`packages/ui/src/`)

✅ **Button.svelte** - Primary, secondary, danger, ghost variants
✅ **Badge.svelte** - Small status/label indicators  
✅ **FormField.svelte** - Label + input wrapper
✅ **DataTable.svelte** - Sortable data tables
✅ **AccountFinder.svelte** - User/entity search
✅ **theme.css** - Design tokens (colors, spacing, typography)

---

## Duplicated Patterns Across Apps

### 🔴 Critical Duplications (Build First)

**Input Fields** - Every form reinvents:
- Text inputs with focus states
- Password inputs
- Email inputs
- Number inputs
- Consistent error styling
- Placeholder behavior

**Cards** - Used everywhere:
- Bulletin board posts (governance)
- Account summaries (bank)
- Message previews (mail)
- Product listings (marketplace)
- All with slightly different padding/borders

**Sidebars** - All 4 apps have custom implementations:
- Navigation links
- Active state highlighting
- Brand/logo area
- User identity footer
- Role-specific sections

**Buttons** - Despite having Button.svelte:
- Login buttons (custom styles)
- "New" action buttons (+ New Notice, + Compose, etc.)
- Submit buttons in forms
- Cancel/delete buttons

### 🟡 Medium Priority

**Alerts/Messages**:
- Error messages (login errors, form validation)
- Success confirmations
- Warning notices
- Info banners

**Empty States**:
- "No results" messages
- "Be the first to post"
- Empty inbox
- No history yet

**Loading States**:
- Page loading
- Button loading (during submit)
- Data fetching spinners

**Lists/Tables**:
- Motion lists
- Transaction history
- Member directories
- Message threads

### 🟢 Lower Priority

**Modals/Dialogs**:
- Confirmation dialogs
- Form modals
- Detail popups

**Tabs**:
- Section navigation
- Settings panels

**Dropdowns**:
- User menus
- Action menus
- Select dropdowns

---

## Component Priority Matrix

### Phase 1: Forms (Week 1)
**Goal**: Never write form HTML again

| Component | Usage Count | Effort | Priority |
|-----------|-------------|--------|----------|
| Input | 50+ | Low | 🔴 Critical |
| Textarea | 15+ | Low | 🔴 Critical |
| Select | 10+ | Medium | 🔴 Critical |
| Checkbox | 8+ | Low | 🔴 Critical |
| Radio | 5+ | Medium | 🟡 Medium |
| Alert | 20+ | Low | 🔴 Critical |

### Phase 2: Layouts (Week 2)
**Goal**: Consistent app shells

| Component | Usage Count | Effort | Priority |
|-----------|-------------|--------|----------|
| AppShell | 4 (one per app) | Medium | 🔴 Critical |
| Sidebar* | 4 variations | High | 🔴 Critical |
| PageHeader | 40+ pages | Low | 🔴 Critical |
| Card | 30+ | Low | 🔴 Critical |

*Sidebar is complex - needs nav, sections, badges, active states

### Phase 3: Feedback (Week 3)
**Goal**: User feedback patterns

| Component | Usage Count | Effort | Priority |
|-----------|-------------|--------|----------|
| EmptyState | 15+ | Low | 🟡 Medium |
| Spinner | Global | Low | 🟡 Medium |
| Modal | 10+ | High | 🟡 Medium |
| Toast | Global | Medium | 🟢 Nice-to-have |

### Phase 4: Data Display (Week 4)
**Goal**: Consistent data presentation

| Component | Usage Count | Effort | Priority |
|-----------|-------------|--------|----------|
| DataGrid | 10+ | Medium | 🟡 Medium |
| StatusBadge | 20+ | Low | 🟡 Medium |
| DetailsRow | 15+ | Low | 🟢 Nice-to-have |
| Pagination | 5+ | Medium | 🟢 Nice-to-have |
| Avatar | 10+ | Low | 🟢 Nice-to-have |

---

## Quick Wins (Do These First)

### 1. Alert Component
**Why**: Used in every form for errors/success messages
**Effort**: 30 minutes
**Impact**: Eliminates 20+ duplicated alert styles

### 2. Card Component  
**Why**: Foundation for bulletin board, message list, dashboards
**Effort**: 45 minutes
**Impact**: Unifies all card-style containers

### 3. Input Component
**Why**: Most commonly used form element
**Effort**: 1 hour
**Impact**: Eliminates 50+ custom input styles

### 4. PageHeader Component
**Why**: Every page has title + optional actions
**Effort**: 30 minutes
**Impact**: Consistent headers across all pages

### 5. EmptyState Component
**Why**: Better UX than bare "No results" text
**Effort**: 20 minutes
**Impact**: Polished empty states everywhere

---

## Migration Roadmap

### Week 1: Core Forms
```bash
# Build components
Input, Textarea, Select, Checkbox, Alert

# Migrate
- All login/auth forms
- Motion creation forms
- Message composition
- Account settings
```

### Week 2: Layouts
```bash
# Build components
AppShell, Sidebar, PageHeader, Card

# Migrate
- Root layouts for all 4 apps
- Page headers across governance
- Bulletin board cards
- Message preview cards
```

### Week 3: Patterns
```bash
# Build components
EmptyState, Spinner, Modal, StatusBadge

# Migrate
- Empty states in lists
- Loading indicators
- Confirmation dialogs
- Status displays
```

### Week 4: Polish
```bash
# Build components
DataGrid, Pagination, Avatar, DetailsRow

# Migrate
- Member directories
- Transaction lists
- Detail pages
- Search results
```

---

## Measurement Plan

**Before (Current State)**:
```
CSS lines per app:
- Governance: ~2,500 lines
- Community Bank: ~1,800 lines
- Mail: ~1,600 lines
- Marketplace: ~1,200 lines
Total: ~7,100 lines of component CSS
```

**After (Target State)**:
```
Shared component CSS: ~1,500 lines
App-specific CSS per app: ~200-300 lines
Total: ~2,500 lines (65% reduction)
```

**Development Speed**:
- Before: New form page = 30-45 min styling
- After: New form page = 5-10 min assembly

**Bug Fixes**:
- Before: Fix applied 1x per app = 4 PRs
- After: Fix applied 1x in shared = 1 PR

---

## Next Steps

1. **Review this plan** with team
2. **Prioritize** which phase to start with
3. **Create** first batch of components (Alert, Card, Input)
4. **Migrate** one page as proof of concept
5. **Iterate** based on learnings
6. **Document** as you go
7. **Celebrate** consistency wins! 🎉
