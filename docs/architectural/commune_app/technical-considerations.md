# Commune App - Technical Considerations

## WebSocket Server Options

### Option 1: Integrated with SvelteKit
- **Pros**: Single process, shared database access, simple deployment
- **Cons**: SvelteKit doesn't natively support WebSockets in all adapters
- **Implementation**: Use `vite-plugin-node-websocket` or handle in hooks

### Option 2: Separate WebSocket Server
- **Pros**: Clean separation, easier scaling, better WebSocket support
- **Cons**: More complexity, needs IPC or shared database for user sessions
- **Implementation**: Standalone Express/Fastify server with Socket.io

**Recommendation**: Start with Option 1 for MVP, migrate to Option 2 if scaling needed.

---

## WebRTC Voice Architecture

### Option 1: Mesh (P2P)
- **Pros**: No server infrastructure, lower latency
- **Cons**: Scales poorly (n² connections), bandwidth intensive for clients
- **Good for**: 2-8 participants

### Option 2: SFU (Selective Forwarding Unit)
- **Pros**: Better scalability (n connections), lower client bandwidth
- **Cons**: Requires media server infrastructure
- **Tools**: mediasoup, Janus, Jitsi
- **Good for**: 8+ participants

### Option 3: MCU (Multipoint Control Unit)
- **Pros**: Lowest client bandwidth (single stream)
- **Cons**: High server CPU usage, encoding/decoding overhead
- **Good for**: Many participants, low-bandwidth clients

**Recommendation**: Start with Mesh for MVP (simpler), plan SFU migration for rooms with 8+ voice participants.

---

## Message Storage Strategy

### Schema Design
```sql
CREATE TABLE room (
  uuid TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  created_by TEXT NOT NULL REFERENCES person(uuid),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  is_public INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE message (
  uuid TEXT PRIMARY KEY,
  room_uuid TEXT NOT NULL REFERENCES room(uuid) ON DELETE CASCADE,
  author_uuid TEXT NOT NULL REFERENCES person(uuid),
  content TEXT NOT NULL,
  sent_at TEXT NOT NULL DEFAULT (datetime('now')),
  edited_at TEXT,
  deleted_at TEXT
);

CREATE INDEX idx_message_room_time ON message(room_uuid, sent_at DESC);

CREATE TABLE room_participant (
  room_uuid TEXT NOT NULL REFERENCES room(uuid) ON DELETE CASCADE,
  person_uuid TEXT NOT NULL REFERENCES person(uuid),
  last_seen_at TEXT NOT NULL,
  PRIMARY KEY (room_uuid, person_uuid)
);
```

### Retention Policy
- **Short-term**: Keep all messages (early stage, small community)
- **Medium-term**: Prune messages older than 90 days
- **Long-term**: Configurable per room, archive important deliberations

---

## Authentication & Authorization

### Session Handling
- Reuse existing OIDC session from governance app
- Share `session` table or validate JWT/session token
- WebSocket handshake validates session cookie

### Authorization Model (Future)
```typescript
// Room access
interface RoomAccess {
  room_uuid: string;
  person_uuid: string | null; // null = public
  association_uuid: string | null; // committee/college rooms
  role_uuid: string | null; // role-based access
}
```

---

## Real-time State Management

### Client-Side State
```typescript
// Room store (Svelte store)
{
  currentRoom: Room | null,
  messages: Message[], // last 100 or since join
  participants: Person[], // currently viewing room
  voiceParticipants: VoiceParticipant[], // in voice channel
  typing: Set<string> // person_uuids currently typing
}
```

### Server-Side State (in-memory)
- Active WebSocket connections: `Map<person_uuid, WebSocket>`
- Room subscriptions: `Map<room_uuid, Set<person_uuid>>`
- Voice channels: `Map<room_uuid, Set<VoiceParticipant>>`

---

## Performance Considerations

### Message Loading
- Paginate message history (load last 50, infinite scroll for older)
- Index on `(room_uuid, sent_at)` for efficient queries
- Consider message content size limits (e.g., 2000 chars)

### WebSocket Scaling
- Connection limits: ~10k per Node.js process (OS dependent)
- Consider Redis pub/sub for multi-instance deployments
- Monitor memory usage for in-memory state

### Voice Channel Limits
- Mesh: Hard limit at 8-10 participants (UX degrades)
- SFU: Can handle 50-100+ with proper infrastructure

---

## UI/UX Patterns

### Layout
```
┌─────────────┬──────────────────────┬─────────────┐
│             │                      │             │
│   Room      │   Chat Messages      │  Voice      │
│   List      │                      │  Panel      │
│             │                      │             │
│  + Create   │                      │ 🎤 Join     │
│             │                      │             │
│  # general  │──────────────────────│ 👤 User1    │
│  # random   │  Message Input       │ 👤 User2    │
│  # dev      │                      │             │
└─────────────┴──────────────────────┴─────────────┘
```

### Component Structure
- `RoomList.svelte` - Left sidebar with room list
- `ChatView.svelte` - Main content area with message history
- `MessageInput.svelte` - Text input with send button
- `Message.svelte` - Individual message component
- `VoicePanel.svelte` - Right sidebar with voice participants
- `VoiceControls.svelte` - Mute/unmute, join/leave buttons

---

## Deployment Considerations

### Docker Setup
- New Dockerfile for commune app
- Expose WebSocket port (e.g., 4001)
- Shared volume for SQLite database or separate DB

### Nginx Configuration
```nginx
location /commune/ {
  proxy_pass http://commune:4001/;
  proxy_http_version 1.1;
  proxy_set_header Upgrade $http_upgrade;
  proxy_set_header Connection "upgrade";
}
```

### Environment Variables
```bash
COMMUNE_PORT=4001
COMMUNE_DB_PATH=/data/commune.db
COMMUNE_VOICE_MODE=mesh # or sfu
COMMUNE_MESSAGE_RETENTION_DAYS=90
```

---

## Testing Strategy

### Unit Tests
- Message validation
- Room creation logic
- Authorization checks

### Integration Tests
- WebSocket connection flow
- Message send/receive
- Room join/leave
- Voice channel signaling

### E2E Tests
- Multi-user chat scenarios
- Voice channel with 2-3 users
- Message persistence across reconnects
