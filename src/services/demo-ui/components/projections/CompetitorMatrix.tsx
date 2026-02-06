import type { Competitor } from './types'

const competitors: Competitor[] = [
  {
    id: 'agentforge',
    name: 'AgentForge',
    price: '$10K-75K/project',
    timeline: '1-6 weeks',
    customization: 'Full custom code',
    targetCustomer: 'SMBs needing custom apps',
    highlight: true
  },
  {
    id: 'devin',
    name: 'Devin',
    price: '$20/mo + usage',
    timeline: 'Variable',
    customization: 'Code generation',
    targetCustomer: 'Developers'
  },
  {
    id: 'traditional',
    name: 'Traditional Agency',
    price: '$50K-500K/project',
    timeline: '3-12 months',
    customization: 'Full custom',
    targetCustomer: 'Enterprise & funded startups'
  },
  {
    id: 'nocode',
    name: 'No-Code (Bubble)',
    price: '$32-349/mo + dev',
    timeline: '2-8 weeks',
    customization: 'Platform-limited',
    targetCustomer: 'Non-technical founders'
  }
]

interface ComparisonRow {
  label: string
  key: keyof Competitor
  description: string
}

const comparisonRows: ComparisonRow[] = [
  { label: 'Price Point', key: 'price', description: 'Typical project or subscription cost' },
  { label: 'Delivery Timeline', key: 'timeline', description: 'Time from kickoff to production' },
  { label: 'Customization', key: 'customization', description: 'Level of flexibility and ownership' },
  { label: 'Target Customer', key: 'targetCustomer', description: 'Best fit customer profile' }
]

export function CompetitorMatrix() {
  return (
    <div className="competitor-matrix">
      <div className="matrix-intro">
        <p>
          AgentForge fills a critical gap: more affordable than traditional agencies,
          more capable than no-code, and designed for business owners rather than developers.
        </p>
      </div>

      <div className="matrix-table-container">
        <table className="matrix-table">
          <thead>
            <tr>
              <th className="feature-column">Feature</th>
              {competitors.map((comp) => (
                <th
                  key={comp.id}
                  className={`competitor-column ${comp.highlight ? 'highlight' : ''}`}
                >
                  {comp.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {comparisonRows.map((row) => (
              <tr key={row.key}>
                <td className="feature-cell">
                  <span className="feature-label">{row.label}</span>
                  <span className="feature-description">{row.description}</span>
                </td>
                {competitors.map((comp) => (
                  <td
                    key={comp.id}
                    className={`value-cell ${comp.highlight ? 'highlight' : ''}`}
                  >
                    {comp[row.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="matrix-insights">
        <h4 className="insights-title">Key Differentiators</h4>
        <div className="insights-grid">
          <div className="insight-card">
            <div className="insight-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            </div>
            <div className="insight-content">
              <span className="insight-label">vs Devin</span>
              <span className="insight-text">Observable multi-agent process with human checkpoints vs black-box single agent</span>
            </div>
          </div>
          <div className="insight-card">
            <div className="insight-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="1" x2="12" y2="23" />
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
            </div>
            <div className="insight-content">
              <span className="insight-label">vs Traditional</span>
              <span className="insight-text">60-80% cost reduction with comparable quality, delivered in weeks not months</span>
            </div>
          </div>
          <div className="insight-card">
            <div className="insight-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="16 18 22 12 16 6" />
                <polyline points="8 6 2 12 8 18" />
              </svg>
            </div>
            <div className="insight-content">
              <span className="insight-label">vs No-Code</span>
              <span className="insight-text">Real exportable code without platform limitations or vendor lock-in</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
