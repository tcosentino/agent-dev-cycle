## 1. Data Models
- [ ] 1.1 Create agentChatSession DataObject in models.ts
- [ ] 1.2 Create agentChatMessage DataObject in models.ts
- [ ] 1.3 Add database migrations if needed

## 2. Backend Service Setup
- [ ] 2.1 Create src/services/agent-chat/ directory structure
- [ ] 2.2 Create models.ts with DataObject exports
- [ ] 2.3 Create index.ts integration service registration
- [ ] 2.4 Install @anthropic-ai/sdk dependency

## 3. Context Preparation
- [ ] 3.1 Create context.ts with prepareWorkloadContext()
- [ ] 3.2 Implement log fetching (last 500 lines)
- [ ] 3.3 Implement sensitive data redaction
- [ ] 3.4 Create buildSystemPrompt() template

## 4. Agent Tools
- [ ] 4.1 Create tools.ts with tool definitions
- [ ] 4.2 Implement search_logs tool
- [ ] 4.3 Implement get_workload_state tool
- [ ] 4.4 Add tool execution handlers

## 5. Agent Orchestrator
- [ ] 5.1 Create orchestrator.ts with AgentOrchestrator class
- [ ] 5.2 Implement startSession() method
- [ ] 5.3 Implement sendMessage() method
- [ ] 5.4 Implement endSession() method
- [ ] 5.5 Add session state management

## 6. Streaming Infrastructure
- [ ] 6.1 Create streaming.ts with AgentStreamManager
- [ ] 6.2 Implement SSE event emission (message-start, content-delta, message-complete)
- [ ] 6.3 Add connection lifecycle management
- [ ] 6.4 Implement keep-alive pings

## 7. API Endpoints
- [ ] 7.1 POST /api/workloads/:workloadId/agent/start
- [ ] 7.2 POST /api/workloads/:workloadId/agent/message
- [ ] 7.3 GET /api/workloads/:workloadId/agent/stream (SSE)
- [ ] 7.4 GET /api/workloads/:workloadId/agent/history
- [ ] 7.5 DELETE /api/workloads/:workloadId/agent

## 8. Security & Access Control
- [ ] 8.1 Add ANTHROPIC_API_KEY to environment variables
- [ ] 8.2 Implement access validation (user can access workload)
- [ ] 8.3 Implement rate limiting (sessions per hour, messages per session)
- [ ] 8.4 Add session timeout handling (30 min inactivity)

## 9. Frontend - Chat Modal Component
- [ ] 9.1 Create AgentChatModal.tsx component
- [ ] 9.2 Create modal layout (header, message list, input)
- [ ] 9.3 Add open/close state management
- [ ] 9.4 Style with Tailwind CSS

## 10. Frontend - Message Components
- [ ] 10.1 Create AgentChatMessage.tsx component
- [ ] 10.2 Add markdown rendering support (react-markdown)
- [ ] 10.3 Add syntax highlighting for code blocks (react-syntax-highlighter)
- [ ] 10.4 Style user vs agent messages
- [ ] 10.5 Add timestamp display

## 11. Frontend - Chat Hook
- [ ] 11.1 Create useAgentChat hook
- [ ] 11.2 Implement session start on mount
- [ ] 11.3 Implement SSE connection and event handling
- [ ] 11.4 Implement sendMessage function
- [ ] 11.5 Add cleanup on unmount
- [ ] 11.6 Handle streaming state (isAgentTyping)

## 12. Frontend - Integration
- [ ] 12.1 Add "Ask an Agent" button to DeploymentDetail view
- [ ] 12.2 Wire up modal open/close handlers
- [ ] 12.3 Pass workloadId and projectId to modal
- [ ] 12.4 Add button styling and icon

## 13. API Client Functions
- [ ] 13.1 Add startAgentSession(workloadId) to api.ts
- [ ] 13.2 Add sendAgentMessage(workloadId, sessionId, message) to api.ts
- [ ] 13.3 Add getAgentHistory(workloadId) to api.ts
- [ ] 13.4 Add endAgentSession(workloadId) to api.ts

## 14. Error Handling
- [ ] 14.1 Handle API connection failures
- [ ] 14.2 Handle Claude API errors
- [ ] 14.3 Add error messages in chat UI
- [ ] 14.4 Implement SSE reconnection with backoff
- [ ] 14.5 Handle rate limit exceeded errors

## 15. Cost Monitoring
- [ ] 15.1 Add token usage tracking
- [ ] 15.2 Log API costs per session
- [ ] 15.3 Create cost monitoring dashboard/alerts
- [ ] 15.4 Add usage analytics

## 16. Testing
- [ ] 16.1 Unit test context preparation
- [ ] 16.2 Unit test tool execution
- [ ] 16.3 Integration test full chat flow
- [ ] 16.4 Test SSE streaming
- [ ] 16.5 Test rate limiting
- [ ] 16.6 E2E test user interaction flow

## 17. Documentation
- [ ] 17.1 Update CLAUDE.md with agent chat patterns
- [ ] 17.2 Document API endpoints
- [ ] 17.3 Add usage examples
- [ ] 17.4 Document environment variables
- [ ] 17.5 Add troubleshooting guide

## 18. Polish & UX
- [ ] 18.1 Add loading states
- [ ] 18.2 Add empty states
- [ ] 18.3 Add copy code button for code blocks
- [ ] 18.4 Add scroll-to-bottom on new messages
- [ ] 18.5 Add typing indicator animation
- [ ] 18.6 Add session persistence across page refresh
