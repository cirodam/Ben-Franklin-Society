# Education App Theme Reference

This document outlines the design system for the Education application, fostering a scholarly and accessible learning environment.

## Design Philosophy

The education app aesthetic evokes classical academia and enlightenment learning:
- **Scholarly clarity** - Clean, readable layouts prioritize content comprehension
- **Academic tradition** - Classical serif typography honors educational heritage
- **Accessible learning** - Minimal visual distractions support focus and retention
- **Dignified simplicity** - Professional appearance without unnecessary ornamentation

Think: University lecture hall meets modern digital learning platform.

## Typography

All typography uses classical serif fonts consistent with BFS institutional style.

### Font Families

- **IM Fell English**: Display titles, course headings (600 weight)
- **IM Fell English SC**: Labels, metadata, badges
- **Libre Baskerville**: Body text, course descriptions, learning content
- **Courier New**: Code snippets, technical content

### CSS Custom Properties

```css
--font-display: 'IM Fell English', serif
--font-prose: 'Libre Baskerville', Georgia, serif
```

### Type Scale

```css
h1: 2.5rem (40px)  /* Page titles */
h2: 2rem (32px)    /* Section headings */
h3: 1.5rem (24px)  /* Subsection headings */
body: 1rem (16px)  /* Standard text */
```

### Usage Examples

```html
<!-- Page title -->
<h1>Introduction to Economics</h1>

<!-- Section heading -->
<h2>Course Overview</h2>

<!-- Body text -->
<p>This course explores fundamental economic principles...</p>
```

## Colors

### Primary Palette

```css
--color-bg: #ffffff        /* Clean white background */
--color-text: #1a1a1a      /* Primary text (near-black) */
--color-primary: #2d5a4f   /* BFS institutional green */
--color-secondary: #64748b /* Secondary elements (slate) */
--color-border: #e5e7eb    /* Subtle borders */
```

### Semantic Colors

```css
--color-success: #10b981   /* Completed lessons, achievements */
--color-warning: #f59e0b   /* In progress, attention needed */
--color-error: #ef4444     /* Failed attempts, errors */
```

### Color Usage

- **Primary Green (#2d5a4f)** - Links, primary buttons, active states, emphasis
- **Slate Gray (#64748b)** - Metadata, secondary information, muted elements
- **Success Green (#10b981)** - Completion badges, successful submissions
- **Warning Amber (#f59e0b)** - In-progress indicators, pending reviews
- **Error Red (#ef4444)** - Failed quizzes, validation errors

## Components

### Buttons

```css
/* Default button */
button {
  font-family: var(--font-prose);
  padding: 0.5rem 1rem;
  border: 1px solid var(--color-border);
  border-radius: 4px;
  background: var(--color-bg);
  transition: all 0.2s;
}

button:hover {
  background: var(--color-primary);
  color: white;
  border-color: var(--color-primary);
}

/* Primary action button */
button.primary {
  background: var(--color-primary);
  color: white;
  border-color: var(--color-primary);
}
```

### Cards

```css
.card {
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 1.5rem;
  background: var(--color-bg);
  margin-bottom: 1rem;
}
```

### Badges

```css
.badge {
  display: inline-block;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.875rem;
  font-weight: 600;
}

.badge.success { background: #d1fae5; color: #065f46; }
.badge.warning { background: #fef3c7; color: #92400e; }
.badge.error { background: #fee2e2; color: #991b1b; }
.badge.info { background: #dbeafe; color: #1e40af; }
```

## Layout

### Container

```css
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
}
```

### Responsive Breakpoints

```css
@media (max-width: 768px) {
  h1 { font-size: 2rem; }
  h2 { font-size: 1.5rem; }
  .container { padding: 0 1rem; }
}
```

## Form Elements

### Inputs & Text Areas

```css
input, textarea, select {
  font-family: var(--font-prose);
  font-size: 1rem;
  padding: 0.5rem;
  border: 1px solid var(--color-border);
  border-radius: 4px;
  width: 100%;
}

input:focus, textarea:focus, select:focus {
  outline: none;
  border-color: var(--color-primary);
}
```

## Design Principles

### 1. Content Clarity
- Ample whitespace around text blocks
- Clear visual hierarchy with consistent heading sizes
- Line height of 1.6 for optimal readability

### 2. Minimal Distraction
- Neutral color palette keeps focus on content
- Subtle borders and shadows (no heavy effects)
- Consistent component styling throughout

### 3. Academic Professionalism
- Classical serif fonts honor educational tradition
- Formal but approachable color choices
- Clean, organized layouts suggest credibility

### 4. Progress Visibility
- Color-coded badges show lesson/course status
- Success/warning/error states clearly distinguished
- Visual feedback for completed work

## Implementation Notes

### Font Loading

Fonts are loaded via Google Fonts CDN in `app.css`:

```css
@import url('https://fonts.googleapis.com/css2?family=IM+Fell+English&family=IM+Fell+English+SC&family=Libre+Baskerville&display=swap');
```

### CSS Organization

All styling lives in `/src/app.css` with:
- CSS custom properties (variables) defined at `:root`
- Global element defaults (body, headings, links)
- Reusable utility classes (container, card, badge)
- Responsive breakpoints

### Accessibility Considerations

- Sufficient color contrast (WCAG AA compliant)
- Focus states clearly visible
- Semantic HTML with proper heading hierarchy
- Font sizes scale appropriately on mobile
