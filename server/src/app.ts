import { OpenAPIHono } from '@hono/zod-openapi'
import { cors } from 'hono/cors'
import { projectRoutes } from './routes/projects'
import { taskRoutes } from './routes/tasks'
import { channelRoutes } from './routes/channels'
import { messageRoutes } from './routes/messages'
import { agentStatusRoutes } from './routes/agent-status'
import { sessionRoutes } from './routes/sessions'

export const app = new OpenAPIHono()

app.use('*', cors())

app.route('/api/projects', projectRoutes)
app.route('/api/tasks', taskRoutes)
app.route('/api/channels', channelRoutes)
app.route('/api/messages', messageRoutes)
app.route('/api/agent-status', agentStatusRoutes)
app.route('/api/sessions', sessionRoutes)

app.doc('/api/doc', {
  openapi: '3.1.0',
  info: {
    title: 'AgentForge API',
    version: '0.1.0',
    description: 'CRUD API for AgentForge project management',
  },
})
