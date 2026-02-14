# Technical Design: Ask an Agent

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Workload Detail Page                      │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  [View Logs] [Stop] [Delete] [Ask an Agent] ←─────────┐│ │
│  └────────────────────────────────────────────────────────┘│ │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    AgentChatModal Component                  │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ Header: "Chat with Agent" + Workload Context           │ │
│  ├────────────────────────────────────────────────────────┤ │
│  │ Message List:                                          │ │
│  │   [Agent] Hi! I'm analyzing workload abc123...         │ │
│  │   [User]  Why did my deployment fail?                  │ │
│  │   [Agent] Looking at logs... (streaming)               │ │
│  ├────────────────────────────────────────────────────────┤ │
│  │ Input: [Type a message...]                    [Send]   │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ HTTP POST + SSE
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              agent-chat-service Integration                  │
│                                                              │
│  POST   /api/workloads/:id/agent/start                      │
│  POST   /api/workloads/:id/agent/message                    │
│  GET    /api/workloads/:id/agent/stream (SSE)               │
│  GET    /api/workloads/:id/agent/history                    │
│  DELETE /api/workloads/:id/agent                            │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Agent Orchestrator                        │
│                                                              │
│  • Prepare workload context (state + logs + metadata)       │
│  • Initialize Claude API with system prompt                 │
│  • Provide tools: searchLogs, getWorkloadState              │
│  • Stream responses via SSE                                 │
│  • Persist chat history to DB                               │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      Claude API (Anthropic)                  │
│                                                              │
│  Model: claude-sonnet-4-5-20250929                          │
│  Streaming: true                                             │
│  Tools: [searchLogs, getWorkloadState, ...]                 │
└─────────────────────────────────────────────────────────────┘
```

## Data Models

### agentChatSession

Tracks active and historical agent chat sessions.

```typescript
{
  name: 'agentChatSession',
  fields: {
    id: { type: 'string', primaryKey: true },
    workloadId: { type: 'string', required: true },
    projectId: { type: 'string', required: true },
    userId: { type: 'string' }, // Future: track who started session
    startedAt: { type: 'string', required: true }, // ISO timestamp
    endedAt: { type: 'string' }, // null if active
    status: { type: 'string', required: true }, // 'active' | 'ended' | 'error'
    contextSnapshot: { type: 'json' }, // Workload state at session start
  }
}
```

### agentChatMessage

Individual messages within a chat session.

```typescript
{
  name: 'agentChatMessage',
  fields: {
    id: { type: 'string', primaryKey: true },
    sessionId: { type: 'string', required: true },
    role: { type: 'string', required: true }, // 'user' | 'agent' | 'system'
    content: { type: 'string', required: true },
    timestamp: { type: 'string', required: true }, // ISO timestamp
    metadata: { type: 'json' }, // Tool calls, log references, etc.
  }
}
```

## Backend Service: agent-chat-service

### File Structure

```
src/services/agent-chat/
├── index.ts              # Integration service registration
├── orchestrator.ts       # Agent session management
├── context.ts            # Workload context preparation
├── tools.ts              # Agent tool definitions
├── streaming.ts          # SSE response streaming
└── models.ts             # DataObject definitions
```

### Key Components

#### orchestrator.ts

```typescript
class AgentOrchestrator {
  private sessions: Map<string, AgentSession>

  async startSession(workloadId: string, projectId: string): Promise<string> {
    // 1. Fetch workload + deployment details
    // 2. Fetch recent logs (last 500 lines)
    // 3. Prepare system prompt with context
    // 4. Create session record
    // 5. Initialize Claude API client
    // 6. Send welcome message
    // 7. Return session ID
  }

  async sendMessage(sessionId: string, userMessage: string): Promise<void> {
    // 1. Validate session exists and is active
    // 2. Add user message to history
    // 3. Send to Claude API with full context
    // 4. Stream response chunks via SSE
    // 5. Persist agent response to DB
  }

  async endSession(sessionId: string): Promise<void> {
    // 1. Mark session as ended
    // 2. Close SSE connections
    // 3. Clean up resources
  }
}
```

#### context.ts

```typescript
async function prepareWorkloadContext(workloadId: string): Promise<WorkloadContext> {
  const workload = await workloadStore.get(workloadId)
  const deployment = await deploymentStore.get(workload.deploymentId)
  const logs = await getWorkloadLogs(workloadId, { limit: 500 })

  return {
    workload: {
      id: workload.id,
      status: workload.status,
      stage: workload.stage,
      startedAt: workload.startedAt,
      stoppedAt: workload.stoppedAt,
    },
    deployment: {
      projectId: deployment.projectId,
      servicePath: deployment.servicePath,
      gitUrl: redactSensitive(deployment.gitUrl),
      branch: deployment.branch,
      commitHash: deployment.commitHash,
    },
    logs: {
      recent: logs.slice(-100), // Last 100 lines for immediate context
      total: logs.length,
    },
  }
}
```

#### tools.ts

Agent-accessible tools for querying workload data.

```typescript
const searchLogsTool = {
  name: 'search_logs',
  description: 'Search workload logs for specific keywords or patterns',
  input_schema: {
    type: 'object',
    properties: {
      keywords: { type: 'array', items: { type: 'string' } },
      startTime: { type: 'string' }, // ISO timestamp
      endTime: { type: 'string' },
      limit: { type: 'number', default: 50 },
    },
    required: ['keywords'],
  },
  execute: async (input) => {
    // Search logs and return matching lines
  },
}

const getWorkloadStateTool = {
  name: 'get_workload_state',
  description: 'Get current workload status and metadata',
  input_schema: {
    type: 'object',
    properties: {},
  },
  execute: async () => {
    // Return fresh workload state
  },
}
```

#### streaming.ts

SSE stream management for real-time responses.

```typescript
class AgentStreamManager {
  private connections: Map<string, ServerSentEventStream>

  registerStream(sessionId: string, stream: ServerSentEventStream) {
    this.connections.set(sessionId, stream)
  }

  async emitMessageStart(sessionId: string, messageId: string) {
    const stream = this.connections.get(sessionId)
    stream?.sendEvent('message-start', { messageId })
  }

  async emitContentDelta(sessionId: string, delta: string) {
    const stream = this.connections.get(sessionId)
    stream?.sendEvent('content-delta', { delta })
  }

  async emitMessageComplete(sessionId: string, messageId: string, fullContent: string) {
    const stream = this.connections.get(sessionId)
    stream?.sendEvent('message-complete', { messageId, content: fullContent })
  }

  closeStream(sessionId: string) {
    const stream = this.connections.get(sessionId)
    stream?.close()
    this.connections.delete(sessionId)
  }
}
```

### API Endpoints

#### POST /api/workloads/:workloadId/agent/start

Start a new agent chat session.

**Request:**
```json
{}
```

**Response:**
```json
{
  "sessionId": "sess_abc123",
  "status": "active",
  "welcomeMessage": "Hi! I'm analyzing your workload...",
  "contextSummary": {
    "workloadId": "work_xyz789",
    "status": "running",
    "stage": "running",
    "startedAt": "2026-02-11T10:30:00Z"
  }
}
```

#### POST /api/workloads/:workloadId/agent/message

Send a message to the agent.

**Request:**
```json
{
  "sessionId": "sess_abc123",
  "message": "Why did my deployment fail?"
}
```

**Response:**
```json
{
  "messageId": "msg_def456",
  "status": "processing"
}
```

Agent response streams via SSE (see below).

#### GET /api/workloads/:workloadId/agent/stream

SSE stream for agent responses.

**Events:**

```typescript
// Agent starts composing response
{
  event: 'message-start',
  data: { messageId: 'msg_def456' }
}

// Incremental content chunks
{
  event: 'content-delta',
  data: { delta: 'Looking at your logs, I can see...' }
}

// Agent uses a tool (for transparency)
{
  event: 'tool-use',
  data: {
    tool: 'search_logs',
    input: { keywords: ['error', 'failed'] }
  }
}

// Agent finishes response
{
  event: 'message-complete',
  data: {
    messageId: 'msg_def456',
    content: 'Full message content...'
  }
}

// Keep-alive ping
{
  event: 'ping',
  data: { timestamp: '2026-02-11T10:31:00Z' }
}
```

#### GET /api/workloads/:workloadId/agent/history

Retrieve chat history for a session.

**Response:**
```json
{
  "sessionId": "sess_abc123",
  "messages": [
    {
      "id": "msg_001",
      "role": "agent",
      "content": "Hi! I'm analyzing your workload...",
      "timestamp": "2026-02-11T10:30:00Z"
    },
    {
      "id": "msg_002",
      "role": "user",
      "content": "Why did my deployment fail?",
      "timestamp": "2026-02-11T10:30:15Z"
    }
  ]
}
```

#### DELETE /api/workloads/:workloadId/agent

End the agent session.

**Response:**
```json
{
  "sessionId": "sess_abc123",
  "status": "ended",
  "endedAt": "2026-02-11T10:35:00Z"
}
```

## Frontend Components

### AgentChatModal.tsx

Main chat interface component.

```typescript
interface AgentChatModalProps {
  workloadId: string
  projectId: string
  isOpen: boolean
  onClose: () => void
}

export function AgentChatModal({ workloadId, projectId, isOpen, onClose }: AgentChatModalProps) {
  const { messages, isAgentTyping, sendMessage, sessionId } = useAgentChat(workloadId)

  return (
    <Dialog open={isOpen} onClose={onClose}>
      <DialogHeader>
        <DialogTitle>Chat with Agent</DialogTitle>
        <DialogSubtitle>Workload: {workloadId}</DialogSubtitle>
      </DialogHeader>

      <MessageList messages={messages} isAgentTyping={isAgentTyping} />

      <MessageInput onSend={sendMessage} disabled={isAgentTyping} />
    </Dialog>
  )
}
```

### useAgentChat Hook

Manages chat state and SSE connection.

```typescript
function useAgentChat(workloadId: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [isAgentTyping, setIsAgentTyping] = useState(false)

  // Start session on mount
  useEffect(() => {
    const startSession = async () => {
      const response = await fetch(`/api/workloads/${workloadId}/agent/start`, {
        method: 'POST',
      })
      const data = await response.json()
      setSessionId(data.sessionId)
      setMessages([
        {
          id: 'welcome',
          role: 'agent',
          content: data.welcomeMessage,
          timestamp: new Date().toISOString(),
        },
      ])
    }
    startSession()
  }, [workloadId])

  // Connect to SSE stream
  useEffect(() => {
    if (!sessionId) return

    const eventSource = new EventSource(`/api/workloads/${workloadId}/agent/stream`)

    let currentMessage = ''

    eventSource.addEventListener('message-start', (e) => {
      setIsAgentTyping(true)
      currentMessage = ''
    })

    eventSource.addEventListener('content-delta', (e) => {
      const data = JSON.parse(e.data)
      currentMessage += data.delta
      // Update last message with accumulated content
      setMessages((prev) => {
        const last = prev[prev.length - 1]
        if (last?.role === 'agent' && last.isStreaming) {
          return [...prev.slice(0, -1), { ...last, content: currentMessage }]
        }
        return [
          ...prev,
          {
            id: Date.now().toString(),
            role: 'agent',
            content: currentMessage,
            timestamp: new Date().toISOString(),
            isStreaming: true,
          },
        ]
      })
    })

    eventSource.addEventListener('message-complete', (e) => {
      setIsAgentTyping(false)
      const data = JSON.parse(e.data)
      setMessages((prev) => {
        const last = prev[prev.length - 1]
        if (last?.isStreaming) {
          return [...prev.slice(0, -1), { ...last, isStreaming: false }]
        }
        return prev
      })
    })

    return () => eventSource.close()
  }, [sessionId, workloadId])

  const sendMessage = async (content: string) => {
    // Optimistically add user message
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, userMessage])

    // Send to API
    await fetch(`/api/workloads/${workloadId}/agent/message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, message: content }),
    })
  }

  return { messages, isAgentTyping, sendMessage, sessionId }
}
```

### AgentChatMessage.tsx

Individual message rendering with markdown support.

```typescript
interface AgentChatMessageProps {
  message: ChatMessage
}

export function AgentChatMessage({ message }: AgentChatMessageProps) {
  const isUser = message.role === 'user'

  return (
    <div className={cn('message', isUser ? 'message-user' : 'message-agent')}>
      <div className="message-content">
        {message.isStreaming ? (
          <div>{message.content}</div>
        ) : (
          <ReactMarkdown
            components={{
              code: ({ inline, children, ...props }) => (
                inline ? (
                  <code className="inline-code" {...props}>
                    {children}
                  </code>
                ) : (
                  <SyntaxHighlighter language="typescript" style={vscDarkPlus}>
                    {String(children).replace(/\n$/, '')}
                  </SyntaxHighlighter>
                )
              ),
            }}
          >
            {message.content}
          </ReactMarkdown>
        )}
      </div>
      <div className="message-timestamp">
        {formatTimestamp(message.timestamp)}
      </div>
    </div>
  )
}
```

## Claude API Integration

### System Prompt Template

```typescript
function buildSystemPrompt(context: WorkloadContext): string {
  return `You are an AI assistant helping debug and analyze a workload deployment in AgentForge.

## Workload Details
- **ID:** ${context.workload.id}
- **Status:** ${context.workload.status}
- **Stage:** ${context.workload.stage}
- **Started:** ${context.workload.startedAt}
- **Stopped:** ${context.workload.stoppedAt || 'Still running'}

## Deployment Details
- **Project ID:** ${context.deployment.projectId}
- **Service Path:** ${context.deployment.servicePath}
- **Branch:** ${context.deployment.branch}
- **Commit:** ${context.deployment.commitHash}

## Recent Logs
${context.logs.recent.join('\n')}

## Your Capabilities
You have access to these tools:
- **search_logs:** Search the full log history for specific keywords or patterns
- **get_workload_state:** Get the current workload status and metadata

## Guidelines
- Be concise and actionable
- Cite specific log lines when referencing errors
- Provide concrete next steps, not just explanations
- If you don't know, say so - don't guess
- Format code blocks with syntax highlighting
- Use bullet points for lists

How can you help the user debug this workload?`
}
```

### Streaming Implementation

```typescript
async function streamAgentResponse(
  sessionId: string,
  userMessage: string,
  context: WorkloadContext
) {
  const client = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  })

  const chatHistory = await getChatHistory(sessionId)

  const stream = await client.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 4096,
    system: buildSystemPrompt(context),
    messages: [
      ...chatHistory,
      { role: 'user', content: userMessage },
    ],
    tools: [searchLogsTool, getWorkloadStateTool],
    stream: true,
  })

  streamManager.emitMessageStart(sessionId, generateMessageId())

  let fullContent = ''

  for await (const chunk of stream) {
    if (chunk.type === 'content_block_delta') {
      const delta = chunk.delta.text
      fullContent += delta
      streamManager.emitContentDelta(sessionId, delta)
    } else if (chunk.type === 'message_stop') {
      streamManager.emitMessageComplete(sessionId, messageId, fullContent)
      await saveMessage(sessionId, 'agent', fullContent)
    }
  }
}
```

## Security & Privacy

### Data Redaction

Before sending context to Claude API:

```typescript
function redactSensitive(text: string): string {
  return text
    .replace(/password[=:]\s*\S+/gi, 'password=***')
    .replace(/token[=:]\s*\S+/gi, 'token=***')
    .replace(/api[_-]?key[=:]\s*\S+/gi, 'api_key=***')
    .replace(/secret[=:]\s*\S+/gi, 'secret=***')
}
```

### Rate Limiting

```typescript
const RATE_LIMITS = {
  sessionsPerHour: 10,
  messagesPerSession: 50,
  maxConcurrentSessions: 3,
}

function checkRateLimit(userId: string, type: 'session' | 'message'): boolean {
  // Check Redis or in-memory cache for rate limit counters
  // Return false if limit exceeded
}
```

### Access Control

```typescript
async function validateAccess(workloadId: string, userId: string): Promise<boolean> {
  const workload = await workloadStore.get(workloadId)
  const deployment = await deploymentStore.get(workload.deploymentId)
  const project = await projectStore.get(deployment.projectId)

  // Check if user is project member
  return project.members.includes(userId)
}
```

## Cost Estimation

**Model:** Claude Sonnet 4.5
- Input: ~$3 per million tokens
- Output: ~$15 per million tokens

**Estimated Usage per Session:**
- Initial context: ~2,000 tokens (workload details + logs)
- User messages: ~100 tokens each
- Agent responses: ~500 tokens each
- Tools: ~200 tokens per tool call

**Example Session (10 messages):**
- Input: 2,000 (context) + 1,000 (5 user msgs) + 1,000 (tool calls) = 4,000 tokens → $0.012
- Output: 2,500 (5 agent responses) = 2,500 tokens → $0.038
- **Total: ~$0.05 per session**

**At Scale:**
- 100 sessions/day = $5/day = $150/month
- 1,000 sessions/day = $50/day = $1,500/month

Implement usage tracking and alerts for cost monitoring.

## Testing Strategy

### Unit Tests
- Context preparation logic
- Tool execution functions
- Message persistence
- Rate limiting

### Integration Tests
- Full chat flow (start → message → response → end)
- SSE streaming
- Error handling (API failures, timeouts)
- Tool calling

### E2E Tests
- User clicks "Ask an Agent"
- Modal opens with welcome message
- User sends message
- Agent responds with relevant info
- Log search tool works correctly
- Session persists across page refresh

## Deployment Checklist

- [ ] Add `ANTHROPIC_API_KEY` to environment variables
- [ ] Create database tables for chat sessions and messages
- [ ] Configure rate limiting (Redis or in-memory)
- [ ] Set up cost monitoring and alerts
- [ ] Test with real workload logs
- [ ] Document API endpoints
- [ ] Add analytics tracking
- [ ] Set up error logging (Sentry, etc.)
