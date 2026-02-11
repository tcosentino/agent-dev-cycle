# Feature Spec: Ask an Agent

**Status:** Proposal
**Created:** 2026-02-11
**Author:** Claude Code

## Overview

Add an "Ask an Agent" capability to the workload detail page that spawns an AI agent with full context about the deployment, workload state, logs, and project details. Users can interact with the agent via chat to debug issues, analyze logs, understand errors, or get insights about their deployment.

## Goals

- Provide contextual AI assistance directly within the workload detail view
- Enable natural language querying of logs, status, and deployment information
- Reduce time to diagnose and resolve deployment issues
- Create a foundation for agent-assisted development workflows

## User Flow

1. User views a workload detail page
2. User clicks "Ask an Agent" button (near existing action buttons)
3. Modal/panel opens with chat interface
4. Agent introduces itself with workload context summary
5. User asks questions about the workload, logs, errors, etc.
6. Agent searches logs, analyzes state, provides actionable insights
7. User can copy code snippets, links, or suggested fixes
8. Chat session persists until closed or workload is deleted

## Technical Architecture

### Frontend Components

#### New Components

**`AgentChatModal.tsx`**
- Full-screen or side-panel modal overlay
- Chat message list (user messages + agent responses)
- Input field with send button
- Loading states for agent responses
- Code block rendering with syntax highlighting
- Ability to close/minimize chat

**`AgentChatMessage.tsx`**
- Individual message component
- Support for markdown rendering
- Timestamp display
- User vs. agent message styling

#### Modified Components

**`DeploymentDetail.tsx`** (or equivalent workload detail view)
- Add "Ask an Agent" button to action bar
- Manage modal open/close state
- Pass workload/deployment context to modal

### Backend Services

#### New Service: `agent-chat-service`

**Location:** `src/services/agent-chat/`

**Purpose:** Orchestrate agent sessions tied to workloads

**Key Components:**

```typescript
// src/services/agent-chat/index.ts
export const agentChatService: IntegrationService = {
  name: 'agent-chat',
  version: '1.0.0',
  register(app, ctx) {
    // Start a new agent chat session
    app.post('/api/workloads/:workloadId/agent/start', ...)

    // Send a message to the agent
    app.post('/api/workloads/:workloadId/agent/message', ...)

    // Get chat history
    app.get('/api/workloads/:workloadId/agent/history', ...)

    // Stop agent session
    app.delete('/api/workloads/:workloadId/agent', ...)

    // SSE stream for agent responses
    app.get('/api/workloads/:workloadId/agent/stream', ...)
  }
}
```

**Agent Context Preparation:**

When starting a session, gather:
- Workload details (ID, stage, status, startedAt, stoppedAt)
- Deployment details (projectId, gitUrl, branch, commitHash)
- Recent logs (last 500 lines or configurable limit)
- Current health status
- Related project metadata

**Agent Capabilities:**

The agent should be able to:
1. Search logs with filters (timestamp, severity, keywords)
2. Analyze error patterns
3. Suggest fixes based on common issues
4. Explain deployment stages and status
5. Query workload/deployment metadata
6. Reference documentation or best practices

### Data Models

#### New DataObject: `agentChatSession`

```typescript
export const agentChatSession = {
  name: 'agentChatSession',
  fields: {
    id: { type: 'string', primaryKey: true },
    workloadId: { type: 'string', required: true },
    projectId: { type: 'string', required: true },
    startedAt: { type: 'string', required: true }, // ISO timestamp
    endedAt: { type: 'string' }, // ISO timestamp, null if active
    status: { type: 'string', required: true }, // 'active' | 'ended'
  }
}
```

#### New DataObject: `agentChatMessage`

```typescript
export const agentChatMessage = {
  name: 'agentChatMessage',
  fields: {
    id: { type: 'string', primaryKey: true },
    sessionId: { type: 'string', required: true },
    role: { type: 'string', required: true }, // 'user' | 'agent'
    content: { type: 'string', required: true },
    timestamp: { type: 'string', required: true }, // ISO timestamp
    metadata: { type: 'json' }, // For log references, code blocks, etc.
  }
}
```

### Agent Integration

#### Option A: Claude API Direct Integration

Use Anthropic's Claude API with streaming:

```typescript
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
})

// Prepare system prompt with workload context
const systemPrompt = `You are an AI assistant helping debug and analyze a workload deployment.

Workload Details:
${JSON.stringify(workloadDetails, null, 2)}

Recent Logs:
${recentLogs}

You can:
- Search logs for specific patterns
- Analyze errors and suggest fixes
- Explain deployment stages
- Reference project metadata

Be concise and actionable.`

// Stream response
const stream = await client.messages.create({
  model: 'claude-sonnet-4-5-20250929',
  max_tokens: 4096,
  messages: chatHistory,
  system: systemPrompt,
  stream: true
})
```

#### Option B: Agent SDK Integration

Use Claude Agent SDK for more advanced agent capabilities:

```typescript
import { Agent } from '@anthropic-ai/agent-sdk'

const agent = new Agent({
  model: 'claude-sonnet-4-5-20250929',
  tools: [
    searchLogsTool,
    getWorkloadStateTool,
    analyzeErrorsTool
  ],
  systemPrompt: workloadContextPrompt
})
```

**Custom Tools:**

- `searchLogs(keywords, startTime?, endTime?)` - Search workload logs
- `getWorkloadState()` - Get current workload details
- `getDeploymentInfo()` - Get deployment metadata
- `getHealthChecks()` - Get health check results

### Real-Time Communication

Use SSE for agent response streaming:

**Endpoint:** `GET /api/workloads/:workloadId/agent/stream`

**Events:**
- `message-start` - Agent begins response
- `content-delta` - Incremental response text
- `message-complete` - Agent finishes response
- `tool-use` - Agent uses a tool (for transparency)
- `error` - Error occurred

**React Hook:**

```typescript
function useAgentChat(workloadId: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isAgentTyping, setIsAgentTyping] = useState(false)

  useEffect(() => {
    // Connect to SSE stream
    // Handle events
    // Update state
  }, [workloadId])

  const sendMessage = async (content: string) => {
    // POST to /api/workloads/:workloadId/agent/message
    // Optimistically add user message
  }

  return { messages, isAgentTyping, sendMessage }
}
```

## UI/UX Design

### Button Placement

Add "Ask an Agent" button to workload detail action bar, alongside:
- View Logs
- Stop Workload
- Delete Deployment

### Modal Design

**Layout:**
- Full-height right-side panel (400-500px width) OR
- Centered modal (600-800px width, 70% height)

**Header:**
- Title: "Chat with Agent"
- Subtitle: Workload ID or project name
- Close button

**Body:**
- Scrollable message list
- User messages: right-aligned, blue background
- Agent messages: left-aligned, gray background
- Loading indicator when agent is typing
- Auto-scroll to latest message

**Footer:**
- Text input with placeholder: "Ask about logs, errors, or status..."
- Send button (or Enter to send)
- Character limit indicator (optional)

### Initial Agent Message

When chat opens, agent sends welcome message:

```
Hi! I'm analyzing your workload deployment.

**Workload:** abc123-def456
**Status:** Running
**Stage:** running
**Started:** 2 minutes ago

I have access to your deployment details and logs. How can I help?
```

## Security & Privacy

### Authentication
- Only authenticated users can start agent sessions
- Users can only access agents for workloads in their projects

### Rate Limiting
- Limit agent sessions per user per hour (e.g., 10 sessions/hour)
- Limit messages per session (e.g., 50 messages/session)
- Timeout inactive sessions after 30 minutes

### Data Handling
- Do not send sensitive environment variables to agent
- Redact secrets/tokens from logs before including in context
- Store chat history encrypted at rest
- Allow users to delete chat history

### API Key Management
- Store Anthropic API key in environment variables
- Rotate keys regularly
- Monitor usage and costs

## Implementation Plan

### Phase 1: Basic Chat Interface (MVP)
1. Create `AgentChatModal` component with mock data
2. Add "Ask an Agent" button to workload detail
3. Implement basic message list and input
4. Create data models for sessions and messages
5. Set up basic API endpoints (start, message, history)

### Phase 2: Agent Integration
1. Integrate Claude API with streaming
2. Prepare workload context in system prompt
3. Implement SSE stream for responses
4. Add initial welcome message with context summary
5. Test basic Q&A about workload state

### Phase 3: Advanced Capabilities
1. Implement log search tool
2. Add error analysis patterns
3. Support code block rendering
4. Add markdown rendering for agent responses
5. Implement session persistence and history loading

### Phase 4: Polish & Optimization
1. Add loading states and error handling
2. Implement rate limiting
3. Add session timeout handling
4. Optimize context size for cost efficiency
5. Add analytics for usage tracking

## Success Metrics

- **Adoption Rate:** % of users who click "Ask an Agent" when viewing workloads
- **Engagement:** Average messages per session
- **Resolution Rate:** % of sessions where user doesn't need to view raw logs
- **Time Savings:** Reduction in time spent debugging vs. manual log analysis
- **Cost:** API costs per session, per user

## Open Questions

1. **Model Selection:** Start with Sonnet 4.5 or use Haiku for cost efficiency?
2. **Context Window:** How many log lines to include? (500? 1000? dynamic?)
3. **Session Persistence:** Store chat history indefinitely or auto-delete after X days?
4. **Multi-Agent:** Should each workload have one persistent agent or new agent per session?
5. **Tool Execution:** Should agent tools execute automatically or require user confirmation?
6. **Pricing:** Free tier limits? Usage caps per user?

## Future Enhancements

- **Agent Suggestions:** Proactively suggest agent when errors detected
- **Agent Actions:** Allow agent to restart workloads, update config, etc.
- **Multi-Workload Context:** Compare deployments, analyze trends
- **Voice Interface:** Voice input/output for hands-free debugging
- **Agent Memory:** Remember user preferences, common issues across sessions
- **Collaborative Chat:** Multiple users in same agent session
- **Agent Handoff:** Transfer session to human support if needed

## Related Documentation

- [DeploymentDashboard.tsx](../src/services/agentforge-ui/components/DeploymentDashboard.tsx) - Current workload UI
- [useDeploymentStream.ts](../src/services/agentforge-ui/hooks/useDeploymentStream.ts) - SSE pattern reference
- [workload-orchestrator](../src/services/workload-orchestrator/) - Workload lifecycle management
- [LogViewer.tsx](../src/services/agentforge-ui/components/LogViewer.tsx) - Existing log viewing implementation

## Appendix: Example Interactions

### Example 1: Error Diagnosis

**User:** Why did my deployment fail?

**Agent:** Looking at your logs, I can see the container failed during the `starting-service` stage.

The error is:
```
Error: Cannot find module 'express'
```

This indicates a missing dependency. The build process completed successfully, but the runtime environment is missing the Express package.

**Suggested Fix:**
1. Add `express` to your `package.json` dependencies
2. Ensure `yarn install` or `npm install` runs during build
3. Verify your `Dockerfile` includes the install step

Would you like me to search for other missing dependencies?

### Example 2: Log Analysis

**User:** Show me all errors from the last 5 minutes

**Agent:** I found 3 errors in the last 5 minutes:

**[14:32:41]** `ERROR: Connection timeout to database`
**[14:33:15]** `ERROR: Retry failed after 3 attempts`
**[14:35:02]** `ERROR: Service unhealthy, shutting down`

It looks like your service couldn't connect to the database, retried 3 times, then shut down. This suggests a network or configuration issue with your database connection string.

Check your `DATABASE_URL` environment variable.

### Example 3: Status Explanation

**User:** What does "graceful-shutdown" mean?

**Agent:** The `graceful-shutdown` stage means your workload is stopping in a controlled way:

1. The system sends a SIGTERM signal to your container
2. Your application has 10 seconds to finish current requests
3. Open connections are closed cleanly
4. The container exits with code 0

This is normal when you manually stop a workload or when the system detects it needs to restart.

Your workload transitioned to this stage 30 seconds ago and should complete soon.