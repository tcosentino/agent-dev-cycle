import type { OpenAPIHono } from '@hono/zod-openapi'
import type { IntegrationService, IntegrationContext } from '../../../packages/server/src/types'
import { orchestrator } from '../workload-orchestrator'
import { z } from 'zod'
import { resolve } from 'path'

export const workloadIntegration: IntegrationService = {
  name: 'workload-operations',
  version: '1.0.0',

  register(app: OpenAPIHono, ctx: IntegrationContext) {
    // Inject workload store into orchestrator
    const workloadStore = ctx.stores.get('workload')
    if (!workloadStore) {
      console.error('Workload store not found - workload operations will not work')
      return
    }

    console.log('Workload store type:', typeof workloadStore)
    console.log('Workload store has get:', typeof workloadStore.findById)

    orchestrator.setWorkloadStore(workloadStore)

    // POST /api/workloads/:id/start - Start a workload
    app.post('/api/workloads/:id/start', async (c) => {
      const workloadId = c.req.param('id')

      try {
        // Get the workload to find the project path
        const workload = await workloadStore.findById(workloadId) as any
        if (!workload) {
          return c.json({ error: 'Workload not found' }, 404)
        }

        // Get the deployment to find the project
        const deploymentStore = ctx.stores.get('deployment')
        if (!deploymentStore) {
          return c.json({ error: 'Deployment store not found' }, 500)
        }

        const deployment = await deploymentStore.findById(workload.deploymentId) as any
        if (!deployment) {
          return c.json({ error: 'Deployment not found' }, 404)
        }

        // Get the project to find the repo path
        const projectStore = ctx.stores.get('project')
        if (!projectStore) {
          return c.json({ error: 'Project store not found' }, 500)
        }

        const project = await projectStore.findById(deployment.projectId) as any
        if (!project) {
          return c.json({ error: 'Project not found' }, 404)
        }

        // Determine project path
        // For now, assume projects are in examples/ directory
        // In production, this would be a cloned git repo
        // Go up to project root from packages/server
        const projectRoot = resolve(process.cwd(), '..', '..')
        const projectPath = resolve(projectRoot, 'examples', project.name.toLowerCase().replace(/\s+/g, '-'))

        // Start the workload
        await orchestrator.start(workloadId, projectPath)

        return c.json({
          success: true,
          message: 'Workload started successfully',
          workloadId
        })
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error'
        return c.json({
          error: 'Failed to start workload',
          message
        }, 500)
      }
    })

    // POST /api/workloads/:id/stop - Stop a workload
    app.post('/api/workloads/:id/stop', async (c) => {
      const workloadId = c.req.param('id')

      try {
        await orchestrator.stop(workloadId)
        return c.json({
          success: true,
          message: 'Workload stopped successfully',
          workloadId
        })
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error'
        return c.json({
          error: 'Failed to stop workload',
          message
        }, 500)
      }
    })

    // GET /api/workloads/:id/status - Get workload runtime status
    app.get('/api/workloads/:id/status', async (c) => {
      const workloadId = c.req.param('id')

      try {
        const status = await orchestrator.getStatus(workloadId)
        return c.json(status)
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error'
        return c.json({
          error: 'Failed to get workload status',
          message
        }, 500)
      }
    })

    // GET /api/workloads/:id/logs - Get workload logs
    app.get('/api/workloads/:id/logs', async (c) => {
      const workloadId = c.req.param('id')

      try {
        const logs = await orchestrator.getLogs(workloadId)
        return c.json({ logs })
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error'
        return c.json({
          error: 'Failed to get workload logs',
          message
        }, 500)
      }
    })

    console.log('Registered workload operations endpoints')
  }
}
