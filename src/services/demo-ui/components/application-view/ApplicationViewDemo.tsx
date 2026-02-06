import { useStoryPlayer, type Story } from '../../hooks'
import { ApplicationView } from './ApplicationView'
import type { ApplicationViewState, SystemNode, Connection } from './types'

// Initial node layout for HubSpot <-> ConnectWise integration
const nodes: SystemNode[] = [
  // Source: HubSpot (left side)
  {
    id: 'hubspot',
    label: 'HubSpot',
    sublabel: 'CRM',
    type: 'source',
    status: 'idle',
    icon: 'hubspot',
    position: { x: 15, y: 30 }
  },
  {
    id: 'hubspot-contacts',
    label: 'Contacts',
    sublabel: 'Webhook',
    type: 'source',
    status: 'idle',
    icon: 'queue',
    position: { x: 15, y: 60 }
  },

  // Transform layer (center)
  {
    id: 'sync-engine',
    label: 'Sync Engine',
    sublabel: 'Orchestrator',
    type: 'orchestrator',
    status: 'idle',
    icon: 'sync',
    position: { x: 50, y: 30 }
  },
  {
    id: 'field-mapper',
    label: 'Field Mapper',
    sublabel: 'Transform',
    type: 'transform',
    status: 'idle',
    icon: 'transform',
    position: { x: 50, y: 60 }
  },
  {
    id: 'data-store',
    label: 'Sync State',
    sublabel: 'Database',
    type: 'transform',
    status: 'idle',
    icon: 'database',
    position: { x: 50, y: 85 }
  },

  // Destination: ConnectWise (right side)
  {
    id: 'connectwise',
    label: 'ConnectWise',
    sublabel: 'PSA',
    type: 'destination',
    status: 'idle',
    icon: 'connectwise',
    position: { x: 85, y: 30 }
  },
  {
    id: 'cw-companies',
    label: 'Companies',
    sublabel: 'API',
    type: 'destination',
    status: 'idle',
    icon: 'queue',
    position: { x: 85, y: 60 }
  }
]

// Connections between nodes
const connections: Connection[] = [
  { id: 'hub-to-sync', from: 'hubspot', to: 'sync-engine' },
  { id: 'contacts-to-mapper', from: 'hubspot-contacts', to: 'field-mapper' },
  { id: 'sync-to-cw', from: 'sync-engine', to: 'connectwise' },
  { id: 'mapper-to-companies', from: 'field-mapper', to: 'cw-companies' },
  { id: 'sync-to-db', from: 'sync-engine', to: 'data-store' },
  { id: 'mapper-to-db', from: 'field-mapper', to: 'data-store' }
]

// Helper to update node status
const setNodeStatus = (nodeId: string, status: SystemNode['status']) =>
  (state: ApplicationViewState): ApplicationViewState => ({
    ...state,
    nodes: state.nodes.map(n => n.id === nodeId ? { ...n, status } : n)
  })

// Helper to set connection active
const setConnectionActive = (connId: string, active: boolean) =>
  (state: ApplicationViewState): ApplicationViewState => ({
    ...state,
    connections: state.connections.map(c => c.id === connId ? { ...c, active } : c)
  })

// Helper to add a pulse
const addPulse = (id: string, connectionId: string, type: 'contact' | 'company' | 'ticket' | 'opportunity') =>
  (state: ApplicationViewState): ApplicationViewState => ({
    ...state,
    pulses: [...state.pulses, { id, connectionId, progress: 0, type }]
  })

// Helper to update pulse progress
const updatePulse = (id: string, progress: number) =>
  (state: ApplicationViewState): ApplicationViewState => ({
    ...state,
    pulses: state.pulses.map(p => p.id === id ? { ...p, progress } : p)
  })

// Helper to remove pulse
const removePulse = (id: string) =>
  (state: ApplicationViewState): ApplicationViewState => ({
    ...state,
    pulses: state.pulses.filter(p => p.id !== id)
  })

// Helper to set sync status
const setSyncStatus = (status: ApplicationViewState['syncStatus']) =>
  (state: ApplicationViewState): ApplicationViewState => ({
    ...state,
    syncStatus: status
  })

// Combine multiple state updates
const combine = (...fns: Array<(s: ApplicationViewState) => ApplicationViewState>) =>
  (state: ApplicationViewState): ApplicationViewState =>
    fns.reduce((s, fn) => fn(s), state)

// The sync story animation
const syncStory: Story<ApplicationViewState> = {
  initialState: {
    nodes,
    connections,
    pulses: [],
    syncStatus: { lastSync: '', recordsProcessed: 0, status: 'idle' }
  },
  steps: [
    // Start sync - activate HubSpot
    {
      delay: 500,
      state: combine(
        setNodeStatus('hubspot', 'active'),
        setSyncStatus({ lastSync: '', recordsProcessed: 0, status: 'running' })
      )
    },

    // HubSpot sends data to sync engine
    {
      delay: 1000,
      state: combine(
        setConnectionActive('hub-to-sync', true),
        addPulse('p1', 'hub-to-sync', 'company'),
        setNodeStatus('sync-engine', 'syncing')
      )
    },
    { delay: 1200, state: updatePulse('p1', 0.3) },
    { delay: 1400, state: updatePulse('p1', 0.6) },
    { delay: 1600, state: updatePulse('p1', 0.9) },
    {
      delay: 1800,
      state: combine(
        removePulse('p1'),
        setNodeStatus('sync-engine', 'active')
      )
    },

    // Sync engine sends to ConnectWise
    {
      delay: 2000,
      state: combine(
        setConnectionActive('sync-to-cw', true),
        addPulse('p2', 'sync-to-cw', 'company'),
        setNodeStatus('connectwise', 'syncing')
      )
    },
    { delay: 2200, state: updatePulse('p2', 0.3) },
    { delay: 2400, state: updatePulse('p2', 0.6) },
    { delay: 2600, state: updatePulse('p2', 0.9) },
    {
      delay: 2800,
      state: combine(
        removePulse('p2'),
        setNodeStatus('connectwise', 'active'),
        setSyncStatus({ lastSync: '', recordsProcessed: 12, status: 'running' })
      )
    },

    // Contacts sync flow starts
    {
      delay: 3200,
      state: combine(
        setNodeStatus('hubspot-contacts', 'active'),
        setConnectionActive('contacts-to-mapper', true),
        addPulse('p3', 'contacts-to-mapper', 'contact'),
        setNodeStatus('field-mapper', 'syncing')
      )
    },
    { delay: 3400, state: updatePulse('p3', 0.3) },
    { delay: 3600, state: updatePulse('p3', 0.6) },
    { delay: 3800, state: updatePulse('p3', 0.9) },
    {
      delay: 4000,
      state: combine(
        removePulse('p3'),
        setNodeStatus('field-mapper', 'active')
      )
    },

    // Field mapper stores to database
    {
      delay: 4200,
      state: combine(
        setConnectionActive('mapper-to-db', true),
        addPulse('p4', 'mapper-to-db', 'contact'),
        setNodeStatus('data-store', 'syncing')
      )
    },
    { delay: 4400, state: updatePulse('p4', 0.4) },
    { delay: 4600, state: updatePulse('p4', 0.8) },
    {
      delay: 4800,
      state: combine(
        removePulse('p4'),
        setNodeStatus('data-store', 'active'),
        setSyncStatus({ lastSync: '', recordsProcessed: 47, status: 'running' })
      )
    },

    // Field mapper sends to ConnectWise companies
    {
      delay: 5000,
      state: combine(
        setConnectionActive('mapper-to-companies', true),
        addPulse('p5', 'mapper-to-companies', 'contact'),
        setNodeStatus('cw-companies', 'syncing')
      )
    },
    { delay: 5200, state: updatePulse('p5', 0.3) },
    { delay: 5400, state: updatePulse('p5', 0.6) },
    { delay: 5600, state: updatePulse('p5', 0.9) },
    {
      delay: 5800,
      state: combine(
        removePulse('p5'),
        setNodeStatus('cw-companies', 'active'),
        setSyncStatus({ lastSync: '', recordsProcessed: 89, status: 'running' })
      )
    },

    // Another round of data
    {
      delay: 6200,
      state: combine(
        addPulse('p6', 'hub-to-sync', 'opportunity'),
        addPulse('p7', 'contacts-to-mapper', 'contact')
      )
    },
    {
      delay: 6400,
      state: combine(
        updatePulse('p6', 0.3),
        updatePulse('p7', 0.4)
      )
    },
    {
      delay: 6600,
      state: combine(
        updatePulse('p6', 0.6),
        updatePulse('p7', 0.7)
      )
    },
    {
      delay: 6800,
      state: combine(
        updatePulse('p6', 0.95),
        updatePulse('p7', 1)
      )
    },
    {
      delay: 7000,
      state: combine(
        removePulse('p6'),
        removePulse('p7'),
        setSyncStatus({ lastSync: '', recordsProcessed: 124, status: 'running' })
      )
    },

    // Final pulses through the system
    {
      delay: 7200,
      state: combine(
        addPulse('p8', 'sync-to-cw', 'opportunity'),
        addPulse('p9', 'mapper-to-companies', 'contact')
      )
    },
    {
      delay: 7400,
      state: combine(
        updatePulse('p8', 0.4),
        updatePulse('p9', 0.3)
      )
    },
    {
      delay: 7600,
      state: combine(
        updatePulse('p8', 0.8),
        updatePulse('p9', 0.7)
      )
    },
    {
      delay: 7800,
      state: combine(
        removePulse('p8'),
        removePulse('p9')
      )
    },

    // Complete - all nodes active, sync done
    {
      delay: 8200,
      state: combine(
        setConnectionActive('hub-to-sync', false),
        setConnectionActive('sync-to-cw', false),
        setConnectionActive('contacts-to-mapper', false),
        setConnectionActive('mapper-to-db', false),
        setConnectionActive('mapper-to-companies', false),
        setSyncStatus({ lastSync: 'Just now', recordsProcessed: 156, status: 'completed' })
      )
    },

    // Fade to idle state
    {
      delay: 9500,
      state: combine(
        setNodeStatus('hubspot', 'idle'),
        setNodeStatus('hubspot-contacts', 'idle'),
        setNodeStatus('sync-engine', 'idle'),
        setNodeStatus('field-mapper', 'idle'),
        setNodeStatus('data-store', 'idle'),
        setNodeStatus('connectwise', 'idle'),
        setNodeStatus('cw-companies', 'idle'),
        setSyncStatus({ lastSync: 'Just now', recordsProcessed: 156, status: 'idle' })
      )
    }
  ]
}

interface ApplicationViewDemoProps {
  autoPlay?: boolean
  loop?: boolean
  loopDelay?: number
}

export function ApplicationViewDemo({
  autoPlay = false,
  loop = false,
  loopDelay = 3000
}: ApplicationViewDemoProps) {
  const { state } = useStoryPlayer(syncStory, { autoPlay, loop, loopDelay })

  return (
    <ApplicationView
      state={state}
      title="HubSpot - ConnectWise Sync"
      subtitle="Integration Pipeline"
    />
  )
}
