# Governance App Theme Reference

This document outlines the design system for the Governance application, ensuring visual consistency across all pages and components.

## Typography

All typography uses the classical serif system defined in `governance-theme.css`.

### Font Families

- **IM Fell English**: Display titles, page headings (400 weight only)
- **IM Fell English SC**: All labels, small caps, buttons (lowercase with letter-spacing)
- **Libre Baskerville**: Body text, descriptions, table content
- **Courier New**: Code, credentials, technical values

### CSS Classes

- `.t-display` - Document and page titles (IM Fell English, line-height 1.1)
- `.t-label` - Standard labels (IM Fell English SC, letter-spacing 0.2em)
- `.t-label-loose` - Wide-tracked labels (letter-spacing 0.26em)
- `.t-label-tight` - Buttons, nav links (letter-spacing 0.08em)
- `.t-prose` - Body text (Libre Baskerville, line-height 1.8)
- `.t-numeric` - Financial figures (Inconsolata)

### Type Scale

```css
--text-xs:   13px  /* Fine print, code */
--text-sm:   14px  /* Metadata, small labels */
--text-base: 16px  /* Standard buttons, links */
--text-md:   17px  /* Navigation */
--text-body: 18px  /* Discussion posts */
--text-read: 19px  /* Document prose */
--text-lg:   22px  /* Section headings */
--text-xl:   26px  /* Small titles */
--text-2xl:  32px  /* Large titles */
--text-3xl:  36-48px /* Page titles (responsive) */
--text-4xl:  40-60px /* Document titles (responsive) */
```

## Colors

### Primary Palette

```css
/* Green - institutional colors */
--accent:     #2d5a4f  /* Primary actions, emphasis */
--accent-mid: #4a8070  /* Hover states */
--accent-lt:  #e8f0ee  /* Light backgrounds */

/* Ink - text hierarchy */
--ink:        #151c1a  /* Primary text (h1, h2, body) */
--ink-mid:    #374340  /* Secondary text (labels, metadata) */
--ink-faint:  #7a8c89  /* Tertiary text (placeholders) */

/* Gold - interactive elements */
--gold:       #7a5c1a  /* Links, accents, interactive */
--gold-hover: #d4a24a  /* Hover states */

/* Surfaces */
--paper:      #fafaf7  /* Cards, primary surface */
--surface-dk: #f2f2ef  /* Secondary surface */
```

### Borders

```css
--border-strong:  rgba(45, 90, 79, 0.3)  /* Emphasis, focus states */
--border:         rgba(45, 90, 79, 0.2)  /* Standard borders */
--border-subtle:  rgba(45, 90, 79, 0.15) /* Dividers */
--border-faint:   rgba(45, 90, 79, 0.1)  /* Very subtle */
```

### Background Tints

```css
--tint-gold:      rgba(122, 92, 26, 0.03) /* Hover states */
--tint-gold-mid:  rgba(122, 92, 26, 0.05) /* Credentials, code */
--tint-green:     rgba(45, 90, 79, 0.03)  /* Table headers */
--tint-green-mid: rgba(45, 90, 79, 0.05)  /* Code blocks */
```

## Common Patterns

### Links

```css
a {
  color: var(--gold);
  text-decoration: none;
}

a:hover {
  color: var(--gold-hover);
}
```

### Code Blocks

```css
code {
  font-family: 'Courier New', monospace;
  font-size: var(--text-xs);
  color: var(--ink-mid);
  padding: var(--space-1) var(--space-2);
  background: var(--tint-green-mid);
  border: 1px solid var(--border-subtle);
}
```

### Card Containers

```css
/* Standard card */
.card {
  border: 1px solid var(--border);
  background: var(--paper);
  padding: var(--space-4);
}

/* Card with accent border */
.card-accent {
  border: 1px solid var(--border);
  border-left: 3px solid var(--border-strong);
  background: var(--paper);
}
```

### Form Labels

```css
label {
  font-family: 'IM Fell English SC', serif;
  letter-spacing: 0.1em;
  text-transform: lowercase;
  color: var(--ink-mid);
  font-size: var(--text-xs);
}
```

### Section Headings

```css
/* In cards and sections */
h2 {
  font-family: 'IM Fell English', serif;
  font-size: var(--text-lg);
  font-weight: 400;
  color: var(--ink);
  margin: 0 0 var(--space-3) 0;
}

h3 {
  font-family: 'Libre Baskerville', Georgia, serif;
  font-size: var(--text-base);
  font-weight: 600;
  color: var(--ink);
}
```

## Buttons

Buttons use the `.btn` class with modifiers:

```html
<!-- Standard button -->
<button class="btn">Action</button>

<!-- Primary action -->
<button class="btn btn--primary">Save</button>

<!-- Secondary action -->
<button class="btn btn--secondary">Cancel</button>

<!-- Danger action -->
<button class="btn btn--danger">Delete</button>
```

All buttons:
- Use IM Fell English SC font
- Have no rounded corners (border-radius: 0)
- Use letter-spacing: 0.16em
- Have 1px solid borders

## Tables

Tables should follow this pattern:

```css
/* Table wrapper */
.table-wrap {
  border: 1px solid var(--border);
  background: var(--paper);
}

/* Headers */
th {
  font-family: 'IM Fell English SC', serif;
  font-size: var(--text-xs);
  letter-spacing: 0.1em;
  text-transform: lowercase;
  color: var(--ink-mid);
  background: var(--tint-green);
}

/* Body cells */
td {
  font-family: 'Libre Baskerville', Georgia, serif;
  font-size: var(--text-sm);
  color: var(--ink);
}

/* Row hover */
tr:hover {
  background: var(--tint-gold);
}
```

## Layout Guidelines

### Page Container

```css
.page {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
  max-width: 900px; /* or 1200px for wide content */
  margin: 0 auto;
}
```

### Spacing Scale

Use CSS variables for consistent spacing:

```css
--space-1: 0.25rem  /* 4px */
--space-2: 0.5rem   /* 8px */
--space-3: 0.75rem  /* 12px */
--space-4: 1rem     /* 16px */
--space-5: 1.5rem   /* 24px */
--space-6: 2rem     /* 32px */
--space-8: 3rem     /* 48px */
```

## Design Principles

1. **No rounded corners** - Use straight edges for classical document aesthetic
2. **Small caps for labels** - All UI labels use lowercase with letter-spacing
3. **Subtle borders** - Use standardized rgba values from theme
4. **Minimal decorations** - Let typography and spacing create hierarchy
5. **Consistent hover states** - Use gold tint for interactive feedback
6. **Classical typography** - Prefer serif fonts, proper line-height
7. **Document-like layout** - Pages should feel like formal documents

## Migration Checklist

When styling a new component:

- [ ] Use theme color variables (not hardcoded colors)
- [ ] Apply typography classes or font-family from theme
- [ ] Use spacing variables (not arbitrary rem/px values)
- [ ] Apply border colors from theme variables
- [ ] Use background tints for hover/selected states
- [ ] Remove border-radius (no rounded corners)
- [ ] Ensure labels use small caps style
- [ ] Test that it matches existing pages visually
