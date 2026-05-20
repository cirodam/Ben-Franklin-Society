# Governance App Design Philosophy

## Purpose

This document describes the visual aesthetic and philosophical foundation of the Governance app interface. The design decisions are intentional and value-driven: this software is built to maximize human flourishing, not to extract attention or stoke outrage.

---

## Core Values

### Software for Flourishing, Not Extraction

Modern social media and many contemporary applications are designed around engagement metrics — maximizing time-on-site, notification clicks, and emotional reactions. They exploit cognitive vulnerabilities: infinite scroll, algorithmic rage, variable reward schedules, and artificial urgency.

The Governance app rejects this paradigm entirely.

This software serves real institutions doing real work. Members come here to:
- Read and deliberate on motions and governing documents
- Participate meaningfully in democratic processes
- Coordinate committee work and community governance
- Archive institutional knowledge

The interface should be **calm, dignified, and purposeful**. It should support focused reading and deliberation. It should feel like a tool for serious work, not a feed competing for attention.

### Institutional Dignity

The Ben Franklin Society's governance software represents the society's formal institutions — the General Assembly, colleges, committees, the library of governing documents. These are weight-bearing structures. The interface should convey that gravity.

The aesthetic draws from:
- **Academic and legislative institutions** — libraries, archives, legislative chambers
- **Classical typography** — serif fonts designed for extended reading, not brand differentiation
- **Paper documents** — the texture and afforded permanence of printed materials
- **Restraint and formality** — small caps for labels, understated interactions, no attention-grabbing flourishes

---

## Visual Language

### Typography

The app uses three typefaces, each with a specific purpose:

**IM Fell English** — Formal document titles, charter headings, article names
- Classical serif designed by Igino Marini based on 17th-century type
- Used for the most formal content: the Charter, Constitution, major motions
- Large display sizes, generous line-height
- Communicates permanence and institutional authority

**Libre Baskerville** — Body text, readable prose, document content
- Modern revival of classical book typography
- Excellent for extended reading at standard sizes
- Used for motion provisions, discussion posts, all prose content
- Prioritizes clarity and reader comfort over stylistic novelty

**IM Fell English SC (Small Caps)** — Labels, buttons, navigation, metadata
- Small-caps variant of IM Fell English
- Letter-spaced and lowercased for a classical institutional feel
- Used for form labels, button text, section headings, metadata display
- Provides visual hierarchy without shouting

**Why these choices?**

Modern sans-serif UI fonts prioritize brand recognition and screen optimization. Serif fonts designed for books prioritize **reading comfort and comprehension**. By using classical book typography, the interface signals: this is a place for reading, thinking, and deliberation.

The three-tier hierarchy — display / body / label — is clear and consistent. Users never wonder what level of content they're reading.

### Color Palette

The governance app uses an institutional green and gold palette inspired by libraries, legislative chambers, and archival institutions.

**Greens (Primary institutional color)**
- `--accent: #2d5a4f` — Deep sage green for primary actions, active states
- `--accent-mid: #4a8070` — Mid-tone for hover states
- `--accent-lt: #e8f0ee` — Light tint for backgrounds

**Ink (Text hierarchy)**
- `--ink: #151c1a` — Primary text, very dark green-black
- `--ink-mid: #374340` — Secondary text, labels
- `--ink-faint: #7a8c89` — Tertiary text, placeholders

**Gold (Interactive elements)**
- `--gold: #7a5c1a` — Links, accents, interactive hints
- `--gold-hover: #d4a24a` — Hover states for gold elements

**Paper (Surfaces)**
- `--paper: #fafaf7` — Warm off-white for document backgrounds
- `--surface-dk: #f2f2ef` — Slightly darker for secondary surfaces

**Background**
- Subtle sage gradient reminiscent of old institutional walls
- Fixed attachment so content scrolls against a stable backdrop

**Why these choices?**

The color palette is **restrained and purposeful**. There are no bright primary colors competing for attention. Everything is in the green-gold-ink family. 

The effect is cohesion and calm. The interface never shouts. Interactive elements are distinguished by position and typography, not by bright color alone. The greens evoke institutional spaces — reading rooms, chambers, archives — while the warm paper tones make extended reading comfortable.

### Borders and Shapes

- **No rounded corners** on major UI elements (modals, cards, documents)
- Sharp corners evoke paper documents and formal institutional materials
- Borders use standardized opacity from the institutional green: `--border`, `--border-subtle`, `--border-faint`
- Minimal use of shadows except for major elevation (document sheets, elevated modals)

### Interaction Design

- **Transitions are subtle and smooth** (0.2s) — no jarring snapping or attention-grabbing animation
- **Hover states use background tints** — `--tint-gold` or `--tint-green` — rather than bold color shifts
- **Buttons use small-caps typography** and modest padding, feeling dignified rather than "call-to-action"
- **No notification badges, red dots, or urgency indicators** — if something requires attention, it appears in your feed or inbox naturally
- **Forms are calm and clearly labeled** — generous spacing, serif input text, small-caps labels

---

## Design Patterns That We Reject

### Infinite Scroll
Documents have clear beginnings and endings. Lists have pagination. Users can finish reading and leave, rather than being pulled deeper into an endless feed.

### Algorithmic Feeds
Content is presented chronologically or by explicit user navigation. There is no algorithm trying to maximize engagement by surfacing emotionally provocative content.

### Notification Spam
The app does not bombard users with notifications. If you need to check something, you navigate there intentionally. Real-time updates appear in context (e.g., during a live vote session), not as interruptions.

### Dark Patterns
- No hidden defaults that benefit the platform over the user
- No confusing multi-step opt-outs
- No artificial urgency ("Only 2 spots left!" "This offer expires soon!")
- No pre-checked consent boxes

### Gamification
No points, no badges, no streaks, no leaderboards. Participation in governance is meaningful work, not a game. Recognition happens through real roles, real responsibilities, and real deliberation.

### Attention Traps
- No auto-playing media
- No modal interruptions demanding interaction before proceeding
- No content teasers designed to provoke curiosity clicks
- No "you might also like" rabbit holes

---

## Implementation Guidelines

When building new features or components for the Governance app, ask:

1. **Does this support the user's actual task, or is it optimizing for engagement?**
   - If it's not helping members govern effectively, it shouldn't be in the interface.

2. **Does this feel calm and purposeful?**
   - If an interaction feels urgent or attention-grabbing, it's probably wrong for this app.

3. **Is the typography appropriate for the content?**
   - Display (IM Fell English) for major titles
   - Body (Libre Baskerville) for readable prose
   - Labels (IM Fell English SC) for metadata and controls

4. **Are the colors institutional and restrained?**
   - Use the established green/gold/ink palette
   - Avoid introducing bright accent colors for "fun" or "energy"

5. **Does this respect the user's time and attention?**
   - Can they complete the task and leave?
   - Or does it try to keep them engaged beyond their purpose?

---

## Historical Context

The design is inspired by physical artifacts and spaces that have served deliberative institutions well for centuries:

- **Printed constitutions and charters** — formal documents on quality paper, set in classical book type
- **Legislative chambers** — wood paneling, green baize, gold accents, natural light
- **Library reading rooms** — quiet, warm lighting, serif typography, comfortable furniture
- **Archival materials** — the permanence and care of institutional records

These spaces and artifacts were designed **before the attention economy**. They assume the user has a purpose and wants to accomplish it efficiently and comfortably. That is the standard we aim for.

---

## Conclusion

The Governance app's aesthetic is not arbitrary or merely stylistic. It embodies a fundamental value judgment: **software should serve human flourishing, not extract value from human attention**.

By choosing calm colors, readable typography, restrained interactions, and purposeful layouts, we create an environment where members can do the real work of self-governance — reading, deliberating, coordinating, and deciding — without being manipulated, distracted, or drained.

This is software for institutions that matter, doing work that matters.
