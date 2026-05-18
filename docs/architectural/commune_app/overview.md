# Commune App

**Purpose**: Real-time intra-community deliberations and discussions

**Type**: Standalone satellite app

**Status**: Planning

---

## Vision

A Discord-like application where community members can gather in public rooms for text and voice discussions. Supports ongoing deliberations, casual conversations, and spontaneous gatherings.

---

## Core Features (MVP)

### Text Chat
- Real-time messaging within rooms
- Message history/persistence
- User identification (name, avatar from person record)
- Timestamps

### Voice Channels
- WebRTC-based voice communication
- Push-to-talk or voice activation
- Visual indicators for who's speaking
- Mute/unmute controls

### Rooms
- Public rooms visible to all community members
- Room creation (authenticated users)
- Room browsing/listing
- Room details (name, description, participant count)

---

## Deferred Features (Post-MVP)

- Private rooms
- Association-linked rooms (committee channels, college lounges)
- Role-based permissions
- Direct messages
- Threads/replies
- Reactions
- File sharing
- Screen sharing
- Video channels
- Room search/filtering
- User presence indicators
- Notifications
- Message editing/deletion
- Room moderation tools

---

## Technical Architecture

### Frontend
- **Framework**: SvelteKit
- **Real-time**: WebSocket connection for chat
- **Voice**: WebRTC for peer-to-peer or server-mediated voice
- **UI Components**: Shared `@bfs/ui` package

### Backend
- **Runtime**: Node.js (SvelteKit server)
- **Database**: SQLite (message persistence, room metadata)
- **WebSocket**: Socket.io or native WebSocket server
- **Voice Server**: Potentially separate signaling server for WebRTC

### Data Model

```typescript
// Room
interface Room {
  uuid: string;
  name: string;
  description: string | null;
  created_by: string; // person_uuid
  created_at: string;
  is_public: boolean;
}

// Message
interface Message {
  uuid: string;
  room_uuid: string;
  author_uuid: string; // person_uuid
  content: string;
  sent_at: string;
}

// Voice Participant (in-memory)
interface VoiceParticipant {
  person_uuid: string;
  room_uuid: string;
  joined_at: string;
  is_muted: boolean;
  is_speaking: boolean;
}
```

---

## User Flows

### Join Room & Chat
1. User browses public rooms list
2. User clicks on a room
3. Chat history loads (last N messages)
4. User can type and send messages
5. Messages appear in real-time for all participants

### Join Voice Channel
1. User is in a room
2. User clicks "Join Voice"
3. Browser requests microphone permissions
4. WebRTC connection established
5. User can speak/listen to others in channel
6. Visual indicators show who's speaking

---

## Integration with BFS Ecosystem

### Authentication
- Uses existing OIDC session from governance app
- Access person data (name, avatar) from shared database

### Federation
- Future: Cross-society rooms (using `.bfs` network)
- Future: Federation protocol for room discovery

### Governance
- Future: Link rooms to associations (committees can have dedicated channels)
- Future: Motion deliberation rooms

---

## Open Questions

1. **App Name**: `commune`, `gathering`, `assembly-hall`, `forum`, `agora`?
2. **Voice Architecture**: P2P WebRTC or SFU (Selective Forwarding Unit)?
3. **Message Persistence**: How long should messages be retained?
4. **Scalability**: WebSocket connection limits, voice channel participant limits?
5. **Moderation**: Who can moderate rooms? Delete messages?
6. **Port/Domain**: `commune.bfs` or port-based like other apps?

---

## Next Steps

1. Decide on app name
2. Create app scaffold in `apps/commune/`
3. Set up basic SvelteKit structure
4. Implement rooms data model (SQLite schema)
5. Create rooms list UI
6. Implement WebSocket server for real-time chat
7. Build chat UI
8. Add WebRTC voice channels
9. Test with multiple users
10. Deploy alongside other BFS apps
