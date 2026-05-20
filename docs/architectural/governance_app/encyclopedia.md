# Encyclopedia

## Overview

The Encyclopedia is a knowledge base within the library that provides definitions and explanations of terminology used throughout the Governance app. It serves as a reference for members learning institutional concepts, processes, and specialized vocabulary.

---

## Purpose

Members encounter specialized terminology when reading governing documents, participating in deliberations, and using governance features:

- **Institutional concepts** — sortition, provision, articles, chapters
- **Governance processes** — motion statuses (draft, introduced, deliberation, enacted), voting procedures
- **Organizational structures** — General Assembly, colleges, committees, services
- **Roles and permissions** — what different roles can do
- **Economic terms** — Frank, Community Bank operations

Rather than using tooltips or inline explanations that clutter the interface, encyclopedia entries provide comprehensive explanations that users can navigate to when needed.

---

## Design

### Document Type

Encyclopedia entries are **prose documents** in the library. They can be:
- Created like any other prose document
- Tagged or categorized as "encyclopedia" for filtering
- Given canonical slugs that match their term (e.g., `/library/sortition`, `/library/general-assembly`)

Using the existing prose document type means:
- No new document type infrastructure needed
- Entries benefit from full library features (versioning, ownership, etc.)
- Can be edited and improved over time by authorized members
- Natural integration with the existing library navigation

### Linking Terms

Throughout the app, unfamiliar or specialized terms link to their encyclopedia entries:

```svelte
<a href="/library/sortition" class="term-link">sortition</a>
```

Styling:
- Subtle underline in institutional gold (`--gold`)
- No special decoration that makes them look different from other library links
- On hover, standard link hover state (`--gold-hover`)

Links are added:
- Manually when writing documents or UI text
- In contexts where a term is likely unfamiliar
- First occurrence in a document, not every occurrence

### Encyclopedia Entries

Each entry is a prose document with:

**Title**: The term being defined (e.g., "Sortition", "General Assembly")

**Content**: 
- Clear definition in the first paragraph
- Historical or conceptual context if relevant
- How it's used in this society
- Links to related encyclopedia entries
- Links to relevant governing documents (e.g., Charter articles)

**Structure**: 
- Introduction/definition
- Optional sections: History, Usage, Related Terms, See Also
- Written in clear, accessible language
- Assumes intelligent reader who wants to understand deeply

**Example structure**:

```markdown
# Sortition

Sortition is the selection of officials by random lot from an eligible pool, rather than by election or appointment.

## Purpose

Sortition serves several institutional goals:
- Distributes power broadly rather than concentrating it
- Reduces the influence of wealth and rhetoric on selection
- Ensures that governance reflects the full membership

## In This Society

The Ben Franklin Society uses sortition to select [jurors](/library/jury) for [referenda](/library/referendum) and to fill certain [committee](/library/committee) seats...

## Related Terms

- [Referendum](/library/referendum)
- [Jury](/library/jury)
- [General Assembly](/library/general-assembly)
```

---

## Editorial Approach

### Tone

- **Authoritative but accessible** — assume intelligent reader
- **No condescension** — explain clearly without dumbing down
- **Institutional voice** — this is the society explaining its own concepts
- **Link generously** — help readers explore related concepts

### What Gets an Entry

- Terms specific to this governance system
- Specialized vocabulary from governing documents
- Process concepts that have specific meaning here (e.g., "deliberation" as a motion status)
- Historical references that provide context

### What Doesn't Need an Entry

- Common English words used in their standard meaning
- Self-explanatory UI labels
- Concepts explained in-context sufficiently

---

## Implementation Notes

### Phase 1 (Current)
- Use existing prose document type
- Manually create encyclopedia entries as prose documents
- Manually link terms to entries throughout the app
- Tag or categorize as "encyclopedia" for easy filtering

### Possible Future Enhancements
- Dedicated encyclopedia document type with structured fields
- Auto-linking of known terms in document content
- "Related terms" auto-discovery based on links
- Encyclopedia index page showing alphabetical or categorical listing
- Search scoped to encyclopedia entries

### Starting Entries

Priority terms for initial encyclopedia:
1. Sortition
2. General Assembly
3. Referendum
4. Motion (and motion statuses: draft, introduced, deliberation, enacted, rejected, withdrawn)
5. Provision
6. College
7. Committee
8. Service
9. Association
10. Charter, Constitution, Bylaws

---

## Design Rationale

### Why Not Tooltips?

Tooltips have several problems:
- Require hovering (doesn't work on mobile)
- Interrupt reading flow with popups
- Limited space for explanation
- Patronizing if overused
- Cluttered if underused

Encyclopedia links respect the user's agency: you follow the link if you want to learn more.

### Why Not Inline Definitions?

Inline definitions clutter the prose and make documents longer. They assume the reader doesn't know the term. Encyclopedia links assume the reader can decide whether they need clarification.

### Why Not a Separate Encyclopedia Section?

The encyclopedia is part of the library because encyclopedia entries are documents like any other. They can be referenced, versioned, cited, and improved. Keeping them in the unified library system means members encounter them naturally when browsing or searching.

---

## Success Criteria

The encyclopedia is successful if:
- New members can navigate governance terminology without confusion
- Experienced members use it as a reference when writing or deliberating
- Links feel natural and helpful, not intrusive
- Entries grow and improve as the institution learns
- The knowledge base reflects institutional maturity over time
