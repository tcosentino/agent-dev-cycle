import type { OpenAPIHono } from '@hono/zod-openapi'
import type { IntegrationService, IntegrationContext } from '../../../packages/server/src/types'
import { streamSSE } from 'hono/streaming'
import { orchestrator } from '../workload-orchestrator'
import { workloadEvents } from '../workload-orchestrator/events'

export const workloadIntegration: IntegrationService = {
  name: 'workload-operations',
  version: '1.0.0',

  register(app: OpenAPIHono, ctx: IntegrationContext) {
    // Inject workload store into orchestrator
    const workloadStore = ctx.stores.get('workload')
    if (!workloadStore) {
      console.error('[WorkloadIntegration] Workload store not found - workload operations will not work')
      return
    }

    const deploymentStore = ctx.stores.get('deployment')
    if (!deploymentStore) {
      console.error('[WorkloadIntegration] Deployment store not found - workload operations will not work')
      return
    }

    console.log('[WorkloadIntegration] Configuring orchestrator with stores')

    orchestrator.setWorkloadStore(workloadStore)
    orchestrator.setDeploymentStore(deploymentStore)

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

        // Verify project has a repoUrl
        if (!project.repoUrl) {
          return c.json({ error: 'Project must have a repoUrl configured' }, 400)
        }

        // Start the workload (will clone the repo)
        await orchestrator.start(workloadId, project.repoUrl)

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

    // GET /api/projects/:projectId/deployments/stream - SSE stream for deployment updates
    app.get('/api/projects/:projectId/deployments/stream', async (c) => {
      const { projectId } = c.req.param()

      const deploymentStore = ctx.stores.get('deployment')
      if (!deploymentStore) {
        return c.json({ error: 'Deployment store not found' }, 500)
      }

      return streamSSE(c, async (stream) => {
        try {
          // Send initial data
          const deployments = await deploymentStore.findAll({
            where: { projectId }
          }) as any[]

          // Fetch workloads for each deployment
          const deploymentsWithWorkloads = await Promise.all(
            deployments.map(async (deployment) => {
              const workloads = await workloadStore.findAll({
                where: { deploymentId: deployment.id }
              }) as any[]

              // Ensure logs field is never null (handle database null values)
              const normalizedWorkloads = workloads.map(w => ({
                ...w,
                logs: Array.isArray(w.logs) ? w.logs : []
              }))

              return {
                ...deployment,
                workloads: normalizedWorkloads
              }
            })
          )

          await stream.writeSSE({
            event: 'init',
            data: JSON.stringify({
              type: 'init',
              deployments: deploymentsWithWorkloads
            })
          })

          // Listen for workload updates
          const updateListener = async (update: any) => {
            // Only send updates for this project
            if (update.projectId === projectId) {
              await stream.writeSSE({
                event: 'workload-update',
                data: JSON.stringify({
                  type: 'workload-update',
                  update
                })
              })
            }
          }

          workloadEvents.onWorkloadUpdate(updateListener)

          // Keep connection alive and check if client disconnected
          const keepAliveInterval = setInterval(async () => {
            try {
              await stream.writeSSE({
                event: 'ping',
                data: JSON.stringify({ type: 'ping' })
              })
            } catch (err) {
              clearInterval(keepAliveInterval)
              workloadEvents.offWorkloadUpdate(updateListener)
            }
          }, 15000) // Ping every 15 seconds

          // Listen for deployment deletions
          const deleteListener = async (event: any) => {
            // Only send updates for this project
            if (event.projectId === projectId) {
              await stream.writeSSE({
                event: 'deployment-deleted',
                data: JSON.stringify({
                  type: 'deployment-deleted',
                  deploymentId: event.deploymentId
                })
              })
            }
          }

          workloadEvents.onDeploymentDeleted(deleteListener)

          // Wait for client disconnect
          c.req.raw.signal.addEventListener('abort', () => {
            clearInterval(keepAliveInterval)
            workloadEvents.offWorkloadUpdate(updateListener)
            workloadEvents.offDeploymentDeleted(deleteListener)
          })

        } catch (error) {
          console.error('Error in deployment stream:', error)
        }
      })
    })

    // DELETE /api/deployments/:id - Delete a deployment and emit event
    app.delete('/api/deployments/:id', async (c) => {
      const deploymentId = c.req.param('id')

      const deploymentStore = ctx.stores.get('deployment')
      const workloadStore = ctx.stores.get('workload')
      if (!deploymentStore) {
        return c.json({ error: 'Deployment store not found' }, 500)
      }
      if (!workloadStore) {
        return c.json({ error: 'Workload store not found' }, 500)
      }

      try {
        // Get deployment to find projectId before deleting
        const deployment = await deploymentStore.findById(deploymentId) as any
        if (!deployment) {
          return c.json({ error: 'Deployment not found' }, 404)
        }

        const projectId = deployment.projectId

        // Find all workloads for this deployment
        const allWorkloads = await workloadStore.findAll() as any[]
        const workloadsToDelete = allWorkloads.filter((w: any) => w.deploymentId === deploymentId)

        console.log(`[WorkloadIntegration] Deleting deployment ${deploymentId} with ${workloadsToDelete.length} workloads`)

        // Stop and delete each workload's container
        for (const workload of workloadsToDelete) {
          console.log(`[WorkloadIntegration] Cleaning up workload ${workload.id}`)

          // Force cleanup any containers, images, and resources
          try {
            await orchestrator.forceCleanup(workload.id)
            console.log(`[WorkloadIntegration] Cleaned up workload ${workload.id}`)
          } catch (error) {
            console.error(`[WorkloadIntegration] Failed to cleanup workload ${workload.id}:`, error)
            // Continue with deletion even if cleanup fails
          }

          // Delete the workload record
          await workloadStore.delete(workload.id)
          console.log(`[WorkloadIntegration] Deleted workload ${workload.id}`)
        }

        // Delete the deployment
        await deploymentStore.delete(deploymentId)

        // Emit deployment deleted event
        workloadEvents.emitDeploymentDeleted({
          deploymentId,
          projectId
        })

        return c.json({ success: true })
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error'
        return c.json({
          error: 'Failed to delete deployment',
          message
        }, 500)
      }
    })

    console.log('Registered workload operations endpoints')
  }
}
