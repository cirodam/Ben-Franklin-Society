# Website Theme Reference

This document outlines the design system for the public-facing BFS Website, creating a welcoming and informative first impression.

## Design Philosophy

The website aesthetic embodies the Ben Franklin Society's values and mission:
- **Dignified simplicity** - Clean, classical design conveys credibility and permanence
- **Accessible information** - Clear hierarchy and readable typography welcome all visitors
- **Institutional authority** - Traditional serif fonts signal seriousness and scholarship
- **Inviting clarity** - Bright, open layouts encourage exploration and inquiry

Think: Public library entrance or university homepage—approachable yet authoritative.

## Typography

All typography uses classical serif fonts consistent with BFS institutional identity.

### Font Families

- **IM Fell English**: Display titles, page headings (600 weight)
- **IM Fell English SC**: Labels, navigation links, section markers
- **Libre Baskerville**: Body text, descriptions, informational content
- **Courier New**: Technical information, code examples, data

### CSS Custom Properties

```css
--font-display: 'IM Fell English', serif
--font-prose: 'Libre Baskerville', Georgia, serif
```

### Type Scale

```css
h1: 2.5rem (40px)  /* Hero titles, main headings */
h2: 2rem (32px)    /* Section headings */
h3: 1.5rem (24px)  /* Subsection headings */
body: 1rem (16px)  /* Standard body text */
```

### Type Usage

```html
<!-- Hero heading -->
<h1>Welcome to the Ben Franklin Society</h1>

<!-- Section heading -->
<h2>Our Mission</h2>

<!-- Body content -->
<p>The Ben Franklin Society is dedicated to fostering civic virtue...</p>

<!-- Technical detail -->
<code>https://bfs.example.org</code>
```

## Colors

### Primary Palette

```css
--color-bg: #ffffff        /* Clean white background */
--color-text: #1a1a1a      /* Primary text (near-black) */
--color-primary: #2563eb   /* Vibrant blue for CTAs and links */
--color-secondary: #64748b /* Secondary elements (slate) */
--color-border: #e5e7eb    /* Subtle borders and dividers */
```

### Color Philosophy

The website uses **blue** (#2563eb) as the primary accent, distinguishing it from the internal apps' institutional green. This choice:
- **Signals public access** - Blue is welcoming and universally understood for links/actions
- **Conveys trust** - Blue evokes stability, reliability, and professionalism
- **Stands apart** - Differentiates the public website from member-facing applications
- **Maintains clarity** - High contrast against white backgrounds ensures readability

### Color Usage

- **Vibrant Blue (#2563eb)** - Primary links, call-to-action buttons, interactive elements
- **Near-Black (#1a1a1a)** - Body text, headings, primary content
- **Slate Gray (#64748b)** - Secondary information, metadata, muted elements
- **Light Gray (#e5e7eb)** - Subtle borders, dividers, section separators

## Components

### Links

```css
a {
  color: var(--color-primary);
  text-decoration: none;
}

a:hover {
  text-decoration: underline;
}
```

### Code Snippets

```css
code {
  font-family: 'Courier New', Courier, monospace;
  background: #f3f4f6;
  padding: 0.125rem 0.25rem;
  border-radius: 3px;
  font-size: 0.9em;
}
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

Maximum width of 1200px ensures comfortable reading line lengths and maintains focus on content.

### Responsive Breakpoints

```css
@media (max-width: 768px) {
  h1 { font-size: 2rem; }
  h2 { font-size: 1.5rem; }
  .container { padding: 0 1rem; }
}
```

## Text Elements

### Headings

All headings use **IM Fell English** with 600 weight, creating a dignified, classical appearance:

```css
h1, h2, h3, h4, h5, h6 {
  font-family: var(--font-display);
  line-height: 1.2;
  font-weight: 600;
  margin-bottom: 1rem;
}
```

### Body Text

Body copy uses **Libre Baskerville** with generous line height for comfortable reading:

```css
body {
  font-family: var(--font-prose);
  line-height: 1.6;
  color: var(--color-text);
}
```

### Lists

```css
ul, ol {
  margin-left: 2rem;
  margin-bottom: 1rem;
}

li {
  margin-bottom: 0.5rem;
}
```

### Paragraphs

```css
p {
  margin-bottom: 1rem;
}
```

## Design Principles

### 1. Welcoming Clarity
- Clean white background creates an open, inviting space
- High contrast text ensures excellent readability
- Generous spacing prevents visual crowding

### 2. Institutional Credibility
- Classical serif typography signals permanence and authority
- Consistent styling throughout reinforces professional identity
- Traditional layouts evoke established institutions

### 3. Information Hierarchy
- Clear heading sizes guide visitors through content
- Consistent spacing establishes visual rhythm
- Strategic use of color draws attention to key actions

### 4. Universal Accessibility
- Large, readable font sizes (minimum 16px body)
- Sufficient color contrast (WCAG AA compliant)
- Semantic HTML ensures screen reader compatibility
- Responsive design adapts to all device sizes

## Implementation Notes

### Font Loading

Fonts are loaded via Google Fonts CDN in `app.css`:

```css
@import url('https://fonts.googleapis.com/css2?family=IM+Fell+English&family=IM+Fell+English+SC&family=Libre+Baskerville&display=swap');
```

### CSS Organization

All styling lives in `/src/app.css` with:
- CSS custom properties defined at `:root`
- Global element styles (body, headings, links, lists)
- Utility classes (container)
- Responsive breakpoints

### Minimal Complexity

The website intentionally uses minimal custom CSS:
- No custom components beyond basic elements
- No complex interactive patterns
- No heavy styling frameworks
- Focus on content, not chrome

This simplicity:
- Ensures fast load times for first-time visitors
- Reduces maintenance burden
- Maintains focus on information delivery
- Creates a timeless aesthetic

### Blue vs. Green

While internal BFS applications use institutional green (#2d5a4f), the public website uses blue (#2563eb) to:
- Signal that this is the public-facing entry point
- Create visual distinction from member applications
- Leverage universal understanding of blue for web links
- Maintain high energy and approachability for new visitors

Once users join and access internal apps, they encounter the more formal green institutional palette.

## Navigation

The website features a simple horizontal navigation bar with:
- Clean link styling using primary blue color
- Hover underlines for clear interaction feedback
- Responsive collapse on mobile devices
- Consistent placement across all pages

```html
<header>
  <nav class="container">
    <div class="nav-links">
      <a href="/">Home</a>
      <a href="/faq">FAQ</a>
    </div>
  </nav>
</header>
```

## Future Considerations

As the website grows, consider:
- Adding a hero section with large typography and subtle gradients
- Incorporating testimonials or member quotes with styled blockquotes
- Creating a footer with additional links and contact information
- Developing a visual identity system (logo, icons, illustrations)
- Establishing a content tone guide to match visual formality
