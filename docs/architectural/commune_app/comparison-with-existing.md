# Commune vs. Existing Communication Systems

## Current Communication Tools in BFS

### Mail App (`apps/mail/`)
- **Purpose**: Asynchronous person-to-person messaging
- **Model**: Email-like (inbox, sent, compose)
- **Delivery**: Store-and-forward
- **Features**: Messages, replies, attachments
- **Best for**: Formal correspondence, multi-paragraph messages, non-urgent communication

### Bulletin/Record System (`lib/server/communications/`)
- **Purpose**: Official announcements and public records
- **Model**: Append-only log of events
- **Delivery**: Push to timeline/feed
- **Features**: Structured entries (type, subject, references)
- **Best for**: Announcements, meeting minutes, audit trail, official notices

### Motion Comments (`lib/server/governance/`)
- **Purpose**: Deliberation on specific proposals
- **Model**: Threaded comments on motions
- **Delivery**: Attached to motion documents
- **Features**: Commenting, discussion threads
- **Best for**: Structured debate, proposal refinement, formal feedback

---

## Where Junto Fits

### Junto App (Proposed)
- **Purpose**: Real-time group discussion and voice communication
- **Model**: Rooms/channels with persistent chat + ephemeral voice
- **Delivery**: Real-time via WebSocket/WebRTC
- **Features**: Live chat, voice channels, presence indicators
- **Best for**: Informal discussion, brainstorming, spontaneous gatherings, quick questions

---

## Comparison Matrix

| Feature | Mail | Bulletin | Motion Comments | **Junto** |
|---------|------|----------|-----------------|-------------|
| **Real-time** | ❌ | ❌ | ❌ | ✅ |
| **Async** | ✅ | ✅ | ✅ | ✅ (text) |
| **Voice** | ❌ | ❌ | ❌ | ✅ |
| **Group chat** | ❌ | ❌ | Limited | ✅ |
| **Formal** | Medium | High | High | Low |
| **Persistent** | ✅ | ✅ | ✅ | ✅ (text) |
| **Structured** | Medium | High | High | Low |
| **Discovery** | By recipient | Public timeline | By motion | By room list |
| **Threading** | ❌ | ❌ | ✅ | ❌ (MVP) |
| **Searchable** | ✅ | ✅ | ✅ | Future |

---

## Use Case Scenarios

### When to use Mail
- Sending a formal request to a specific person
- Lengthy correspondence requiring thoughtful responses
- Attaching documents for review
- Communication that needs clear sender/recipient record

**Example**: "Dear Committee Chair, I'm writing to request..."

### When to use Bulletin
- Official announcements to the whole community
- Publishing meeting minutes
- Recording decisions and outcomes
- Creating audit trail of governance activities

**Example**: "The General Assembly has approved Motion M-2026-042..."

### When to use Motion Comments
- Debating specific proposal details
- Suggesting amendments to motions
- Asking clarifying questions about governance proposals
- Building consensus on policy changes

**Example**: "I support this motion, but suggest we modify section 3..."

### When to use Junto
- Quick questions that need immediate answers
- Brainstorming sessions for new initiatives
- Casual community discussion
- Coordination for in-person gatherings
- Voice conversations for complex topics
- Social chat and community building

**Example**: "Anyone available to help with the harvest tomorrow?" or "Let's hop in voice to discuss the new proposal"

---

## Integration Opportunities

### Motion Deliberation Rooms
- Create dedicated Junto room for each active motion
- Link from motion detail page to discussion room
- Facilitate real-time debate before formal vote
- Supplement formal comments with casual discussion

### Committee Coordination
- Each committee gets a persistent room
- Coordinate meeting times
- Quick questions between formal meetings
- Voice calls for urgent matters

### College Discussions
- Professional colleges have dedicated rooms
- Peer consultation and knowledge sharing
- Mentorship and skill development discussions
- Informal Q&A about domains of practice

### Event Coordination
- Temporary rooms for community events
- Coordination for festivals, work days, gatherings
- Real-time logistics during events
- Post-event discussions and feedback

### General Community
- `#general` - Main community chat
- `#random` - Off-topic discussion
- `#help` - Questions and mutual aid
- `#ideas` - Brainstorming new initiatives

---

## Migration from Existing Systems

### No Migration Needed
Junto complements existing systems rather than replacing them:

- **Mail** remains for formal person-to-person correspondence
- **Bulletin** remains for official announcements and records
- **Motion Comments** remain for structured governance deliberation
- **Junto** adds new capability: real-time group discussion

### Potential Overlap
- Quick coordination messages might shift from Mail to Junto
- Some informal discussion might shift from Motion Comments to Junto deliberation rooms
- Time-sensitive announcements might be posted in Junto first, then formalized in Bulletin

### Best Practice
Use the right tool for the communication type:
- **Formal & Official** → Bulletin
- **Proposal Discussion** → Motion Comments
- **Person-to-Person** → Mail
- **Real-time & Group** → Junto

---

## System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    BFS Communication Layer              │
├─────────────────┬─────────────────┬─────────────────────┤
│                 │                 │                     │
│  Asynchronous   │   Structured    │    Real-time       │
│                 │                 │                     │
│  ┌───────────┐  │  ┌───────────┐  │  ┌───────────┐    │
│  │   Mail    │  │  │ Bulletin  │  │  │   Junto   │    │
│  │           │  │  │           │  │  │           │    │
│  │ • Inbox   │  │  │ • Record  │  │  │ • Rooms   │    │
│  │ • Compose │  │  │ • Entries │  │  │ • Chat    │    │
│  │ • Threads │  │  │ • Feed    │  │  │ • Voice   │    │
│  └───────────┘  │  └───────────┘  │  └───────────┘    │
│                 │                 │                     │
│  ┌─────────────┐│                │                     │
│  │   Motion    ││                │                     │
│  │  Comments   ││                │                     │
│  │             ││                │                     │
│  │ • Threaded  ││                │                     │
│  │ • Debate    ││                │                     │
│  └─────────────┘│                │                     │
└─────────────────┴─────────────────┴─────────────────────┘
```

---

## Privacy & Archiving Considerations

### Mail
- **Privacy**: Private between sender and recipients
- **Archiving**: Permanent in user mailboxes
- **Deletion**: User can delete from their own mailbox

### Bulletin
- **Privacy**: Public, part of official record
- **Archiving**: Permanent, immutable
- **Deletion**: Cannot be deleted (audit trail)

### Motion Comments
- **Privacy**: Public, part of deliberative record
- **Archiving**: Permanent with motion
- **Deletion**: Should not be deleted (transparency)

### Junto
- **Privacy**: Public rooms initially (private rooms in future)
- **Archiving**: Text messages retained (configurable), voice is ephemeral
- **Deletion**: Messages can be edited/deleted (casual context)
- **Retention**: Keep all messages initially, add 90-day pruning later if needed

---

## Recommendations

1. **Launch with public rooms only** - Simplest model, fastest to ship
2. **Add committee/college rooms in Phase 2** - Clear organizational structure
3. **Consider ephemeral "discussion" rooms** - Temporary rooms that auto-delete after 30 days of inactivity
4. **Link from motion pages** - "Discuss in Junto" button to create/link room
5. **Clear communication guidelines** - Help users understand when to use each tool
6. **Monitor usage patterns** - Adjust features based on how community actually uses it
7. **Voice limit**: Document 8-user maximum for mesh topology
8. **STUN/TURN**: Use public STUN servers, add TURN only if NAT issues arise
