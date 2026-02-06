import { useMemo } from 'react'
import type { SystemNode, Connection, DataPulse } from './types'
import styles from './ConnectionLines.module.css'

interface ConnectionLinesProps {
  nodes: SystemNode[]
  connections: Connection[]
  pulses: DataPulse[]
}

interface Point {
  x: number
  y: number
}

function getNodeCenter(node: SystemNode): Point {
  return { x: node.position.x, y: node.position.y }
}

function generateCurvePath(from: Point, to: Point): string {
  // Determine curve direction based on relative positions
  const dx = to.x - from.x
  const dy = to.y - from.y

  // For horizontal-ish connections, curve vertically
  // For vertical-ish connections, curve horizontally
  const isHorizontal = Math.abs(dx) > Math.abs(dy)

  let cp1x: number, cp1y: number, cp2x: number, cp2y: number

  if (isHorizontal) {
    cp1x = from.x + dx * 0.4
    cp1y = from.y
    cp2x = to.x - dx * 0.4
    cp2y = to.y
  } else {
    cp1x = from.x
    cp1y = from.y + dy * 0.4
    cp2x = to.x
    cp2y = to.y - dy * 0.4
  }

  return `M ${from.x} ${from.y} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${to.x} ${to.y}`
}

function getPointOnPath(path: string, progress: number): Point {
  // Parse the cubic bezier path
  const match = path.match(/M ([\d.]+) ([\d.]+) C ([\d.]+) ([\d.]+), ([\d.]+) ([\d.]+), ([\d.]+) ([\d.]+)/)
  if (!match) return { x: 0, y: 0 }

  const [, x0, y0, x1, y1, x2, y2, x3, y3] = match.map(Number)
  const t = progress

  // Cubic bezier formula
  const x = Math.pow(1 - t, 3) * x0 +
            3 * Math.pow(1 - t, 2) * t * x1 +
            3 * (1 - t) * Math.pow(t, 2) * x2 +
            Math.pow(t, 3) * x3

  const y = Math.pow(1 - t, 3) * y0 +
            3 * Math.pow(1 - t, 2) * t * y1 +
            3 * (1 - t) * Math.pow(t, 2) * y2 +
            Math.pow(t, 3) * y3

  return { x, y }
}

export function ConnectionLines({ nodes, connections, pulses }: ConnectionLinesProps) {
  const nodeMap = useMemo(() => {
    const map = new Map<string, SystemNode>()
    nodes.forEach(node => map.set(node.id, node))
    return map
  }, [nodes])

  const paths = useMemo(() => {
    return connections.map(conn => {
      const fromNode = nodeMap.get(conn.from)
      const toNode = nodeMap.get(conn.to)
      if (!fromNode || !toNode) return null

      const from = getNodeCenter(fromNode)
      const to = getNodeCenter(toNode)
      const path = generateCurvePath(from, to)

      return {
        connection: conn,
        path,
        from,
        to
      }
    }).filter(Boolean)
  }, [connections, nodeMap])

  const pulsePositions = useMemo(() => {
    return pulses.map(pulse => {
      const pathData = paths.find(p => p?.connection.id === pulse.connectionId)
      if (!pathData) return null

      const position = getPointOnPath(pathData.path, pulse.progress)
      return {
        pulse,
        position
      }
    }).filter(Boolean)
  }, [pulses, paths])

  return (
    <svg className={styles.svg} viewBox="0 0 100 100" preserveAspectRatio="none">
      <defs>
        {/* Gradient for active connections */}
        <linearGradient id="activeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="var(--accent-tertiary)" stopOpacity="0.2" />
          <stop offset="50%" stopColor="var(--accent-tertiary)" stopOpacity="0.6" />
          <stop offset="100%" stopColor="var(--accent-tertiary)" stopOpacity="0.2" />
        </linearGradient>

        {/* Glow filter for pulses */}
        <filter id="pulseGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="0.3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* Pulse colors by type */}
        <radialGradient id="contactPulse">
          <stop offset="0%" stopColor="#10b981" />
          <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
        </radialGradient>

        <radialGradient id="companyPulse">
          <stop offset="0%" stopColor="#0ea5e9" />
          <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0" />
        </radialGradient>

        <radialGradient id="ticketPulse">
          <stop offset="0%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
        </radialGradient>

        <radialGradient id="opportunityPulse">
          <stop offset="0%" stopColor="#ec4899" />
          <stop offset="100%" stopColor="#ec4899" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Connection lines */}
      {paths.map((pathData) => {
        if (!pathData) return null
        const { connection, path } = pathData
        const isActive = connection.active

        return (
          <g key={connection.id}>
            {/* Base line */}
            <path
              d={path}
              className={`${styles.connectionLine} ${isActive ? styles.active : ''}`}
              fill="none"
            />

            {/* Active glow overlay */}
            {isActive && (
              <path
                d={path}
                className={styles.connectionGlow}
                fill="none"
              />
            )}
          </g>
        )
      })}

      {/* Data pulses */}
      {pulsePositions.map((data) => {
        if (!data) return null
        const { pulse, position } = data
        const gradientId = `${pulse.type || 'contact'}Pulse`

        return (
          <g key={pulse.id} filter="url(#pulseGlow)">
            {/* Outer glow */}
            <circle
              cx={position.x}
              cy={position.y}
              r="1.5"
              fill={`url(#${gradientId})`}
              className={styles.pulseOuter}
            />
            {/* Inner core */}
            <circle
              cx={position.x}
              cy={position.y}
              r="0.5"
              className={`${styles.pulseCore} ${styles[pulse.type || 'contact']}`}
            />
          </g>
        )
      })}
    </svg>
  )
}
