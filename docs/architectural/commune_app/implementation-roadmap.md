# Junto App - Implementation Roadmap

## Phase 1: Foundation (Week 1)

### Goals
- Project scaffold
- Basic room data model
- Static room list UI

### Tasks
1. Create `apps/junto/` directory structure
2. Set up SvelteKit project with TypeScript
3. Add to pnpm workspace and turbo config
4. Define SQLite schema (room, message tables)
5. Create basic layout with room list sidebar
6. Implement room CRUD operations
7. Build room list UI (public rooms only)
8. Add room creation form
9. Configure port 5180
10. Set up OIDC authentication (reuse from library pattern)

### Deliverables
- App accessible at `localhost:5180`
- Can create and list rooms
- Authentication working
- No real-time functionality yet

---

## Phase 2: Text Chat (Week 2)

### Goals
- WebSocket server integration
- Real-time message send/receive
- Message persistence and history

### Tasks
1. Set up WebSocket server (integrated with SvelteKit)
2. Implement WebSocket connection in hooks
3. Create message send/receive endpoints
4. Build chat message components
5. Implement message input with send action
6. Add message history loading (last 50 messages)
7. Create real-time message broadcasting
8. Store messages in SQLite
9. Add scroll-to-bottom on new messages
10. Implement user identification (from OIDC session)

### Deliverables
- Functional text chat in rooms
- Messages persist in database
- Real-time updates for all participants
- Message history loads when joining room

---

## Phase 3: Voice Channels - Signaling (Week 3)

### Goals
- WebRTC signaling server
- Voice channel join/leave flow
- Basic peer connections

### Tasks
1. Research WebRTC signaling patterns (mesh topology)
2. Implement signaling server (WebSocket events)
3. Configure STUN servers (Google public STUN)
4. Create voice channel UI panel
5. Add "Join Voice" / "Leave Voice" buttons
6. Implement WebRTC offer/answer exchange
7. Add ICE candidate handling
8. Show voice participants list
9. Handle peer connection lifecycle
10. Add error handling for connection failures
11. Document 8-user voice limit
12. Test with 2 users in same room

### Deliverables
- Users can join/leave voice channels
- Peer connections established
- Participant list shows who's in voice
- No audio yet (media streams in Phase 4)

---

## Phase 4: Voice Channels - Audio (Week 4)

### Goals
- Microphone access
- Audio streaming
- Mute/unmute controls

### Tasks
1. Request microphone permissions
2. Capture audio stream from user media
3. Attach audio streams to peer connections
4. Render remote audio streams
5. Add mute/unmute toggle
6. Implement voice activity detection (optional)
7. Show visual indicator for speaking users
8. Handle audio device changes
9. Add volume controls
10. Test with 3-4 users simultaneously

### Deliverables
- Functional voice communication
- Mute/unmute controls working
- Visual feedback for who's speaking
- Supports 4-6 simultaneous users

---

## Phase 5: Polish & UX (Week 5)

### Goals
- Better UX
- Performance optimization
- Edge case handling

### Tasks
1. Add typing indicators
2. Implement message timestamps
3. Add infinite scroll for message history
4. Improve room list UX (unread counts, active room highlight)
5. Add loading states for all async operations
6. Implement reconnection logic for WebSocket
7. Add error messages for failed operations
8. Optimize message rendering (virtualization if needed)
9. Add keyboard shortcuts (Enter to send, etc.)
10. Improve voice channel UX (push-to-talk option)
11. Add user avatars/names from person records
12. Test with 10+ users across multiple rooms

### Deliverables
- Polished, production-ready chat UX
- Handles network issues gracefully
- Good performance with many messages
- Intuitive voice channel controls

---

## Phase 6: Deployment (Week 6)

### Goals
- Production deployment
- Docker integration
- Multi-app coordination

### Tasks
1. Create Dockerfile for junto app
2. Add to docker-compose.yml (port 5180)
3. Configure Nginx reverse proxy
4. Set up environment variables (GOVERNANCE_URL, etc.)
5. Add to deployment scripts
6. Test full deployment locally
7. Deploy to staging environment
8. Load test with concurrent users
9. Monitor WebSocket connections
10. Document deployment process

### Deliverables
- Junto app running in production
- Integrated with other BFS apps
- Monitoring and logging in place
- Deployment documentation

---

## Future Enhancements (Post-MVP)

### Federation Support
- Cross-society rooms
- Federation protocol for room discovery
- Federated identity (vouching system)

### Advanced Features
- Private rooms
- Association-linked rooms (committee channels)
- Direct messages
- Threads/replies to messages
- Reactions (emoji)
- File/image sharing
- Message search
- Room search/filtering

### Voice Improvements
- SFU migration for larger rooms
- Video channels
- Screen sharing
- Recording (with consent)
- Noise suppression
- Echo cancellation improvements

### Governance Integration
- Motion deliberation rooms
- Link rooms to proposals
- Meeting coordination
- Agenda integration

### Moderation
- Message deletion
- User blocking
- Room moderation roles
- Content filtering
- Audit logs

---

## Risk Mitigation

### Technical Risks
- **WebRTC complexity**: Start with mesh, extensive testing with real users
- **WebSocket scaling**: Plan for Redis pub/sub if needed
- **Audio quality**: Use standard codecs, gather user feedback early
- **Browser compatibility**: Test on Chrome, Firefox, Safari

### Product Risks
- **Low adoption**: Integrate with existing workflows (committees, colleges)
- **Moderation challenges**: Start with trusted community, add tools incrementally
- **Privacy concerns**: Clear communication about public rooms, add private rooms later

### Operational Risks
- **Server costs**: Voice channels can be bandwidth-intensive, monitor usage
- **Maintenance burden**: Keep codebase simple, document thoroughly
- **Security**: Validate all inputs, rate limit message sending, secure WebSocket connections
