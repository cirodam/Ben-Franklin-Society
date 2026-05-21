# Mail App Design System

**Last Updated:** May 21, 2026

## Overview

The mail app uses a layered design system approach:
1. **Base Tokens** (@bfs/ui/src/theme.css) - Shared across all BFS applications
2. **Mail Theme** (mail-theme.css) - Postal-themed overrides and extensions for the mail app

This provides a consistent foundation while allowing mail-specific customization for the postal correspondence aesthetic.

---

## Color System

### Base Colors (@bfs/ui)
```css
/* Backgrounds & Surfaces */
--color-bg:           #f9f9f8    /* Page background */
--color-bg-muted:     #f0f0ee    /* Muted backgrounds */
--color-surface:      #ffffff    /* Card/panel surfaces */

/* Borders */
--color-border:       #d8d8d5    /* Standard borders */
--color-border-faint: #eaeae7    /* Subtle borders */

/* Text */
--color-text:         #1a1a18    /* Primary text */
--color-text-muted:   #6b6b66    /* Secondary text */
--color-text-subtle:  #9b9b95    /* Tertiary text */

/* Interactive */
--color-accent:       #2d5fa3    /* Primary actions */
--color-accent-hover: #214d8a
--color-accent-subtle:#e8eef7

/* Semantic */
--color-danger:       #b83232    /* Errors, destructive */
--color-danger-hover: #952828
--color-danger-subtle:#fdf0f0

--color-success:      #2a7a3b    /* Success states */
--color-success-subtle:#edf7ef

--color-warn:         #8a6200    /* Warnings */
--color-warn-subtle:  #fdf6e0
```

### Mail Theme Overrides
```css
/* Postal Blue Palette */
--postal-blue:        #3d5a80    /* Primary postal blue */
--postal-blue-dark:   #2a4263
--postal-blue-mid:    #5b7fa8
--postal-blue-light:  #eef3f8

/* Ink Colors (Text) */
--ink-navy:           #1a1f2e    /* Primary text */
--ink-charcoal:       #374151    /* Secondary text */
--ink-slate:          #64748b    /* Muted text */
--ink-gray:           #94a3b8    /* Subtle text */
--ink-faint:          #cbd5e1    /* Very subtle text */

/* Paper & Surfaces */
--letter-paper:       #fefdfb    /* Main background */
--parchment:          #faf9f7    /* Alternate background */
--envelope-cream:     #f5f3ef    /* Card backgrounds */
--airmail-stripe:     #f8fafc    /* Stripe patterns */

/* Semantic (Postal Theme) */
--wax-red:            #be123c    /* Sealing wax (danger) */
--wax-red-light:      #fef2f3

--stamp-green:        #15803d    /* Postage stamp (success) */
--stamp-green-light:  #f0fdf4

/* Borders */
--border:             #e2e8f0
--border-strong:      #cbd5e1
--border-faint:       #f1f5f9
```

### Color Mapping
The mail theme maps to shared component tokens:
```css
--color-accent:        var(--postal-blue)
--color-accent-subtle: var(--postal-blue-light)
--color-surface:       var(--envelope-cream)
--color-bg:            var(--letter-paper)
--color-text:          var(--ink-navy)
--color-text-muted:    var(--ink-gray)
--color-success:       var(--stamp-green)
--color-danger:        var(--wax-red)
```

---

## Typography

### Fonts
```css
/* Base Fonts (@bfs/ui) */
--font-sans: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif
--font-mono: ui-monospace, "Cascadia Code", "Fira Code", monospace

/* Mail Theme Overrides */
--font-serif: 'Spectral', 'Georgia', 'Times New Roman', serif
--font-sans:  'DM Sans', 'Inter', system-ui, sans-serif
--font-mono:  'JetBrains Mono', 'Consolas', monospace
```

### Type Scale
```css
--text-xs:   0.75rem    /* 12px - Labels, metadata */
--text-sm:   0.875rem   /* 14px - Body text (secondary) */
--text-base: 0.9375rem  /* 15px - Body text (primary) */
--text-lg:   1rem       /* 16px - Subheadings */
--text-xl:   1.125rem   /* 18px - Section headers */
--text-2xl:  1.375rem   /* 22px - Page headers */
--text-3xl:  1.75rem    /* 28px - Major headings */
--text-4xl:  2rem       /* 32px - Display text */
```

### Font Weights
```css
--weight-normal:    400
--weight-medium:    500
--weight-semibold:  600
--weight-bold:      700
```

### Typography Utility Classes (Mail Theme)
```css
.t-letter   /* Serif body text for message content */
.t-sender   /* Sans-serif bold for sender names */
.t-subject  /* Sans-serif medium for subjects */
.t-meta     /* Small sans-serif for metadata */
.t-address  /* Monospace for email handles */
.t-label    /* Uppercase labels with letter-spacing */
```

---

## Spacing

Consistent spacing scale based on 0.25rem (4px) increments:

```css
--space-1:  0.25rem   /* 4px  - Tight spacing */
--space-2:  0.5rem    /* 8px  - Component padding */
--space-3:  0.75rem   /* 12px - Default gap */
--space-4:  1rem      /* 16px - Standard padding */
--space-5:  1.25rem   /* 20px - Section spacing */
--space-6:  1.5rem    /* 24px - Large gaps */
--space-8:  2rem      /* 32px - Major sections */
--space-10: 2.5rem    /* 40px - Page margins */
--space-12: 3rem      /* 48px - Large separations */
```

**Usage Guidelines:**
- `--space-2` / `--space-3`: Component internal padding
- `--space-4` / `--space-5`: Card/panel padding
- `--space-6` / `--space-8`: Section separation
- `--space-10` / `--space-12`: Page-level margins

---

## Borders & Shapes

### Border Radii
```css
--radius-sm: 3px   /* Small elements (badges, chips) */
--radius:    5px   /* Standard (buttons, inputs) */
--radius-lg: 8px   /* Large elements (cards, modals) */
```

### Shadows
```css
--shadow-sm: 0 1px 2px rgba(0,0,0,0.06)           /* Subtle elevation */
--shadow:    0 1px 4px rgba(0,0,0,0.10)           /* Standard elevation */
--shadow-md: 0 4px 6px rgba(0,0,0,0.07), ...      /* Medium elevation */
--shadow-lg: 0 10px 15px rgba(0,0,0,0.10), ...    /* High elevation */
--shadow-xl: 0 20px 25px rgba(0,0,0,0.15), ...    /* Maximum elevation */
```

---

## Component Patterns

### Cards
```css
background: var(--color-surface) or var(--envelope-cream)
border: 1px solid var(--color-border) or var(--border)
border-radius: var(--radius-lg)
padding: var(--space-4) to var(--space-6)
box-shadow: var(--shadow-sm) or var(--shadow)
```

### Buttons
Use `@bfs/ui` Button component with variants:
- `default`: Primary actions (--postal-blue)
- `secondary`: Secondary actions
- `danger`: Destructive actions (--wax-red)

### Forms
Use `@bfs/ui` Input, Textarea, Select components with:
- Border: `--color-border` / `--border-strong`
- Focus: `--color-accent` / `--postal-blue` with subtle shadow
- Error: `--color-danger` / `--wax-red` border

### Lists
```css
gap: var(--space-3) or var(--space-4)
background: var(--color-surface)
border-bottom: 1px solid var(--border-faint)
```

---

## Usage Guidelines

### When to Use Base Tokens
- Standard UI components (buttons, inputs, modals)
- Shared layout patterns
- Generic semantic colors (success, danger, warning)

### When to Use Mail Theme
- Message content styling (serif fonts, letter paper)
- Postal-themed UI elements
- Mail-specific color accents
- Typography utilities for message display

### Token Priority
1. Use existing tokens whenever possible
2. For mail-specific needs, use postal theme tokens
3. Only add new tokens if no existing token fits
4. Avoid hardcoded values - use tokens with fallbacks

---

## Component Library Organization

```
lib/components/
├── thread/          # Message thread components
├── compose/         # Composition interface
├── search/          # Search functionality
├── contacts/        # Contact management
├── labels/          # Label management
├── templates/       # Template management
└── shared/          # Generic reusable components
```

All components should:
- Use CSS custom properties (design tokens)
- Be self-contained with scoped styles
- Follow single responsibility principle
- Support light/dark themes via token overrides (future)

---

## Future Enhancements

- [ ] Dark mode token overrides
- [ ] High contrast mode
- [ ] Reduced motion preferences
- [ ] Accessibility audit
- [ ] Print stylesheet
- [ ] Component-specific token documentation
- [ ] Storybook/component gallery

---

## References

- Base Design System: `/packages/ui/src/theme.css`
- Mail Theme: `/apps/mail/src/mail-theme.css`
- Shared Components: `/packages/ui/src/`
- Mail Components: `/apps/mail/src/lib/components/`
