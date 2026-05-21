# Community Bank Theme Design

**Status**: Proposed  
**Created**: May 20, 2026  
**Purpose**: Define the visual design language for the BFS Community Bank application

---

## Design Philosophy

### Community Banking as Personal Stewardship

**Governance** feels like a library/assembly hall — formal, authoritative, institutional.  
**Community Bank** should feel like a local credit union — warm, trustworthy, personal, grounded.

The design should evoke:
- **Ledgers & receipts** (traditional bookkeeping)
- **Handshake agreements** (personal trust)
- **Local stewardship** (community care)
- **Warm copper/bronze** (valuable but approachable metals, not cold corporate blue)

### Core Principles

1. **No dark patterns** — All fees, balances, states clearly visible
2. **Human language** — "You sent Jane 100 ƒ" not "XFER#1829 PROCESSED"
3. **Clear states** — Frozen accounts clearly marked but not alarming
4. **Confirmations** — Every action has a human-readable receipt
5. **History** — All transactions visible, exportable, understandable

---

## Color Palette

### Primary - Warm Copper/Bronze
Suggests trust, value, and warmth (vs cold corporate blue).

```css
--copper:       #8b5a3c;  /* Primary brand color, links, accents */
--copper-mid:   #a67959;  /* Hover states, interactive elements */
--copper-light: #f4ede8;  /* Subtle backgrounds, highlights */
```

### Text - Warm Blacks and Browns
Natural, readable, grounded.

```css
--ink:       #2a1f1a;  /* Primary text */
--ink-mid:   #4d3d32;  /* Secondary text, labels */
--ink-faint: #897669;  /* Tertiary text, placeholders */
```

### Surfaces - Warm Cream/Ledger Paper
Like traditional accounting ledgers.

```css
--ledger:       #fffcf7;  /* Cards, primary surface */
--ledger-lined: #f9f6f0;  /* Secondary surface, alternating rows */
```

### Accent - Olive Green
Growth, stability, positive movement.

```css
--olive:      #5a6b4a;  /* Success states, positive balances */
--olive-light: #e8ede5; /* Subtle success backgrounds */
```

### Alert States

```css
--alert-red:       #8b3a3a;  /* Overdrawn, frozen accounts */
--alert-red-light: #f7efef;  /* Error backgrounds */
--alert-amber:     #a67c3c;  /* Warnings, pending states */
--alert-amber-light: #f7f3ed; /* Warning backgrounds */
```

### Border Colors

```css
--border-strong: rgba(139, 90, 60, 0.3);  /* Emphasis, focus states */
--border:        rgba(139, 90, 60, 0.2);  /* Standard borders */
--border-subtle: rgba(139, 90, 60, 0.12); /* Dividers */
--border-faint:  rgba(139, 90, 60, 0.06); /* Very subtle dividers */
```

---

## Typography

### Font Selection

**Option A: Humanist Approach** (Recommended)
- **Source Serif 4** — Body text, warm and readable
- **Public Sans** — UI elements, numbers, clear and open

**Option B: Traditional Banking**
- **Crimson Pro** — Serif, traditional but friendly
- **IBM Plex Sans** — UI, professional and warm

### Type Scale

```css
--text-xs:   0.8125rem;  /* 13px - Fine print, timestamps */
--text-sm:   0.875rem;   /* 14px - Labels, metadata */
--text-base: 1rem;       /* 16px - UI controls, buttons */
--text-md:   1.0625rem;  /* 17px - Body text */
--text-lg:   1.125rem;   /* 18px - Emphasis */
--text-xl:   1.375rem;   /* 22px - Section headings */
--text-2xl:  1.75rem;    /* 28px - Page titles */
--text-3xl:  2.5rem;     /* 40px - Balance amounts */
```

### Typography Classes

```css
/* Body text - transactions, descriptions */
.t-body {
  font-family: 'Source Serif 4', Georgia, serif;
  font-weight: 400;
  line-height: 1.6;
}

/* UI elements - buttons, nav, labels */
.t-ui {
  font-family: 'Public Sans', system-ui, sans-serif;
  font-weight: 400;
  letter-spacing: -0.01em;
}

/* Labels - all caps, metadata */
.t-label {
  font-family: 'Public Sans', system-ui, sans-serif;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-size: var(--text-xs);
}

/* Balance amounts - large, clear, tabular */
.t-balance {
  font-family: 'Public Sans', system-ui, sans-serif;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.02em;
}

/* Monospace - account numbers, transaction IDs */
.t-mono {
  font-family: 'IBM Plex Mono', 'Inconsolata', monospace;
  font-weight: 400;
  letter-spacing: -0.01em;
}
```

---

## Visual Motifs

### Receipt/Slip Aesthetic

Transaction cards and confirmations should evoke deposit slips and receipts.

```css
/* Transaction slip card */
.transaction-slip {
  background: var(--ledger);
  border: 1px solid var(--copper);
  border-top: 3px dashed var(--copper-mid); /* perforation line */
  border-radius: 4px;
  padding: var(--space-5);
  position: relative;
}

/* Subtle ledger lines in background */
.transaction-slip::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image: repeating-linear-gradient(
    transparent,
    transparent 1.5rem,
    rgba(139, 90, 60, 0.05) 1.5rem,
    rgba(139, 90, 60, 0.05) calc(1.5rem + 1px)
  );
  pointer-events: none;
  border-radius: inherit;
}

/* Stamped/received badge */
.receipt-stamp {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  background: var(--olive-light);
  color: var(--olive);
  border: 1.5px solid var(--olive);
  border-radius: 2px;
  text-transform: uppercase;
  font-size: var(--text-xs);
  font-weight: 600;
  letter-spacing: 0.1em;
  transform: rotate(-3deg);
}
```

### Ledger Grid Pattern

Subtle grid lines in card backgrounds to evoke traditional accounting ledgers.

```css
.ledger-pattern {
  background-image: 
    repeating-linear-gradient(
      90deg,
      transparent,
      transparent calc(100% - 1px),
      rgba(139, 90, 60, 0.04) calc(100% - 1px),
      rgba(139, 90, 60, 0.04) 100%
    ),
    repeating-linear-gradient(
      0deg,
      transparent,
      transparent 1.5rem,
      rgba(139, 90, 60, 0.04) 1.5rem,
      rgba(139, 90, 60, 0.04) calc(1.5rem + 1px)
    );
}
```

---

## Background Treatment

Warm cream gradient (like aged paper) to create a comfortable, grounded feeling.

```css
html {
  background: linear-gradient(to bottom,
    #f9f3ed 0%,    /* Warm cream */
    #fffcf7 40%,   /* Pure ledger white */
    #fff9f2 100%   /* Slight peachy warmth */
  );
  background-attachment: fixed;
  min-height: 100vh;
}

body {
  background: transparent;
}
```

---

## Component Patterns

### Account Cards

**Design Goals**: Clean, uncluttered, balance as primary focus, warm copper accents.

```css
.account-card {
  background: var(--ledger);
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: var(--space-5);
  transition: border-color 0.2s, box-shadow 0.2s;
}

.account-card:hover {
  border-color: var(--copper);
  box-shadow: 0 2px 8px rgba(139, 90, 60, 0.1);
}

.account-card__name {
  font-family: 'Public Sans', sans-serif;
  font-size: var(--text-xs);
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--ink-mid);
  margin-bottom: var(--space-2);
}

.account-card__balance {
  font-family: 'Public Sans', sans-serif;
  font-size: var(--text-3xl);
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.02em;
  color: var(--ink);
  margin-bottom: var(--space-3);
}

.account-card__balance.negative {
  color: var(--alert-red);
}

.account-card__balance.positive {
  color: var(--olive);
}

/* Frozen account state */
.account-card--frozen {
  border-color: var(--alert-red);
  opacity: 0.85;
  background: var(--alert-red-light);
}

.badge-frozen {
  display: inline-block;
  padding: 0.25rem 0.5rem;
  background: var(--alert-red-light);
  color: var(--alert-red);
  border: 1px solid var(--alert-red);
  border-radius: 3px;
  font-size: var(--text-xs);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}
```

### Transaction History

**Design Goals**: Receipt-style cards, clear in/out indicators, human-readable.

```css
.transaction-item {
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: var(--space-4);
  padding: var(--space-4);
  background: var(--ledger);
  border: 1px solid var(--border-subtle);
  border-radius: 4px;
  align-items: center;
}

.transaction-item + .transaction-item {
  margin-top: var(--space-3);
}

.transaction-date {
  font-family: 'IBM Plex Mono', monospace;
  font-size: var(--text-xs);
  color: var(--ink-faint);
}

.transaction-description {
  font-family: 'Source Serif 4', serif;
  font-size: var(--text-md);
  color: var(--ink);
}

.transaction-amount {
  font-family: 'Public Sans', sans-serif;
  font-size: var(--text-lg);
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.01em;
  text-align: right;
}

.transaction-amount.in {
  color: var(--olive);
}

.transaction-amount.out {
  color: var(--ink);
}

.transaction-amount::before {
  content: '';
  margin-right: 0.25em;
}

.transaction-amount.in::before {
  content: '+';
}

.transaction-amount.out::before {
  content: '−'; /* proper minus sign */
}

/* Memo text - feels like a handwritten note */
.transaction-memo {
  grid-column: 2 / -1;
  font-family: 'Source Serif 4', serif;
  font-size: var(--text-sm);
  font-style: italic;
  color: var(--ink-mid);
  margin-top: var(--space-1);
  padding-left: var(--space-3);
  border-left: 2px solid var(--border-faint);
}
```

### Forms (Send Franks)

**Design Goals**: Warm, approachable, clear validation, receipt-style confirmations.

```css
.form-card {
  background: var(--ledger);
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: var(--space-6);
}

.form-field {
  margin-bottom: var(--space-4);
}

.form-label {
  display: block;
  font-family: 'Public Sans', sans-serif;
  font-size: var(--text-sm);
  font-weight: 500;
  color: var(--ink-mid);
  margin-bottom: var(--space-2);
}

.form-input {
  width: 100%;
  padding: var(--space-3);
  font-family: 'Public Sans', sans-serif;
  font-size: var(--text-base);
  color: var(--ink);
  background: var(--ledger);
  border: 1.5px solid var(--border);
  border-radius: 4px;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.form-input:focus {
  outline: none;
  border-color: var(--copper);
  box-shadow: 0 0 0 3px rgba(139, 90, 60, 0.1);
}

.form-input--error {
  border-color: var(--alert-red);
}

.form-input--error:focus {
  box-shadow: 0 0 0 3px rgba(139, 58, 58, 0.1);
}

/* Success confirmation - receipt style */
.success-receipt {
  background: var(--olive-light);
  border: 2px solid var(--olive);
  border-top: 4px dashed var(--olive);
  border-radius: 6px;
  padding: var(--space-6);
  position: relative;
}

.success-receipt__stamp {
  position: absolute;
  top: var(--space-4);
  right: var(--space-4);
  padding: 0.5rem 1rem;
  background: var(--olive);
  color: white;
  border-radius: 3px;
  text-transform: uppercase;
  font-size: var(--text-xs);
  font-weight: 700;
  letter-spacing: 0.12em;
  transform: rotate(-5deg);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.success-receipt__title {
  font-family: 'Public Sans', sans-serif;
  font-size: var(--text-xl);
  font-weight: 600;
  color: var(--olive);
  margin-bottom: var(--space-4);
}

.success-receipt__detail {
  font-family: 'Source Serif 4', serif;
  font-size: var(--text-md);
  color: var(--ink);
  line-height: 1.8;
}
```

### Buttons

```css
.btn-primary {
  font-family: 'Public Sans', sans-serif;
  font-size: var(--text-base);
  font-weight: 500;
  padding: var(--space-3) var(--space-5);
  background: var(--copper);
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.2s, transform 0.1s;
}

.btn-primary:hover {
  background: var(--copper-mid);
  transform: translateY(-1px);
}

.btn-primary:active {
  transform: translateY(0);
}

.btn-secondary {
  font-family: 'Public Sans', sans-serif;
  font-size: var(--text-base);
  font-weight: 500;
  padding: var(--space-3) var(--space-5);
  background: transparent;
  color: var(--copper);
  border: 1.5px solid var(--copper);
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.2s, color 0.2s;
}

.btn-secondary:hover {
  background: var(--copper-light);
}

.btn-text {
  font-family: 'Public Sans', sans-serif;
  font-size: var(--text-sm);
  font-weight: 500;
  color: var(--copper);
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  text-decoration: none;
}

.btn-text:hover {
  text-decoration: underline;
}
```

---

## Key Differences from Governance

| Aspect | Governance App | Community Bank |
|--------|---------------|----------------|
| **Feeling** | Formal library/assembly hall | Warm local credit union |
| **Color Temp** | Cool (sage green) | Warm (copper/cream) |
| **Primary Color** | Sage green (#2d5a4f) | Copper (#8b5a3c) |
| **Accent Color** | Gold (#7a5c1a) | Olive green (#5a6b4a) |
| **Typography** | Classical serif (IM Fell English) | Humanist serif/sans (Source Serif 4, Public Sans) |
| **Surfaces** | Parchment/sage gradient | Cream/ledger paper |
| **Visual Motifs** | Document headers, seals, rules | Receipts, slips, ledger lines |
| **Authority Source** | Institutional tradition | Personal stewardship |
| **Interaction Tone** | Deliberative, formal | Conversational, personal |

---

## Implementation Plan

### Phase 1: Foundation
1. Create `community-bank-theme.css`
2. Import fonts (Source Serif 4, Public Sans)
3. Define CSS custom properties
4. Set up background gradient
5. Import in `+layout.svelte`

### Phase 2: Core Components
1. Update account cards (homepage)
2. Update transaction history
3. Update send/transfer form
4. Add receipt-style confirmations

### Phase 3: Admin & Teller
1. Update teller lookup interface
2. Update admin dashboard
3. Update account management pages
4. Add ledger-style tables

### Phase 4: Refinement
1. Test with real transaction data
2. Verify accessibility (contrast ratios)
3. Ensure all states are clear (frozen, overdrawn, pending)
4. Gather feedback from users
5. Iterate on warmth vs clarity balance

---

## Accessibility Notes

- All color contrasts must meet WCAG AA standards (4.5:1 for normal text)
- Account states must not rely on color alone (use icons, text labels)
- Focus states must be clearly visible
- Font sizes must be readable (minimum 14px for body text)
- Interactive elements must have clear affordances

---

## Open Questions

1. Should we use custom receipt paper texture or keep it clean?
2. Do we want animated transitions for balance changes?
3. Should transaction confirmations be dismissable or redirect automatically?
4. How do we handle very long transaction histories (pagination vs infinite scroll)?
5. Should we add a "print receipt" feature for confirmations?

---

## References

- Governance theme: `/apps/governance/src/governance-theme.css`
- Base UI system: `/packages/ui/src/theme.css`
- Banking UX research: Local credit union patterns, historical banking aesthetics
