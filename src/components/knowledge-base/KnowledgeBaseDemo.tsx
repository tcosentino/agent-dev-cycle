import { useState } from 'react'
import { KnowledgeBase } from './KnowledgeBase'
import type { KnowledgeEntry, KnowledgeCategory, KnowledgeBaseState } from './types'

// Example research data showing what agents discovered during development
const exampleEntries: KnowledgeEntry[] = [
  {
    id: 'kb-1',
    category: 'codebase',
    title: 'Database uses PostgreSQL with Drizzle ORM',
    summary: 'The existing codebase uses PostgreSQL with Drizzle ORM for type-safe database access. Schema is defined in src/db/schema.ts with migrations in drizzle/ directory.',
    recordedBy: 'engineer',
    timestamp: Date.now() - 3600000, // 1 hour ago
    tags: ['database', 'drizzle', 'postgres'],
    relatedTasks: ['BAAP-1']
  },
  {
    id: 'kb-2',
    category: 'external',
    title: 'Stripe API rate limits',
    summary: 'Stripe API has rate limits of 100 requests/second in live mode. For bulk operations, use batch endpoints or implement exponential backoff. Webhook signature verification required for security.',
    source: 'https://stripe.com/docs/rate-limits',
    recordedBy: 'engineer',
    timestamp: Date.now() - 7200000, // 2 hours ago
    tags: ['stripe', 'api', 'rate-limits'],
    relatedTasks: ['BAAP-4']
  },
  {
    id: 'kb-3',
    category: 'decision',
    title: 'Chose REST over GraphQL for inventory API',
    summary: 'Selected REST for the inventory API because: (1) simpler caching with standard HTTP caching, (2) existing team familiarity, (3) straightforward CRUD operations dont benefit much from GraphQL flexibility.',
    recordedBy: 'lead',
    timestamp: Date.now() - 10800000, // 3 hours ago
    tags: ['api', 'architecture'],
    relatedTasks: ['BAAP-2']
  },
  {
    id: 'kb-4',
    category: 'blocker',
    title: 'Resolved: CORS issue with inventory service',
    summary: 'Cross-origin requests were failing due to missing CORS headers. Fixed by adding cors middleware in Express with specific origin whitelist. Production will need environment-based config.',
    recordedBy: 'engineer',
    timestamp: Date.now() - 14400000, // 4 hours ago
    tags: ['cors', 'api', 'resolved']
  },
  {
    id: 'kb-5',
    category: 'external',
    title: 'PostgreSQL full-text search patterns',
    summary: 'PostgreSQL supports full-text search via tsvector/tsquery. For product search, GIN indexes on tsvector columns provide fast lookups. Consider using pg_trgm extension for fuzzy matching on product names.',
    source: 'https://www.postgresql.org/docs/current/textsearch.html',
    recordedBy: 'engineer',
    timestamp: Date.now() - 18000000, // 5 hours ago
    tags: ['postgres', 'search', 'performance']
  },
  {
    id: 'kb-6',
    category: 'codebase',
    title: 'Authentication uses NextAuth with JWT strategy',
    summary: 'Auth is handled via NextAuth.js with JWT strategy for stateless sessions. Providers configured: credentials, Google OAuth. Session data available via useSession hook or getServerSession.',
    recordedBy: 'engineer',
    timestamp: Date.now() - 21600000, // 6 hours ago
    tags: ['auth', 'nextauth', 'jwt']
  },
  {
    id: 'kb-7',
    category: 'decision',
    title: 'Stock alerts via email, not push notifications',
    summary: 'Decided to implement low-stock alerts via email rather than push notifications for MVP. Reasoning: (1) email is universally accessible, (2) no additional infrastructure needed, (3) customers check inventory status during business hours anyway.',
    recordedBy: 'pm',
    timestamp: Date.now() - 25200000, // 7 hours ago
    tags: ['notifications', 'mvp'],
    relatedTasks: ['BAAP-4']
  },
  {
    id: 'kb-8',
    category: 'external',
    title: 'SendGrid transactional email limits',
    summary: 'SendGrid free tier allows 100 emails/day. Paid plans start at $15/month for 50k emails. For alert system, need to batch notifications to avoid hitting limits. Consider daily digest approach.',
    source: 'https://sendgrid.com/pricing',
    recordedBy: 'engineer',
    timestamp: Date.now() - 28800000, // 8 hours ago
    tags: ['email', 'sendgrid', 'pricing']
  }
]

interface KnowledgeBaseDemoProps {
  autoPlay?: boolean
}

export function KnowledgeBaseDemo({ autoPlay: _autoPlay = false }: KnowledgeBaseDemoProps) {
  const [state, setState] = useState<KnowledgeBaseState>({
    entries: exampleEntries,
    activeCategory: undefined,
    searchQuery: ''
  })

  const handleCategorySelect = (category: KnowledgeCategory | undefined) => {
    setState(prev => ({ ...prev, activeCategory: category }))
  }

  const handleSearch = (query: string) => {
    setState(prev => ({ ...prev, searchQuery: query }))
  }

  return (
    <div style={{ height: 600 }}>
      <KnowledgeBase
        state={state}
        onCategorySelect={handleCategorySelect}
        onSearch={handleSearch}
      />
    </div>
  )
}
