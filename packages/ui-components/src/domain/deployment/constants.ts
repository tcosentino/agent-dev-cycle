/**
 * Deployment domain constants
 *
 * These constants define deployment status health mapping.
 * Extracted from DeploymentStatusBadge.
 */

export type DeploymentStatus = 'pending' | 'running' | 'success' | 'failed' | 'stopped'
export type HealthStatus = 'healthy' | 'unavailable' | 'unknown'

// Deployment status to health status mapping
export const DEPLOYMENT_HEALTH_MAP: Record<DeploymentStatus, HealthStatus> = {
  success: 'healthy',
  running: 'healthy',
  failed: 'unavailable',
  stopped: 'unavailable',
  pending: 'unknown'
}

// Health status labels
export const HEALTH_STATUS_LABELS: Record<HealthStatus, string> = {
  healthy: 'Healthy',
  unavailable: 'Unavailable',
  unknown: 'Unknown'
}
