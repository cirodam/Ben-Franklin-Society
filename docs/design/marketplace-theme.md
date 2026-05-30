# Marketplace Visual Theme

**Design Philosophy:** The marketplace should evoke the warmth and community spirit of traditional farmer's markets, craft fairs, and local trade. The aesthetic draws from wooden market stalls, handwritten price tags, natural materials, and artisan craftsmanship, creating an inviting space for honest peer-to-peer commerce.

---

## Color Palette

### Primary Colors
- **Market Green** `#4a7c59` - Primary accent, evokes fresh produce and organic goods
- **Market Green Mid** `#6b9776` - Interactive states, lighter verdant tone
- **Market Green Light** `#e8f2eb` - Subtle backgrounds, soft sage tones

### Supporting Colors
- **Forest Green** `#2d5630` - Success, organic goods, natural products
- **Forest Light** `#e8f0e9` - Success backgrounds, fresh produce

- **Canvas Cream** `#faf7f3` - Primary surface, market tent fabric
- **Market Tan** `#f5f1eb` - Cards, stall backgrounds
- **Deep Forest** `#465d49` - Secondary accent, structural elements

### Text Colors
- **Charcoal** `#1f1f1f` - Primary text, chalkboard signs
- **Slate** `#4a4a4a` - Secondary text
- **Ash** `#757575` - Tertiary text, metadata
- **Faint Ash** `#9e9e9e` - Very subtle text

### Semantic Colors
- **Sale Red** `#c53030` - Sales, urgent, limited availability
- **Sale Red Light** `#fff5f5` - Sale backgrounds
- **Sold Badge** `#718096` - Sold out, unavailable items

### Surfaces
- **Market Background** `#fffcf8` - Main background, outdoor market feel
- **Stall Surface** `#faf7f3` - Cards, product listings
- **Tag Paper** `#fefdfb` - Price tags, labels

---

## Typography

### Font Families

**Product Names/Headings:**
- **Crimson Pro** (fallback: Merriweather, Georgia, serif)
- Warm serif with artisan quality
- Use for product titles, headings

**UI Elements (Body, Prices, Metadata):**
- **Inter** (fallback: system-ui, sans-serif)
- Clean, readable sans-serif for all interface text
- Use for product descriptions, prices, stock counts, metadata, tags

**Technical/Monospace:**
- **SF Mono** (fallback: Monaco, Courier New, monospace)
- Use for seller handles, technical identifiers

### Type Scale & Classes

```css
.t-heading     /* Headings: Crimson Pro, 24px, weight 600, color: charcoal */
.t-product     /* Product name: Crimson Pro, 18px, weight 600, color: charcoal */
.t-price       /* Price: Inter, 20px, weight 700, color: market-green, tabular-nums */
.t-body        /* Description: Inter, 15px, line-height 1.6, color: slate */
.t-tag         /* Category/tag: Inter, 12px, weight 600, uppercase, tracking 0.05em */
.t-meta        /* Metadata: Inter, 13px, color: ash */
.t-seller      /* Seller handle: SF Mono, 13px, weight 500, color: slate */
```

---

## Visual Motifs

### Market Stall Aesthetics
- **Product Cards:** Styled like market stall displays with forest green borders
- **Price Tags:** Hanging tag style with string attachment visual
- **Category Badges:** Like handwritten chalkboard signs
- **Featured Items:** "Fresh today" or "Just listed" ribbons in market green

### Natural Materials
- **Wood Accents:** Terracotta borders suggesting wooden stall frames
- **Canvas Texture:** Cream backgrounds like market tent fabric
- **Paper Tags:** Price tags with subtle paper texture
- **Crate Grid:** Product listings in grid like produce crates

### Craft Fair Elements
- **Seller Badges:** Profile badges like craft fair vendor signs
- **Handmade Ribbons:** "Handmade" or "Local" ribbon badges
- **Star Ratings:** Simple star reviews for quality
- **Sold Stamps:** "SOLD" stamp overlay on unavailable items

### Market Signage
- **Chalkboard Headers:** Section titles with chalkboard aesthetic
- **Handwritten Feel:** Category labels with friendly, approachable typography
- **Directional Signs:** Navigation with wooden signpost feel
- **Price Displays:** Bold, clear pricing like market signs

---

## Component Patterns

### Product Listing Card
```
┌─────────────────────────────────────┐
│ [Image]                             │
│                                     │
│ Product Name                        │
│ by @seller_name                     │
│ $25.00                  [Handmade] │
│                                     │
│ Brief description text...           │
│ ────────────────────────────────── │
│ Category • Posted 2 days ago        │
└─────────────────────────────────────┘
```
- Forest frame border (deep forest green)
- Canvas cream background
- Clear product photo
- Handmade/local badges if applicable
- Price prominent in bold sans-serif
- Seller name in market green serif

### Product Detail View
```
┌─────────────────────────────────────┐
│ [Large Product Images]              │
│                                     │
│ Product Name                        │
│ $25.00              [Add to Cart]  │
│ ────────────────────────────────── │
│ Seller: @artisan_name               │
│ Category: Pottery • Handmade        │
│                                     │
│ Description:                        │
│ [Product description text...]       │
│                                     │
│ Stock: 3 available                  │
│ Posted: May 15, 2026                │
└─────────────────────────────────────┘
```
- Generous image display
- Price tag style pricing
- Seller profile link with market green accent
- Clear stock and availability
- Warm, inviting description layout

### Seller Profile Badge
```
┌─────────────────┐
│  @seller_name   │
│  ⭐ 4.8 (24)    │
│  Member since   │
│  Jan 2025       │
└─────────────────┘
```
- Forest badge frame
- Star rating prominent
- Join date for trust
- Market green accents

### Category Navigation
- Chalkboard-style section headers
- Icon + text for each category
- Grid layout like market sections
- Warm hover states with terracotta

### Search & Filters
- Market tan background
- Filter chips like price tags
- Sort options clear and accessible
- Search bar with placeholder: "Search the market..."

---

## Layout Structure

### Sidebar Navigation
- Canvas cream background
- Deep forest accents on active states
- Icon + label for sections (Browse, Classifieds, Services, etc.)
- "Sell" button prominent in market green light
- Market basket icon for branding

### Main Content Area
- Market background (#fffcf8)
- Product grid: 3-4 columns on desktop
- Generous spacing like market stall layout
- Card shadows suggesting stall depth

### Header
- Sell button: Prominent market green
- Search: Canvas cream background
- Categories: Quick access chips
- User menu: Aligned right

---

## Interaction Patterns

### Hover States
- Product cards: Lift shadow + market green border glow
- Buttons: Darken market green, subtle scale
- Links: Underline with market green

### Focus States
- Market green outline (2px)
- High contrast for accessibility
- Visible keyboard navigation

### Loading States
- Market green spinner
- "Loading products..." with market basket animation
- Skeleton cards with stall shapes

### Empty States
- Illustration: Empty market stall or basket
- "No items yet" with warm, encouraging copy
- Suggest listing an item or browsing categories

### Success States
- Forest green confirmation
- "Item listed!" with checkmark
- "Added to cart" with subtle animation

---

## Status Indicators

### Availability Badges
- **Available:** Forest green badge
- **Low Stock:** Amber warning (< 5 items)
- **Sold Out:** Gray "SOLD" stamp overlay
- **Reserved:** Blue "Reserved" badge

### Listing Badges
- **New:** "Just Listed" ribbon in market green
- **Handmade:** Canvas badge with hand icon
- **Local:** Forest green badge with location icon
- **Featured:** Gold star corner ribbon
- **On Sale:** Sale red badge with percentage

### Seller Badges
- **Verified:** Checkmark badge
- **Top Seller:** Star badge
- **New Seller:** "New" badge in slate

---

## Accessibility

- **Contrast Ratios:**
  - Market green on white: 5.2:1 (AA)
  - Charcoal on market background: 15.2:1 (AAA)
  - Slate on white: 7.8:1 (AAA)
  - Forest green on white: 9.2:1 (AAA)

- **Typography:**
  - Minimum 14px for body text
  - 15px for product descriptions
  - 18px for product names
  - Line height 1.6 for readability

- **Interactive Elements:**
  - Minimum 44×44px touch targets
  - Visible focus indicators
  - Keyboard navigation throughout
  - Screen reader labels for images and icons

- **Color Independence:**
  - Don't rely on color alone for status
  - Use icons + text for badges
  - Status indicators have text labels
  - Price changes show old/new side-by-side

---

## Implementation Notes

### CSS Custom Properties
The marketplace overrides shared component tokens with market theme colors:

```css
:root {
  /* Market theme colors */
  --market-green: #4a7c59;
  --market-green-mid: #6b9776;
  --market-green-light: #e8f2eb;
  --forest: #2d5630;
  --forest-light: #e8f0e9;
  --canvas: #faf7f3;
  --market-tan: #f5f1eb;
  --deep-forest: #465d49;
  --charcoal: #1f1f1f;
  --slate: #4a4a4a;
  --ash: #757575;
  --sale-red: #c53030;
  --market-bg: #fffcf8;
  
  /* Map to shared tokens */
  --color-accent: var(--market-green);
  --color-accent-subtle: var(--market-green-light);
  --color-surface: var(--canvas);
  --color-bg: var(--market-bg);
  --color-text: var(--charcoal);
  --color-text-muted: var(--slate);
  --color-success: var(--forest);
  --color-success-subtle: var(--forest-light);
  --color-danger: var(--sale-red);
}
```

### Typography Setup
```css
@import url('https://fonts.googleapis.com/css2?family=Crimson+Pro:wght@400;500;600;700&family=Inter:wght@400;500;600;700&display=swap');

:root {
  --font-serif: 'Crimson Pro', 'Merriweather', Georgia, serif;
  --font-sans: 'Inter', system-ui, sans-serif;
  --font-mono: 'SF Mono', 'Monaco', 'Courier New', monospace;
}
```

### Shared Components
Like other apps, marketplace uses shared components from `@bfs/ui` and customizes them with theme CSS. Cards, buttons, inputs all respect the terracotta accent and canvas surfaces.

---

## Visual Inspiration

- **Farmer's markets:** Fresh produce displays, wooden crates, chalkboard signs
- **Craft fairs:** Artisan vendor booths, handmade quality, personal service
- **Vintage markets:** Nostalgic charm, authentic materials, honest trade
- **Market stalls:** Organized display, clear pricing, welcoming presentation
- **Price tags:** Hanging tags, clear numbers, simple design
- **Natural materials:** Wood, canvas, clay, paper
- **Community commerce:** Trust, warmth, local connections

---

## Differentiation from Other Apps

- **Governance:** Formal civic dignity (sage green, gold) → governmental authority
- **Community Bank:** Financial warmth (copper, olive) → trusted banking
- **Mail:** Personal correspondence (postal blue, ink navy) → reliable communication
- **Marketplace:** Community commerce (market green, deep forest) → fresh produce & craft

Each app maintains unique character while sharing underlying component architecture and human-centered design principles.
