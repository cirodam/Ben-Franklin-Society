# Epistle - Visual Theme & Design System

**App Name:** Epistle  
**Theme:** Refined Postal Correspondence

**Design Philosophy:** Epistle embodies the elegance and trustworthiness of traditional correspondence—handwritten letters, reliable postal service, and the personal connection of receiving mail. The aesthetic draws from refined postal uniforms, quality stationery, classic typography, and postal heritage, creating a professional yet warm communication space.

**Key Refinements:**
- Professional gradient sidebar with depth and shadow
- Spectral serif for elegant branding and message content
- DM Sans for clean, modern UI elements
- Refined postal blue palette (#3d5a80) for sophistication
- Enhanced contrast with richer ink color hierarchy
- Polished compose button with white background and lift effect
- Stronger card borders (2px) with subtle shadows for better separation

---

## Color Palette

### Primary Colors
- **Postal Blue** `#3d5a80` - Primary accent, refined postal service blue
- **Postal Blue Dark** `#2a4263` - Sidebar gradient, depth
- **Postal Blue Mid** `#5b7fa8` - Interactive states, hover effects
- **Postal Blue Light** `#eef3f8` - Subtle backgrounds, hover surfaces

### Text Colors (Rich Ink Tones)
- **Ink Navy** `#1a1f2e` - Primary text, headers
- **Ink Charcoal** `#374151` - Secondary text
- **Ink Slate** `#64748b` - Tertiary text
- **Ink Gray** `#94a3b8` - Metadata, muted text
- **Ink Faint** `#cbd5e1` - Subtle text, disabled states

### Semantic Colors
- **Wax Seal Red** `#be123c` - Urgent, priority mail
- **Wax Seal Light** `#fef2f3` - Urgent backgrounds
- **Stamp Green** `#15803d` - Success, sent status
- **Stamp Green Light** `#f0fdf4` - Success backgrounds

### Surfaces
- **Letter Paper** `#fefdfb` - Main background (warm white)
- **Parchment** `#faf9f7` - Secondary surface
- **Envelope Cream** `#f5f3ef` - Cards, elevated surfaces
- **Airmail Stripe** `#f8fafc` - Alternating rows, subtle dividers

### Borders
- **Border** `#e2e8f0` - Standard borders
- **Border Strong** `#cbd5e1` - Emphasized borders
- **Border Faint** `#f1f5f9` - Subtle dividers

---

## Typography

### Font Families

**Serif (Body & Brand):**
- **Spectral** - Elegant, classical serif with excellent readability
- Use for: Message body, letter content, app branding
- Weights: 400 (regular), 500 (medium), 600 (semibold), 700 (bold)
- Fallback: Georgia, Times New Roman, serif

**Sans-Serif (UI Elements):**
- **DM Sans** - Clean, modern, geometric sans-serif
- Use for: Interface chrome, navigation, labels, metadata
- Weights: 400 (regular), 500 (medium), 600 (semibold), 700 (bold)
- Fallback: Inter, system-ui, sans-serif

**Monospace (Technical):**
- **JetBrains Mono** - Sharp, readable monospace
- Use for: Handles, addresses, technical details
- Weights: 400 (regular), 500 (medium)
- Fallback: Consolas, monospace

### Type Scale & Classes

```css
.t-letter     /* Message body: Spectral, 16px, line-height 1.7, color: ink-navy */
.t-sender     /* Sender name: DM Sans, 14px, weight 600, color: ink-navy */
.t-subject    /* Subject line: DM Sans, 15px, weight 500, color: ink-navy */
.t-meta       /* Timestamps/metadata: DM Sans, 13px, color: ink-gray */
.t-address    /* Handles/addresses: JetBrains Mono, 13px, color: postal-blue */
.t-label      /* UI labels: DM Sans, 12px, weight 600, uppercase, tracking 0.08em */
```

### Brand Typography
- **App Name ("Epistle")**: Spectral, 22px (1.375rem), weight 600, letter-spacing 0.02em
- **Organization Name**: Spectral, 12px, weight 400, letter-spacing 0.03em, opacity 0.75
- **Navigation Links**: DM Sans, 14px, weight 500

---

## Visual Design Principles

### Professionalism & Polish
- Gradient sidebar background (180deg) for depth and sophistication
- Subtle shadows for elevation and hierarchy
- Smooth transitions (0.2s ease) for interactive elements
- Refined spacing and consistent padding

### Postal Heritage
- Envelope-inspired card designs with stronger borders
- Postmark-style timestamps and status indicators
- Classic serif typography for warmth and tradition
- Modern sans-serif for clarity and usability

---

## Visual Motifs

### Envelope Aesthetics
- **Envelope Headers:** Thread list items styled like envelope fronts with sender, subject, preview
- **Borders:** Subtle envelope flap angles on cards (clipped corners)
- **Airmail Stripes:** Optional diagonal red/blue stripes for priority messages
- **Stamp Badges:** Status indicators styled as postal stamps (sent, delivered, draft)

### Postal Elements
- **Postmark Circles:** Date/time stamps in circular postmark style
- **Stamp Perforations:** Dashed borders on badges to evoke stamp edges
- **Postal Blue Accents:** Buttons and links in postal service blue
- **Wax Seal:** Urgent/important indicators as red wax seal badges

### Paper & Texture
- **Letter Paper Background:** Warm off-white (#fffefb) for main surfaces
- **Subtle Grain:** Very light paper texture on message bodies (optional)
- **Folded Corners:** Subtle shadows/folds on cards to suggest paper depth
- **Ink Stains:** Hover effects with slight blue tint (like ink spreading)

---

## Component Patterns

### Thread List
```
┌─────────────────────────────────────────────────┐
│ [Stamp] Jane Smith                    2 hours ago│
│         Re: Community Garden Planning            │
│         Thanks for organizing this! I think...   │
└─────────────────────────────────────────────────┘
```
- Envelope-like cards with sender, subject, preview
- Unread threads: bolder text, postal blue accent line on left
- Hover: Slight lift shadow, postal blue tint on background
- Stamp badges: Small colored squares with status (delivered, sent, draft)

### Message View
```
┌─────────────────────────────────────────────────┐
│ From: jane_smith@bfs          [Postmark: May 20]│
│ To: you@bfs                                      │
│ Subject: Re: Community Garden Planning           │
│ ─────────────────────────────────────────────── │
│                                                  │
│ [Letter-style message body with Literata font]  │
│                                                  │
│ Thanks for organizing this! I think we should   │
│ start with raised beds near the south fence...  │
│                                                  │
└─────────────────────────────────────────────────┘
```
- Clear header with addresses in monospace
- Postmark-style timestamp
- Body in warm serif on letter paper background
- Reply/Forward buttons styled as postal service actions

### Compose Form
```
┌─────────────────────────────────────────────────┐
│ To: [___________________]  [Address Book]        │
│ Subject: [____________________________________]   │
│ ─────────────────────────────────────────────── │
│                                                  │
│ [Letterhead-style compose area]                 │
│                                                  │
│                                 [Send] [Discard] │
└─────────────────────────────────────────────────┘
```
- Clean form with postal blue accents
- Send button: Prominent postal blue
- Address inputs with envelope icon
- Optional letterhead decoration at top

### Status Badges (Stamp Style)
- **Draft:** Gray stamp with dashed border
- **Sent:** Green stamp with checkmark
- **Delivered:** Postal blue stamp with checkmark
- **Urgent:** Red wax seal badge
- **Priority:** Red/blue airmail stripe accent

---

## Layout Structure

### Sidebar Navigation

**Visual Design:**
- Gradient background: `linear-gradient(180deg, #3d5a80 0%, #2a4263 100%)`
- Subtle shadow: `2px 0 8px rgba(0, 0, 0, 0.08)`
- Right border: `1px solid rgba(0, 0, 0, 0.15)`

**Brand Section:**
- Envelope icon (✉) with drop shadow
- App name "Epistle" in Spectral serif, 22px, weight 600
- Organization name in smaller Spectral, 75% opacity
- Bottom border: `1px solid rgba(255, 255, 255, 0.12)`

**Compose Button:**
- Full-width button in navigation section
- Writing icon (✍) prefix
- White background (`rgba(255, 255, 255, 0.95)`)
- Dark blue text (postal-blue-dark)
- Subtle shadow, lift effect on hover
- Font: DM Sans, weight 600

**Navigation Links:**
- DM Sans, 14px, weight 500
- White text (`rgba(255, 255, 255, 0.92)`)
- Hover: 12% white background, left border accent
- Active: 18% white background, solid left border, weight 600
- Badge: White background with dark text, subtle shadow

**Footer:**
- User handle in JetBrains Mono
- Top border: `1px solid rgba(255, 255, 255, 0.12)`
- Muted text color

### Main Content Area
- Letter paper background (#fefdfb)
- Centered content container (max-width: 1000px)
- Thread list: Envelope-style cards with 2px borders
- Message view: Full letter-paper aesthetic with Spectral serif body
- Comfortable padding (var(--space-8)) for reading

### Cards & Envelopes
- Background: Envelope cream (#f5f3ef) or white
- Border: 2px solid, border-strong color (#cbd5e1)
- Default shadow: `0 1px 3px rgba(0, 0, 0, 0.05)`
- Hover shadow: `0 2px 8px rgba(61, 90, 128, 0.12)` with slight lift
- Border radius: Standard (var(--radius))

---

## Interaction Patterns

### Hover States
- Thread items: Lift shadow + postal blue tint on background
- Buttons: Darken postal blue, subtle scale
- Links: Underline with postal blue

### Focus States
- Postal blue outline (2px)
- High contrast for accessibility
- Visible keyboard navigation

### Loading States
- Postal blue spinner or loading bar
- "Sending mail..." with envelope animation
- Skeleton screens with envelope shapes

### Empty States
- Illustration: Empty mailbox or envelope
- "No messages yet" with warm, encouraging copy
- Suggest composing a first message

---

## Accessibility

- **Contrast Ratios:**
  - Postal blue on white: 7.6:1 (AAA)
  - Ink navy on letter paper: 14.8:1 (AAA)
  - Ink gray on white: 6.5:1 (AA large, approaching AAA)

- **Typography:**
  - Minimum 14px for UI text
  - 16px for message bodies
  - Line height 1.7 for readability
  - Clear font weights for hierarchy

- **Interactive Elements:**
  - Minimum 44×44px touch targets
  - Visible focus indicators
  - Keyboard navigation throughout
  - Screen reader labels for icons

- **Color Independence:**
  - Don't rely on color alone (use icons + text)
  - Status badges have text labels
  - Urgent messages have icon + color

---

## Implementation Notes

### CSS Custom Properties
The mail app overrides shared component tokens with postal theme colors:

```css
:root {
  /* Postal theme colors */
  --postal-blue: #2b4c7e;
  --postal-blue-mid: #4a6fa5;
  --postal-blue-light: #e8edf5;
  --ink-navy: #1a2332;
  --ink-gray: #4a5568;
  --ink-faint: #9ca3af;
  --wax-red: #b91c1c;
  --wax-red-light: #fef2f2;
  --stamp-green: #16a34a;
  --stamp-green-light: #f0fdf4;
  --letter-paper: #fffefb;
  --envelope-cream: #faf8f3;
  --airmail-stripe: #f8f9fb;
  
  /* Map to shared tokens */
  --color-accent: var(--postal-blue);
  --color-surface: var(--envelope-cream);
  --color-bg: var(--letter-paper);
  --color-text: var(--ink-navy);
  --color-text-muted: var(--ink-gray);
  --color-success: var(--stamp-green);
  --color-danger: var(--wax-red);
}
```

### Typography Setup
```css
@import url('https://fonts.googleapis.com/css2?family=Literata:wght@400;500;600&family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap');

:root {
  --font-serif: 'Literata', 'Source Serif 4', Georgia, serif;
  --font-sans: 'Inter', 'Public Sans', system-ui, sans-serif;
  --font-mono: 'IBM Plex Mono', Consolas, monospace;
}
```

### Shared Components
Like governance and banking apps, mail uses shared components from `@bfs/ui` and customizes them with theme CSS. Cards, buttons, inputs all respect the postal blue accent and letter paper surfaces.

---

## Visual Inspiration

- **Traditional postal service:** Blue uniforms, reliable, trustworthy
- **Personal correspondence:** Handwritten letters, warmth, care
- **Stamp collecting:** Colorful badges, perforated edges
- **Airmail envelopes:** Red/blue diagonal stripes
- **Wax seals:** Traditional letter sealing, authenticity
- **Postal marks:** Circular date stamps, routing marks
- **Envelope textures:** Paper grain, folded flaps

---

## Differentiation from Other Apps

- **Governance:** Formal, traditional (sage green, gold, IM Fell English) → civic dignity
- **Community Bank:** Warm, trustworthy (copper, olive, Source Serif 4) → financial care
- **Mail:** Personal, reliable (postal blue, ink navy, Literata) → intimate communication

Each app maintains its own character while sharing underlying component architecture and respecting the same human-centered design principles.
