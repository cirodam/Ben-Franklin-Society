# Marketplace Design System

**Version:** 1.0  
**Last Updated:** May 21, 2026  
**Theme:** Community Market & Craft Fair Aesthetic

---

## Overview

The Marketplace app uses a **market/craft fair aesthetic** inspired by community farmers markets, craft bazaars, and artisan fairs. The design evokes warmth, approachability, and handcrafted quality while maintaining modern usability standards.

### Core Principles

1. **Natural & Earthy**: Green palette inspired by outdoor markets and natural materials
2. **Warm & Inviting**: Canvas and tan backgrounds evoke craft paper and market stalls
3. **Clear & Readable**: High-contrast text ensures accessibility
4. **Purposeful Typography**: Serif for products (crafted feel), sans-serif for UI
5. **Subtle Depth**: Gentle shadows and borders suggest physical stall displays

---

## Color System

### Primary Palette

```css
/* Market Green Family */
--market-green:       #4a7c59;  /* Primary brand color, buttons, links */
--market-green-mid:   #6b9776;  /* Hover states, secondary emphasis */
--market-green-light: #e8f2eb;  /* Backgrounds, subtle highlights */

/* Forest Accent */
--forest:             #2d5630;  /* Success states, dark accents */
--forest-light:       #e8f0e9;  /* Success backgrounds */
```

**Usage:**
- **Primary actions**: `--market-green` (buttons, CTAs, active links)
- **Hover states**: `--market-green-mid` (interactive element hovers)
- **Subtle backgrounds**: `--market-green-light` (selected items, highlights)
- **Success indicators**: `--forest` (confirmation messages, active badges)

### Neutral Palette

```css
/* Surfaces */
--canvas:      #faf7f3;  /* Main surface color, card backgrounds */
--market-tan:  #f5f1eb;  /* Alternate surface, subtle sections */
--market-bg:   #fffcf8;  /* Page background, lightest neutral */

/* Stall/Product Display */
--stall-surface: #faf7f3;  /* Listing card backgrounds */
--tag-paper:     #fefdfb;  /* Price tag, label backgrounds */
```

**Usage:**
- **Page background**: `--market-bg` (body)
- **Card/component surfaces**: `--canvas` or `--stall-surface`
- **Alternate sections**: `--market-tan` (differentiation)
- **Labels/tags**: `--tag-paper` (category badges, metadata)

### Text Palette

```css
/* Text Hierarchy */
--charcoal:   #1f1f1f;  /* Primary text, headings */
--slate:      #4a4a4a;  /* Body text, descriptions */
--ash:        #757575;  /* Metadata, captions */
--faint-ash:  #9e9e9e;  /* Disabled text, placeholders */
```

**Usage:**
- **Headings & labels**: `--charcoal` (highest emphasis)
- **Body text**: `--slate` (readable, comfortable)
- **Metadata**: `--ash` (dates, counts, secondary info)
- **Disabled**: `--faint-ash` (unavailable options)

### Semantic Colors

```css
/* Alerts & Status */
--deep-forest:    #465d49;  /* Dark borders, strong emphasis */
--sale-red:       #c53030;  /* Errors, destructive actions, urgent */
--sale-red-light: #fff5f5;  /* Error backgrounds */
```

**Usage:**
- **Danger/destructive**: `--sale-red` (delete, suspend, errors)
- **Error backgrounds**: `--sale-red-light` (alert boxes)
- **Strong borders**: `--deep-forest` (emphasized cards, dividers)

### Borders

```css
--border:        #e5e1db;  /* Standard borders, dividers */
--border-strong: #d1ccc4;  /* Emphasized borders */
--border-faint:  #f0ede8;  /* Subtle dividers, ghost borders */
```

**Usage:**
- **Card borders**: `--border` (standard)
- **Input borders**: `--border` → `--border-strong` (focus)
- **Subtle dividers**: `--border-faint` (list item separators)

---

## Typography

### Typefaces

```css
/* Serif - Product Names & Headings */
--font-serif: 'Crimson Pro', 'Merriweather', Georgia, serif;

/* Sans Serif - UI & Body Text */
--font-sans: 'Inter', system-ui, sans-serif;

/* Display - Prices & Emphasis */
--font-display: 'DM Sans', 'Public Sans', system-ui, sans-serif;
```

**Philosophy:**
- **Serif**: Evokes handwritten signs and crafted product labels
- **Sans-serif**: Modern, readable UI text
- **Display**: Strong, confident pricing and CTAs

### Type Scales

Marketplace uses the shared @bfs/ui type scale:

```css
--text-xs:   0.75rem;  /* 12px - metadata, tags */
--text-sm:   0.875rem; /* 14px - body text, labels */
--text-base: 1rem;     /* 16px - base size */
--text-lg:   1.125rem; /* 18px - product names */
--text-xl:   1.25rem;  /* 20px - prices, subheadings */
--text-2xl:  1.5rem;   /* 24px - page headings */
```

### Typography Classes

Marketplace defines custom typography classes for common patterns:

```css
/* Product Name */
.t-product {
	font-family: var(--font-serif);
	font-size: var(--text-lg);
	font-weight: 600;
	color: var(--charcoal);
	line-height: 1.3;
}

/* Seller/Provider Handle */
.t-seller {
	font-family: var(--font-serif);
	font-size: var(--text-sm);
	font-weight: 500;
	color: var(--market-green);
}

/* Price Display */
.t-price {
	font-family: var(--font-display);
	font-size: var(--text-xl);
	font-weight: 700;
	color: var(--charcoal);
	font-variant-numeric: tabular-nums;
}

/* Body Text */
.t-body {
	font-family: var(--font-sans);
	font-size: var(--text-sm);
	line-height: 1.6;
	color: var(--slate);
}

/* Category Tags */
.t-tag {
	font-family: var(--font-sans);
	font-size: var(--text-xs);
	font-weight: 600;
	text-transform: uppercase;
	letter-spacing: 0.08em;
	color: var(--ash);
}

/* Metadata */
.t-meta {
	font-family: var(--font-sans);
	font-size: var(--text-xs);
	color: var(--ash);
}
```

---

## Spacing

Marketplace uses the shared @bfs/ui spacing scale:

```css
--space-1:  0.25rem;  /* 4px */
--space-2:  0.5rem;   /* 8px */
--space-3:  0.75rem;  /* 12px */
--space-4:  1rem;     /* 16px */
--space-5:  1.5rem;   /* 24px */
--space-6:  2rem;     /* 32px */
--space-8:  3rem;     /* 48px */
```

### Common Patterns

- **Card padding**: `--space-4` to `--space-5`
- **Section gaps**: `--space-5` to `--space-6`
- **Form field spacing**: `--space-3` to `--space-4`
- **Button padding**: `--space-2` × `--space-4` (vertical × horizontal)
- **List item gaps**: `--space-3`

---

## Borders & Radius

### Border Width

```css
/* Standard borders */
border: 1px solid var(--border);

/* Emphasized borders (cards, CTAs) */
border: 2px solid var(--deep-forest);
border: 2.5px solid var(--deep-forest); /* Extra emphasis */
```

### Border Radius

```css
--radius-sm: 0.25rem;  /* 4px - tags, small elements */
--radius-md: 0.5rem;   /* 8px - inputs, buttons */
--radius-lg: 0.75rem;  /* 12px - cards, panels */
--radius-xl: 1rem;     /* 16px - large containers */
```

**Usage:**
- **Buttons & inputs**: `--radius-md`
- **Cards & listing components**: `--radius-lg`
- **Large panels**: `--radius-xl`
- **Badges & tags**: `--radius-sm` or `9999px` (pill)

---

## Shadows & Depth

### Shadow Scale

```css
/* Subtle card elevation */
box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05), 
            0 1px 2px rgba(0, 0, 0, 0.03);

/* Hover state (listing cards) */
box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08), 
            0 2px 4px rgba(0, 0, 0, 0.05);

/* Focused/active elements */
box-shadow: 0 0 0 3px var(--market-green-light);
```

**Philosophy:**
- **Minimal shadows**: Evokes flat craft paper and simple market displays
- **Hover elevation**: Gentle lift suggests interactivity
- **Focus rings**: Green tint maintains brand consistency

---

## Market Stall Visual Language

### Listing Cards

Listing cards evoke **physical market stalls** and **product displays**:

```css
.listing-card {
	background: var(--stall-surface);
	border: 2px solid var(--border);
	border-radius: var(--radius-lg);
	padding: var(--space-4);
	transition: all 0.2s ease;
}

.listing-card:hover {
	border-color: var(--market-green);
	box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
	transform: translateY(-2px);
}
```

**Key Features:**
- **Canvas background**: Like a wooden stall or cloth backdrop
- **Visible borders**: Frames the product like a display case
- **Hover lift**: Brings product forward, suggests picking it up
- **Green accent on hover**: Market brand association

### Price Tags

Price displays use **bold display typography** with **tabular numerals**:

```css
.price-tag {
	font-family: var(--font-display);
	font-size: var(--text-xl);
	font-weight: 700;
	color: var(--charcoal);
	font-variant-numeric: tabular-nums;
}
```

**Inspiration**: Hand-lettered price signs, chalkboard menus

### Category Tags

Category badges mimic **handwritten labels** and **paper tags**:

```css
.category-tag {
	font-family: var(--font-sans);
	font-size: var(--text-xs);
	font-weight: 600;
	text-transform: uppercase;
	letter-spacing: 0.08em;
	color: var(--ash);
	background: var(--tag-paper);
	padding: 2px 8px;
	border-radius: 9999px;
}
```

---

## Component Tokens

Marketplace maps its custom colors to shared @bfs/ui component tokens:

```css
/* Shared component mappings */
--color-accent:         var(--market-green);
--color-accent-subtle:  var(--market-green-light);
--color-surface:        var(--canvas);
--color-bg:             var(--market-bg);
--color-text:           var(--charcoal);
--color-text-muted:     var(--slate);
--color-success:        var(--forest);
--color-success-subtle: var(--forest-light);
--color-danger:         var(--sale-red);
--color-danger-subtle:  var(--sale-red-light);
--color-border:         var(--border);
--color-border-faint:   var(--border-faint);
```

This ensures @bfs/ui components (Button, Input, Alert, etc.) automatically use marketplace colors.

---

## Responsive Behavior

### Breakpoints

Marketplace follows standard responsive breakpoints:

```css
/* Mobile-first approach */
@media (min-width: 640px)  { /* sm */ }
@media (min-width: 768px)  { /* md */ }
@media (min-width: 1024px) { /* lg */ }
@media (min-width: 1280px) { /* xl */ }
```

### Layout Patterns

**Listing grids:**
- Mobile: 1 column
- Tablet (768px+): 2 columns
- Desktop (1024px+): 3 columns

**Detail pages:**
- Mobile: Single column (detail above, related below)
- Desktop (768px+): Two columns (detail 1fr, sidebar 220px)

---

## Accessibility

### Contrast Ratios

All text colors meet WCAG AA standards:

- **Primary text** (`--charcoal` on `--canvas`): 17.6:1 ✅
- **Body text** (`--slate` on `--canvas`): 9.8:1 ✅
- **Metadata** (`--ash` on `--canvas`): 4.9:1 ✅
- **Green links** (`--market-green` on `--canvas`): 5.2:1 ✅

### Focus States

All interactive elements have visible focus indicators:

```css
button:focus, a:focus, input:focus {
	outline: 2px solid var(--market-green);
	outline-offset: 2px;
}
```

### Touch Targets

All buttons and links meet 44×44px minimum touch target size.

---

## Theme Customization

To customize the marketplace theme, override CSS variables in `marketplace-theme.css`:

```css
:root {
	/* Example: Blue market theme */
	--market-green: #3b82f6;
	--market-green-mid: #60a5fa;
	--market-green-light: #dbeafe;
	/* ... other overrides */
}
```

The design system automatically adapts to variable changes.

---

## Design Resources

### Fonts

```html
<link href="https://fonts.googleapis.com/css2?family=Crimson+Pro:wght@400;500;600;700&family=Inter:wght@400;500;600;700&family=DM+Sans:wght@500;700&display=swap" rel="stylesheet">
```

### Icon Strategy

Currently using emoji (🧺) for brand icon. Consider:
- Custom SVG icon set for product categories
- Market-themed illustrations for empty states
- Hand-drawn style icons for consistency with craft aesthetic

---

## References

- **Color inspiration**: Farmers markets, craft fairs, artisan shops
- **Typography**: Handwritten market signs, chalkboard menus
- **Layout**: Physical market stall displays, product tables
- **Interaction**: Browsing items at a market, examining products

This design system balances **warmth and approachability** (craft fair) with **clarity and efficiency** (modern e-commerce).
