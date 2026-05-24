# Library App Theme Reference

This document outlines the design system for the Library application, creating a dignified and respectful document management experience.

## Design Philosophy

The library app aesthetic is inspired by classical archives and libraries:
- **Serif typography** evokes traditional printed documents
- **Paper and ink** colors create a warm, analog feel
- **Restrained interactions** emphasize content over chrome
- **Hierarchical clarity** guides users through document collections

Think: Dignified digital library, not admin panel.

## Typography

All typography uses classical serif fonts defined in `library-theme.css`.

### Font Families

- **IM Fell English**: Display titles, headings (400 weight only)
- **IM Fell English SC**: Labels, buttons, small caps
- **Libre Baskerville**: Body text, descriptions, document content
- **Inconsolata**: Numeric data, technical values, code

### CSS Classes

- `.t-display` - Page titles, document titles (IM Fell English, 2rem, line-height 1.2)
- `.t-label` - Standard labels (IM Fell English SC, 0.875rem, letter-spacing 0.05em, lowercase)
- `.t-prose` - Body text, descriptions (Libre Baskerville, line-height 1.6)
- `.t-numeric` - File sizes, dates, counts (Inconsolata)

### Type Usage

```html
<!-- Page title -->
<h1 class="t-display">Document Collections</h1>

<!-- Form label -->
<label class="t-label">file name</label>

<!-- Description text -->
<p class="t-prose">This document contains...</p>

<!-- File size -->
<span class="t-numeric">2.4 MB</span>
```

## Colors

### Primary Palette

```css
/* Paper - primary surface */
--paper: #f9f7f4  /* Warm off-white, like aged paper */

/* Ink - text hierarchy */
--ink:        #1a1714  /* Primary text, headings */
--ink-muted:  #4a4541  /* Secondary text, labels */
--ink-subtle: #6a6561  /* Tertiary text, metadata */

/* Accent - interactive elements */
--accent: #5a7a5a  /* Primary actions, focus states */
--gold:   #8b6914  /* Links, highlights, interactive */
--danger: #a23d3d  /* Delete actions, warnings */
```

### Borders

```css
--border:       rgba(26, 23, 20, 0.15)  /* Standard borders, dividers */
--border-heavy: rgba(26, 23, 20, 0.3)   /* Emphasis, strong boundaries */
```

### Background Tints

```css
--tint-gold:  #f5edd7  /* Link hover, subtle highlights */
--tint-green: #e8f0e8  /* Button hover, selected states */
```

### Color Usage

- **--paper**: Main background, card surfaces
- **--ink**: Primary headings, important text
- **--ink-muted**: Labels, secondary information
- **--ink-subtle**: Timestamps, helper text
- **--accent**: Primary buttons, focus rings, active states
- **--gold**: All links, interactive text
- **--border**: Dividers, subtle boundaries
- **--border-heavy**: Input borders, strong structure

## Common Patterns

### Buttons

```css
.btn {
  font-family: var(--font-label);
  font-size: 0.875rem;
  letter-spacing: 0.05em;
  text-transform: lowercase;
  padding: 0.5rem 1rem;
  border: 1px solid var(--border-heavy);
  background: var(--paper);
  color: var(--ink);
}

.btn:hover {
  background: var(--tint-green);
  border-color: var(--accent);
}

.btn--primary {
  background: var(--accent);
  color: var(--paper);
}
```

**Usage:**
- `.btn` - Default actions (Cancel, secondary)
- `.btn--primary` - Primary actions (Upload, Save, Create)
- `.btn--secondary` - Transparent background variant

### Links

```css
a {
  color: var(--gold);
  text-decoration: none;
}

a:hover {
  background: var(--tint-gold);
}
```

All links use gold color with subtle tint on hover. No underlines by default.

### Form Elements

All inputs have consistent styling:

```css
input, textarea, select {
  font-family: var(--font-prose);
  padding: 0.5rem;
  border: 1px solid var(--border-heavy);
  background: var(--paper);
  color: var(--ink);
}

input:focus, textarea:focus, select:focus {
  outline: none;
  border-color: var(--accent);
}

label {
  font-family: var(--font-label);
  font-size: 0.875rem;
  letter-spacing: 0.05em;
  text-transform: lowercase;
  color: var(--ink-muted);
}
```

### Cards/Papers

```css
.paper {
  background: var(--paper);
  border: 1px solid var(--border);
  padding: 1.5rem;
}
```

Use for contained content areas, document previews, modal dialogs.

## Layout Utilities

### Container

```css
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}
```

Standard page container with centered content.

### Stack

```css
.stack {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
```

Vertical spacing for forms, lists, content sections.

### Row

```css
.row {
  display: flex;
  gap: 1rem;
  align-items: center;
}
```

Horizontal layout with consistent spacing.

## Design Tokens

Prefer using the BFS design system spacing scale where possible:
- `--space-1` through `--space-6` for small spacing
- `--space-8` through `--space-12` for large spacing
- **Note**: `--space-7` does not exist in the design system

## Visual Principles

### 1. Respect for Content
- Documents and files are the hero, not the interface
- Generous whitespace around content
- Minimal chrome and decoration

### 2. Classical Hierarchy
- Clear typographic scale (display → body → labels)
- Consistent ink tones (primary → muted → subtle)
- Borders define structure, not decoration

### 3. Gentle Interactions
- Subtle hover states (tints, not dramatic changes)
- Soft transitions (0.2s)
- No aggressive animations or colors

### 4. Functional Elegance
- Icons should be simple and clear (prefer SVG over emoji)
- Actions organized in menus, not scattered inline
- Context emerges on hover/focus, doesn't clutter default view

## Anti-Patterns

❌ **Don't:**
- Use emoji icons (📁, 📄) - breaks formal tone
- Mix inline styles with theme classes
- Create visual clutter with too many inline actions
- Use bright, saturated colors
- Add unnecessary animations

✅ **Do:**
- Use consistent theme tokens
- Keep actions in context menus or toolbars
- Maintain typographic hierarchy
- Let content breathe with whitespace
- Use subtle, dignified interactions
