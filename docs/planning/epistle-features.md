# Epistle Feature Enhancements - Planning Document

**Philosophy:** All features must support human flourishing and clear communication. No dark patterns, no engagement optimization, no social pressure mechanics.

---

## Approved Features

### Phase 1 - Core Functionality
1. **Search** - Find messages by sender, subject, or body text
2. **Archive** - Remove from inbox without deleting
3. **Forward** - Share messages with context and optional comment
4. **Quote Parent** - Include previous message text in replies

### Phase 2 - Communication Quality
5. **CC/BCC** - Send to multiple recipients (transparent group communication)
6. **Rich Text Formatting** - Basic formatting (bold, italic, lists, quotes)
7. **Signatures** - Auto-append consistent sign-off
8. **Templates** - Save reusable message formats (announcements, meeting invitations)

### Phase 3 - Attachments & Organization
9. **Attachments** - Share documents and files
10. **Autosave Drafts** - Protect work-in-progress
11. **Labels** (Personal only) - Categorize messages for personal organization
12. **Contact Groups** - Send to predefined groups efficiently

---

## Phase 1 Implementation: Core Functionality

### 1. Search

**Goal:** Find messages without scrolling through history.

**Database:**
- Add full-text search index on `mail_message` table
- Columns: `subject`, `body`, `from_handle_cache`, `to_handle_cache`

**Schema Changes:**
```sql
-- SQLite FTS5 virtual table
CREATE VIRTUAL TABLE mail_message_fts USING fts5(
  subject,
  body,
  from_handle,
  to_handle,
  content='mail_message',
  content_rowid='id'
);

-- Triggers to keep FTS in sync
CREATE TRIGGER mail_message_ai AFTER INSERT ON mail_message BEGIN
  INSERT INTO mail_message_fts(rowid, subject, body, from_handle, to_handle)
  VALUES (new.id, new.subject, new.body, new.from_handle_cache, new.to_handle_cache);
END;

CREATE TRIGGER mail_message_ad AFTER DELETE ON mail_message BEGIN
  DELETE FROM mail_message_fts WHERE rowid = old.id;
END;

CREATE TRIGGER mail_message_au AFTER UPDATE ON mail_message BEGIN
  UPDATE mail_message_fts 
  SET subject = new.subject,
      body = new.body,
      from_handle = new.from_handle_cache,
      to_handle = new.to_handle_cache
  WHERE rowid = new.id;
END;
```

**UI/UX:**
- Search bar in header (visible on all pages)
- Results page showing messages with context snippets
- Filter options: Date range, Sender, Sent/Received
- No "smart" sorting - chronological only

**Files to Create/Modify:**
- `apps/mail/src/routes/search/+page.svelte` - Search results UI
- `apps/mail/src/routes/search/+page.server.ts` - Search query logic
- `apps/mail/src/lib/server/search.ts` - FTS query builder
- `apps/mail/src/routes/+layout.svelte` - Add search bar to header
- Migration: `packages/db/migrations/XXX_mail_search.sql`

**Implementation Notes:**
- Use SQLite FTS5 for full-text search
- Highlight matching terms in results
- Respect mailbox permissions (users only see their own messages)

---

### 2. Archive

**Goal:** Clear inbox of handled mail without deleting. Preserve correspondence for reference.

**Database:**
```sql
-- Add archived_at column to mail_thread table
ALTER TABLE mail_thread ADD COLUMN archived_at TEXT DEFAULT NULL;
```

**UI/UX:**
- Archive button on thread view (alongside Reply, Forward)
- Archive button on thread list items (hover or swipe action)
- "Archived" navigation item in sidebar
- Archived threads show with subtle styling
- Easy "Move to Inbox" to unarchive

**Files to Create/Modify:**
- `apps/mail/src/routes/thread/[thread_id]/+page.server.ts` - Add archive action
- `apps/mail/src/routes/thread/[thread_id]/+page.svelte` - Archive button UI
- `apps/mail/src/routes/archive/+page.svelte` - Archived threads list
- `apps/mail/src/routes/archive/+page.server.ts` - Load archived threads
- `apps/mail/src/routes/+layout.svelte` - Add Archive link to sidebar
- `apps/mail/src/lib/server/threads.ts` - Archive/unarchive functions
- Migration: `packages/db/migrations/XXX_mail_archive.sql`

**Implementation Notes:**
- Archived threads don't appear in Inbox
- Archiving is per-mailbox (recipient-specific, not thread-wide)
- New replies to archived threads return them to Inbox (like Gmail)

---

### 3. Forward

**Goal:** Share useful information with others. Include original message with context.

**Database:**
- No schema changes needed
- Forwarded messages create new threads with special subject format

**UI/UX:**
- "Forward" button on message cards
- Compose-like form pre-filled with:
  - Subject: "Fwd: [original subject]"
  - Body: "[Your optional comment]\n\n--- Forwarded message ---\nFrom: @sender\nDate: [timestamp]\nSubject: [subject]\n\n[original body]"
- To field for new recipient(s)
- Clear indication this is a forward (not a reply)

**Files to Create/Modify:**
- `apps/mail/src/routes/forward/[message_id]/+page.svelte` - Forward compose UI
- `apps/mail/src/routes/forward/[message_id]/+page.server.ts` - Load original message, handle send
- `apps/mail/src/routes/thread/[thread_id]/+page.svelte` - Add Forward button
- `apps/mail/src/lib/server/messages.ts` - `forwardMessage()` function

**Implementation Notes:**
- Forward creates entirely new thread (not a reply)
- Original sender is credited in forwarded text
- Optional: "Forwarded by @handle" metadata

---

### 4. Quote Parent Message

**Goal:** Reduce confusion in threaded conversations. Show what you're replying to.

**Database:**
- No schema changes needed

**UI/UX:**
- Reply form includes quoted text from parent message
- Quoted text styled distinctly (left border, indented, gray text)
- Format: "> On [date], @sender wrote:\n> [quoted lines]"
- Easy to edit/remove quote before sending

**Files to Create/Modify:**
- `apps/mail/src/routes/thread/[thread_id]/+page.svelte` - Update reply form to include quoted text
- `apps/mail/src/routes/thread/[thread_id]/+page.server.ts` - Pass parent message to reply action
- CSS for quoted text styling

**Implementation Notes:**
- Quote is plain text with "> " prefix per line
- User can edit/delete quote before sending
- Keep quotes concise (trim very long messages)

---

## Phase 2 Implementation: Communication Quality

### 5. CC/BCC (Multiple Recipients)

**Goal:** Send to multiple people transparently. BCC for privacy when needed.

**Database:**
```sql
-- New table for message recipients
CREATE TABLE mail_message_recipient (
  message_uuid TEXT NOT NULL REFERENCES mail_message(uuid),
  recipient_uuid TEXT NOT NULL,
  recipient_handle_cache TEXT NOT NULL,
  recipient_type TEXT NOT NULL CHECK(recipient_type IN ('to', 'cc', 'bcc')),
  PRIMARY KEY (message_uuid, recipient_uuid, recipient_type)
);

CREATE INDEX idx_mail_message_recipient_message ON mail_message_recipient(message_uuid);
CREATE INDEX idx_mail_message_recipient_recipient ON mail_message_recipient(recipient_uuid);
```

**UI/UX:**
- Compose form adds "CC" and "BCC" fields (initially collapsed, show on click)
- Multiple handle input with autocomplete
- Message header shows: To, CC (but not BCC - only sender sees BCC)
- Clear indication of who received the message

**Files to Create/Modify:**
- `apps/mail/src/routes/compose/+page.svelte` - Add CC/BCC fields
- `apps/mail/src/routes/compose/+page.server.ts` - Handle multiple recipients
- `apps/mail/src/lib/server/messages.ts` - Update `sendMessage()` for multiple recipients
- `apps/mail/src/routes/thread/[thread_id]/+page.svelte` - Display CC recipients
- Migration: `packages/db/migrations/XXX_mail_recipients.sql`

**Implementation Notes:**
- BCC recipients don't see each other
- BCC recipients see "To: [original recipients]" but not other BCC
- Each recipient gets their own mailbox thread entry

---

### 6. Rich Text Formatting

**Goal:** Clearer expression through basic formatting. No feature bloat.

**Database:**
```sql
-- Add content_type column to mail_message
ALTER TABLE mail_message ADD COLUMN content_type TEXT DEFAULT 'text/plain' CHECK(content_type IN ('text/plain', 'text/markdown'));
```

**UI/UX:**
- Simple formatting toolbar: **Bold**, *Italic*, Lists, > Quotes
- Use Markdown for storage and editing (human-readable even as plain text)
- Compose form textarea with formatting buttons
- Rendered markdown in message view
- Toggle between formatted/plain view

**Files to Create/Modify:**
- `apps/mail/src/routes/compose/+page.svelte` - Add formatting toolbar
- `apps/mail/src/routes/thread/[thread_id]/+page.svelte` - Render markdown
- `apps/mail/src/lib/components/MarkdownEditor.svelte` - New component
- `apps/mail/src/lib/components/MarkdownRenderer.svelte` - New component
- Migration: `packages/db/migrations/XXX_mail_markdown.sql`

**Implementation Notes:**
- Store as Markdown (human-readable, no HTML)
- Render with safe markdown parser (no XSS)
- Support: bold, italic, lists, blockquotes, links (basic only)
- No images, no custom HTML, no embeds
- Plain text fallback always available

---

### 7. Signatures

**Goal:** Consistent formal sign-off without repetitive typing.

**Database:**
```sql
-- Add signature column to mailbox
ALTER TABLE mail_mailbox ADD COLUMN signature TEXT DEFAULT NULL;
```

**UI/UX:**
- Settings page for mailbox configuration
- Text field to enter signature
- Signature auto-appended to compose/reply forms (editable per message)
- Preview in settings
- Format: "\n\n-- \n[signature text]"

**Files to Create/Modify:**
- `apps/mail/src/routes/settings/+page.svelte` - Settings UI
- `apps/mail/src/routes/settings/+page.server.ts` - Save signature
- `apps/mail/src/routes/compose/+page.svelte` - Include signature in initial content
- `apps/mail/src/routes/thread/[thread_id]/+page.svelte` - Include signature in reply
- Migration: `packages/db/migrations/XXX_mail_signatures.sql`

**Implementation Notes:**
- Simple text only (or markdown if Phase 2 #6 is done)
- Standard "-- " delimiter before signature
- User can edit/remove per message

---

### 8. Templates

**Goal:** Efficiency for recurring formal messages (meeting invitations, announcements).

**Database:**
```sql
CREATE TABLE mail_template (
  uuid TEXT PRIMARY KEY,
  mailbox_uuid TEXT NOT NULL REFERENCES mail_mailbox(principal_uuid),
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_mail_template_mailbox ON mail_template(mailbox_uuid);
```

**UI/UX:**
- "Templates" section in navigation
- Create/edit templates with name, subject, body
- Use template from compose (dropdown or button)
- Templates are personal (not shared)
- Optional: {{placeholders}} for dynamic content

**Files to Create/Modify:**
- `apps/mail/src/routes/templates/+page.svelte` - List templates
- `apps/mail/src/routes/templates/+page.server.ts` - Load templates
- `apps/mail/src/routes/templates/new/+page.svelte` - Create template
- `apps/mail/src/routes/templates/[uuid]/+page.svelte` - Edit template
- `apps/mail/src/routes/compose/+page.svelte` - Use template dropdown
- `apps/mail/src/lib/server/templates.ts` - Template CRUD
- Migration: `packages/db/migrations/XXX_mail_templates.sql`

**Implementation Notes:**
- Plain text or markdown (if rich text is implemented)
- Personal only (not system-wide)
- Optional: Simple variable substitution ({{recipient_name}})

---

## Phase 3 Implementation: Attachments & Organization

### 9. Attachments

**Goal:** Share documents that matter (governance docs, meeting notes, etc.).

**Database:**
```sql
CREATE TABLE mail_attachment (
  uuid TEXT PRIMARY KEY,
  message_uuid TEXT NOT NULL REFERENCES mail_message(uuid) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  content_type TEXT NOT NULL,
  size_bytes INTEGER NOT NULL,
  storage_path TEXT NOT NULL,
  uploaded_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_mail_attachment_message ON mail_attachment(message_uuid);
```

**UI/UX:**
- File upload in compose form (drag-drop or button)
- Show attached files with size, type, remove button
- Message view shows attachments with download links
- File size limit (e.g., 10MB per file, 25MB per message)
- Allowed types: PDF, text, images, common office docs

**Files to Create/Modify:**
- `apps/mail/src/routes/compose/+page.svelte` - File upload UI
- `apps/mail/src/routes/compose/+page.server.ts` - Handle file uploads
- `apps/mail/src/routes/thread/[thread_id]/+page.svelte` - Display attachments
- `apps/mail/src/routes/attachment/[uuid]/+server.ts` - Download endpoint
- `apps/mail/src/lib/server/attachments.ts` - File storage handling
- Migration: `packages/db/migrations/XXX_mail_attachments.sql`

**Implementation Notes:**
- Store files in filesystem (not database)
- Path structure: `/mail-data/attachments/{year}/{month}/{uuid}/{filename}`
- Virus scanning (if available)
- Access control: only thread participants can download
- Optional: Preview for PDFs/images

---

### 10. Autosave Drafts

**Goal:** Don't lose thoughtful work due to crashes, accidental navigation.

**Database:**
- Use existing drafts table
- Update draft periodically as user types

**UI/UX:**
- Auto-save every 30 seconds while composing
- "Draft saved" indicator (subtle, non-intrusive)
- Resume draft if user navigates away and returns
- Clear draft after sending

**Files to Create/Modify:**
- `apps/mail/src/routes/compose/+page.svelte` - Auto-save timer
- `apps/mail/src/routes/compose/+page.server.ts` - Update draft action
- `apps/mail/src/lib/server/messages.ts` - Upsert draft function

**Implementation Notes:**
- Debounce: only save after user stops typing for 2-3 seconds
- Use form action or API endpoint for saves
- Show last saved timestamp
- Don't notify on every save (too intrusive)

---

### 11. Labels (Personal Organization)

**Goal:** Categorize messages for personal organization. No social sharing or pressure.

**Database:**
```sql
CREATE TABLE mail_label (
  uuid TEXT PRIMARY KEY,
  mailbox_uuid TEXT NOT NULL REFERENCES mail_mailbox(principal_uuid),
  name TEXT NOT NULL,
  color TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(mailbox_uuid, name)
);

CREATE TABLE mail_thread_label (
  thread_id INTEGER NOT NULL REFERENCES mail_thread(id),
  label_uuid TEXT NOT NULL REFERENCES mail_label(uuid) ON DELETE CASCADE,
  mailbox_uuid TEXT NOT NULL,
  PRIMARY KEY (thread_id, label_uuid, mailbox_uuid)
);

CREATE INDEX idx_mail_thread_label_thread ON mail_thread_label(thread_id, mailbox_uuid);
CREATE INDEX idx_mail_thread_label_label ON mail_thread_label(label_uuid);
```

**UI/UX:**
- Personal labels (like folders but non-exclusive)
- Apply multiple labels to one thread
- Sidebar shows labels with counts
- Color coding for visual organization
- Search/filter by label

**Files to Create/Modify:**
- `apps/mail/src/routes/labels/+page.svelte` - Manage labels
- `apps/mail/src/routes/labels/[uuid]/+page.svelte` - View threads with label
- `apps/mail/src/routes/thread/[thread_id]/+page.svelte` - Label selector UI
- `apps/mail/src/routes/+layout.svelte` - Show labels in sidebar
- `apps/mail/src/lib/server/labels.ts` - Label CRUD
- Migration: `packages/db/migrations/XXX_mail_labels.sql`

**Implementation Notes:**
- Personal only (no shared labels)
- Labels are per-mailbox, not thread-wide
- Different users can label same thread differently
- No system labels (except Inbox, Sent, etc. which are views)

---

### 12. Contact Groups

**Goal:** Efficient communication with recurring groups (college members, committees).

**Database:**
```sql
CREATE TABLE mail_contact_group (
  uuid TEXT PRIMARY KEY,
  mailbox_uuid TEXT NOT NULL REFERENCES mail_mailbox(principal_uuid),
  name TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(mailbox_uuid, name)
);

CREATE TABLE mail_contact_group_member (
  group_uuid TEXT NOT NULL REFERENCES mail_contact_group(uuid) ON DELETE CASCADE,
  principal_uuid TEXT NOT NULL,
  handle_cache TEXT NOT NULL,
  PRIMARY KEY (group_uuid, principal_uuid)
);

CREATE INDEX idx_mail_contact_group_member_group ON mail_contact_group_member(group_uuid);
```

**UI/UX:**
- "Contacts" section to manage groups
- Create groups with name and member list
- Compose: type group name to add all members to To/CC
- Expand group to show members
- Personal groups only (not org-wide distribution lists)

**Files to Create/Modify:**
- `apps/mail/src/routes/contacts/+page.svelte` - List contact groups
- `apps/mail/src/routes/contacts/new/+page.svelte` - Create group
- `apps/mail/src/routes/contacts/[uuid]/+page.svelte` - Edit group
- `apps/mail/src/routes/compose/+page.svelte` - Group autocomplete
- `apps/mail/src/lib/server/contacts.ts` - Group CRUD
- Migration: `packages/db/migrations/XXX_mail_contact_groups.sql`

**Implementation Notes:**
- Personal groups only (not shared)
- Resolve group to individual recipients when sending
- Recipients see individual handles, not group name
- Optional: Sync with governance colleges/committees

---

## Technical Considerations

### Database Migrations
- All migrations in `packages/db/migrations/` with sequential numbering
- Use `better-sqlite3` migration runner
- Test migrations up and down
- Backup before major schema changes

### Performance
- Index all foreign keys
- FTS5 for search (not LIKE queries)
- Pagination for all lists (50 items default)
- Lazy load attachments

### Security
- All file uploads: validate type, size, scan for malware
- Access control: users only see their own mailbox data
- Attachments: verify recipient access before download
- SQL injection: use parameterized queries always
- XSS: sanitize markdown rendering

### Testing
- Unit tests for all server functions
- Integration tests for mail flow (send, receive, thread, archive)
- UI tests for core workflows (compose, reply, forward)

### Documentation
- Update architectural docs for schema changes
- User guide for new features
- Migration guide for existing users

---

## Implementation Priority

**Phase 1 (MVP+)**: 2-3 weeks
- Search (most frequently requested)
- Archive (inbox management)
- Forward (share information)
- Quote parent (conversation context)

**Phase 2 (Communication)**: 2-3 weeks
- CC/BCC (group communication)
- Rich text (clearer expression)
- Signatures (efficiency)
- Templates (formal correspondence)

**Phase 3 (Advanced)**: 3-4 weeks
- Attachments (document sharing - most complex)
- Autosave (protect work)
- Labels (organization)
- Contact groups (efficiency)

**Total estimated time**: 8-10 weeks for full implementation

---

## Success Criteria

- **No dark patterns**: No features that optimize for engagement over wellbeing
- **Reduced friction**: Common tasks require fewer steps
- **Preserved thoughtfulness**: Features don't encourage rushed communication
- **Privacy respected**: No read receipts, no tracking, no social pressure
- **Human-readable data**: Use Markdown, not proprietary formats
- **Offline-first mindset**: Features work with intermittent connectivity

---

## Future Considerations (Not Planned)

❌ **Read receipts** - Creates social pressure  
❌ **Snooze** - Encourages procrastination  
❌ **Scheduled send** - Can be manipulative  
❌ **Priority inbox** - Creates artificial urgency  
❌ **Undo send** - Implies hasty communication  
❌ **Smart replies** - Reduces thoughtfulness  
❌ **Conversation muting** - Passive-aggressive communication  

These features optimize for speed/volume over thoughtful correspondence and don't align with human flourishing goals.
