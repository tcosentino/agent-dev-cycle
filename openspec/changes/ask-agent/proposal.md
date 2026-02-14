## Why

Users debugging deployments currently need to manually sift through logs, interpret error messages, and understand workload states without assistance. This is time-consuming and requires deep knowledge of the system.

An AI agent with full context about a specific workload could:
- Answer questions about why a deployment failed
- Search and analyze logs intelligently
- Explain error patterns and suggest fixes
- Provide actionable debugging steps
- Reduce time from problem detection to resolution

This makes AgentForge more accessible to users unfamiliar with Docker, deployment pipelines, or log analysis, while also speeding up debugging for experienced users.

## What Changes

Add an "Ask an Agent" capability to workload detail pages that spawns a contextual AI chat interface. The agent has access to:
- Workload state (status, stage, timestamps)
- Deployment metadata (project, repo, branch, commit)
- Container logs (searchable)
- Health check results
- Project configuration

### User Flow

1. User views workload detail page
2. Clicks "Ask an Agent" button
3. Chat modal opens with agent introduction and workload summary
4. User asks questions in natural language
5. Agent searches logs, analyzes state, provides insights
6. Chat session persists until closed

### Key Features

- **Contextual Initialization:** Agent receives full workload context on startup
- **Log Search Tool:** Agent can search logs with filters (keywords, time range)
- **Real-time Streaming:** Responses stream via SSE for immediate feedback
- **Chat Persistence:** Session history stored and retrievable
- **Code Rendering:** Markdown and syntax-highlighted code blocks
- **Actionable Insights:** Agent provides specific fixes, not just explanations

## Capabilities

### New Capabilities
- `agent-chat`: Start chat sessions, send messages, stream responses
- `agent-log-search`: Agent tool for searching workload logs
- `agent-workload-analysis`: Agent tool for analyzing workload state

### Modified Capabilities
- `workload-detail-view`: Add "Ask an Agent" button to action bar
- `log-viewer`: Agent can reference and link to specific log lines

## Impacts

### User Experience
- **Faster Debugging:** Reduce time to diagnose issues from minutes to seconds
- **Lower Barrier:** Users without Docker/ops experience can debug effectively
- **Contextual Help:** Agent knows the specific workload, no need to explain context

### Technical
- **New Dependencies:** Anthropic SDK, streaming infrastructure
- **API Costs:** Claude API usage per session (monitor and rate-limit)
- **Storage:** Chat history persistence (SQLite via DataObject)
- **Performance:** SSE connections per active chat (consider limits)

### Security
- **Data Privacy:** Logs may contain sensitive info (implement redaction)
- **API Key Management:** Secure storage and rotation
- **Rate Limiting:** Prevent abuse, control costs
- **Access Control:** Only project members can access agent for their workloads

## Open Questions

1. **Model Selection:** Sonnet 4.5 for quality vs Haiku for cost?
2. **Context Size:** How many log lines to include initially? (500? 1000? dynamic?)
3. **Session Lifecycle:** One agent per workload (persistent) or per chat session?
4. **Tool Autonomy:** Should agent execute searches automatically or ask first?
5. **Cost Management:** Free tier limits? Usage caps per user/project?
6. **Multi-Workload:** Should agent be able to compare across deployments?

## Success Metrics

- **Adoption:** % of workload views that trigger "Ask an Agent"
- **Engagement:** Average messages per session
- **Effectiveness:** % of sessions where user finds resolution without viewing raw logs
- **Time Savings:** Average time from workload view to issue resolution
- **Cost Efficiency:** API costs per session, per resolved issue

## Future Enhancements

- **Proactive Suggestions:** Agent button highlights when errors detected
- **Agent Actions:** Let agent restart workloads, update configs (with approval)
- **Cross-Workload Analysis:** Compare deployments, identify patterns
- **Agent Memory:** Remember user preferences and project patterns across sessions
- **Collaborative Chat:** Multiple users in same agent session for pair debugging
